import fs from 'fs/promises';
import path from 'path';
import { ApiError } from './ApiError.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const TEMP_DIR = path.resolve('./public/temp');
const UPLOADS_DIR = path.resolve('../client/dist/uploads');
const FALLBACK_UPLOADS_DIR = path.resolve('./public/uploads');

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_FILES = {
  '.jpg': { mime: 'image/jpeg', category: 'image' },
  '.jpeg': { mime: 'image/jpeg', category: 'image' },
  '.png': { mime: 'image/png', category: 'image' },
  '.gif': { mime: 'image/gif', category: 'image' },
  '.webp': { mime: 'image/webp', category: 'image' },
  '.pdf': { mime: 'application/pdf', category: 'document' },
  '.doc': { mime: 'application/msword', category: 'document' },
  '.docx': { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', category: 'document' },
  '.txt': { mime: 'text/plain', category: 'document' },
  '.csv': { mime: 'text/csv', category: 'document' },
  '.json': { mime: 'application/json', category: 'document' }
};

const FILE_SIGNATURES = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]]
};

const validateFile = async (localFilePath, originalFilename) => {
  try {
    const stats = await fs.stat(localFilePath);
    
    if (stats.size === 0) {
      throw new ApiError(400, 'File is empty');
    }
    
    if (stats.size > MAX_FILE_SIZE) {
      throw new ApiError(400, `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }
    
    const fileExt = path.extname(originalFilename || localFilePath).toLowerCase();
    const allowedFile = ALLOWED_FILES[fileExt];
    
    if (!allowedFile) {
      throw new ApiError(400, `File type not allowed. Allowed types: ${Object.keys(ALLOWED_FILES).join(', ')}`);
    }
    
    if (FILE_SIGNATURES[allowedFile.mime]) {
      const isValidSignature = await validateFileSignature(localFilePath, allowedFile.mime);
      if (!isValidSignature) {
        throw new ApiError(400, 'File content does not match file extension');
      }
    }
    
    return { stats, fileExt, allowedFile };
  } 
  catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, 'File validation failed');
  }
};

const validateFileSignature = async (filePath, mimeType) => {
  try {
    const signatures = FILE_SIGNATURES[mimeType];
    if (!signatures) return true; 
    const buffer = Buffer.alloc(16); 
    const fd = await fs.open(filePath, 'r');
    await fd.read(buffer, 0, 16, 0);
    await fd.close();
    
    return signatures.some(signature => 
      signature.every((byte, index) => buffer[index] === byte)
    );
  } 
  catch (error) {
    console.error('Error validating file signature:', error);
    return false;
  }
};

const generateFileHash = async (filePath) => {
  try {
    const fileBuffer = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  } 
  catch (error) {
    console.error('Error generating file hash:', error);
    return null;
  }
};

const storeFile = async (localFilePath, originalFilename = null, metadata = {}) => {
  try {
    await initializeStorage();
    const { stats, fileExt, allowedFile } = await validateFile(localFilePath, originalFilename);
    const filename = originalFilename || path.basename(localFilePath);
    const fileHash = await generateFileHash(localFilePath);
    
    if (fileHash) {
      const existingFile = await findFileByHash(fileHash);
      if (existingFile) {
        await clearFile(localFilePath);
        return existingFile;
      }
    }
    
    const uniqueFilename = `${uuidv4()}${fileExt}`;
    const destinationPath = path.join(UPLOADS_DIR, uniqueFilename);
    
    try {
      await fs.copyFile(localFilePath, destinationPath);
      
      const copiedStats = await fs.stat(destinationPath);
      if (copiedStats.size !== stats.size) {
        await clearFile(destinationPath);
        throw new ApiError(500, 'File copy verification failed');
      }
      
      await clearFile(localFilePath);
      
      const result = {
        id: uuidv4(),
        original_filename: filename,
        filename: uniqueFilename,
        path: destinationPath,
        size: stats.size,
        url: `/uploads/${uniqueFilename}`,
        secure_url: `/uploads/${uniqueFilename}`,
        mime_type: allowedFile.mime,
        category: allowedFile.category,
        hash: fileHash,
        uploaded_at: new Date().toISOString(),
        metadata: {
          ...metadata,
          checksum: fileHash?.substring(0, 16), 
          upload_ip: metadata.ip || null,
          user_id: metadata.userId || null
        }
      };
      
      await saveFileMetadata(result);
      return result;
    } 
    catch (copyError) {
      await clearFile(destinationPath);
      throw new ApiError(500, `Error storing file: ${copyError.message}`);
    }
    
  } 
  catch (error) {
    console.error('Error during file storage process:', error);
    await clearFile(localFilePath);
    
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'File storage failed');
  }
};

const saveFileMetadata = async (fileData) => {
  try {
    const metadataDir = path.join(UPLOADS_DIR, '.metadata');
    await ensureDirExists(metadataDir);
    const metadataFile = path.join(metadataDir, `${fileData.filename}.json`);
    await fs.writeFile(metadataFile, JSON.stringify(fileData, null, 2));
  } 
  catch (error) {
    console.error('Error saving file metadata:', error);
  }
};

const findFileByHash = async (hash) => {
  try {
    const metadataDir = path.join(UPLOADS_DIR, '.metadata');
    const files = await fs.readdir(metadataDir).catch(() => []);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const metadataPath = path.join(metadataDir, file);
          const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
          
          if (metadata.hash === hash) {
            const filePath = path.join(UPLOADS_DIR, metadata.filename);
            await fs.access(filePath);
            return metadata;
          }
        } 
        catch (error) {
          continue;
        }
      }
    }  
    return null;
  } 
  catch (error) {
    console.error('Error finding file by hash:', error);
    return null;
  }
};

const cleanupOldFiles = async (daysOld = 30) => {
  try {
    const files = await fs.readdir(UPLOADS_DIR);
    const metadataDir = path.join(UPLOADS_DIR, '.metadata');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    let deletedCount = 0;
    
    for (const filename of files) {
      if (filename === '.metadata') continue;
      try {
        const filePath = path.join(UPLOADS_DIR, filename);
        const stats = await fs.stat(filePath);

        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          const metadataFile = path.join(metadataDir, `${filename}.json`);
          await fs.unlink(metadataFile).catch(() => {}); 
          deletedCount++;
          console.log(`Cleaned up old file: ${filename}`);
        }
      } 
      catch (error) {
        console.error(`Error processing file ${filename} during cleanup:`, error);
      }
    }
    console.log(`Cleanup completed. Deleted ${deletedCount} old files.`);
    return deletedCount;
  } 
  catch (error) {
    console.error('Error during file cleanup:', error);
    return 0;
  }
};

const getStorageStats = async () => {
  try {
    const files = await fs.readdir(UPLOADS_DIR);
    let totalSize = 0;
    let fileCount = 0;
    const categories = {};
    
    for (const filename of files) {
      if (filename === '.metadata') continue;
      
      try {
        const filePath = path.join(UPLOADS_DIR, filename);
        const stats = await fs.stat(filePath);
        const ext = path.extname(filename).toLowerCase();
        const category = ALLOWED_FILES[ext]?.category || 'unknown'; 
        totalSize += stats.size;
        fileCount++;
        categories[category] = (categories[category] || 0) + 1;
      } 
      catch (error) {
        continue;
      }
    }
    return {
      totalFiles: fileCount,
      totalSize,
      totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
      categories,
      maxFileSize: MAX_FILE_SIZE,
      maxFileSizeMB: Math.round(MAX_FILE_SIZE / (1024 * 1024))
    };
  } 
  catch (error) {
    console.error('Error getting storage stats:', error);
    return null;
  }
};

const ensureDirExists = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

const initializeStorage = async () => {
  try {
    await ensureDirExists(TEMP_DIR);
    try {
      await ensureDirExists(UPLOADS_DIR);
      await ensureDirExists(path.join(UPLOADS_DIR, '.metadata'));
      console.log(`Using upload directory: ${UPLOADS_DIR}`);
    } 
    catch (error) {
      console.warn(`Could not use ${UPLOADS_DIR}, falling back to ${FALLBACK_UPLOADS_DIR}`);
      await ensureDirExists(FALLBACK_UPLOADS_DIR);
      await ensureDirExists(path.join(FALLBACK_UPLOADS_DIR, '.metadata'));
      Object.defineProperty(module.exports, 'UPLOADS_DIR', { 
        value: FALLBACK_UPLOADS_DIR,
        writable: false
      });
    }
    return true;
  } 
  catch (error) {
    console.error('Error initializing storage:', error);
    return false;
  }
};

const clearFile = async (localFilePath) => {
  try {
    await fs.access(localFilePath);
    await fs.unlink(localFilePath);
    console.log(`Successfully deleted file: ${localFilePath}`);
  } 
  catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Error deleting file at ${localFilePath}:`, error);
    }
  }
};

const deleteFile = async (fileUrl) => {
  try {
    const filename = path.basename(fileUrl);
    
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new ApiError(400, 'Invalid filename');
    }

    const filePath = path.join(UPLOADS_DIR, filename);
    const metadataPath = path.join(UPLOADS_DIR, '.metadata', `${filename}.json`);
    await fs.access(filePath);
    await fs.unlink(filePath);
    await fs.unlink(metadataPath).catch(() => {}); 
    console.log(`File deleted successfully: ${filename}`);
    return true;  
  } 
  catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`File not found for deletion: ${fileUrl}`);
      return false;
    }
    console.error('Error deleting file:', error);

    if (error instanceof ApiError) throw error;
    return false;
  }
};

const getFileInfo = async (filename) => {
  try {
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new ApiError(400, 'Invalid filename');
    }
    
    const filePath = path.join(UPLOADS_DIR, filename);
    const metadataPath = path.join(UPLOADS_DIR, '.metadata', `${filename}.json`);
    const stats = await fs.stat(filePath);
    let metadata = {};
    try {
      const metadataContent = await fs.readFile(metadataPath, 'utf8');
      metadata = JSON.parse(metadataContent);
    } 
    catch (error) {
    }
    return {
      filename,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      url: `/uploads/${filename}`,
      mime_type: metadata.mime_type || getMimeType(path.extname(filename)),
      category: metadata.category,
      hash: metadata.hash,
      metadata: metadata.metadata || {}
    };  
  } 
  catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
};

const getMimeType = (extension) => {
  const allowedFile = ALLOWED_FILES[extension.toLowerCase()];
  return allowedFile ? allowedFile.mime : 'application/octet-stream';
};

const listFiles = async (options = {}) => {
  const {
    limit = 100,
    offset = 0,
    category = null,
    mimeType = null,
    sortBy = 'created',
    sortOrder = 'desc'
  } = options;
  
  try {
    const files = await fs.readdir(UPLOADS_DIR);
    const fileInfos = [];
    
    for (const filename of files) {
      if (filename === '.metadata') continue;
      
      try {
        const fileInfo = await getFileInfo(filename);
        if (fileInfo) {
          if (category && fileInfo.category !== category) continue;
          if (mimeType && fileInfo.mime_type !== mimeType) continue;
          
          fileInfos.push(fileInfo);
        }
      } 
      catch (error) {
        continue;
      }
    }
    
    fileInfos.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'created' || sortBy === 'modified') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (sortOrder === 'desc') {
        return bVal > aVal ? 1 : -1;
      } 
      else {
        return aVal > bVal ? 1 : -1;
      }
    });
    return fileInfos.slice(offset, offset + limit);  
  } 
  catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
};

export { 
  storeFile, 
  clearFile, 
  deleteFile, 
  getFileInfo,
  listFiles,
  cleanupOldFiles,
  getStorageStats,
  UPLOADS_DIR,
  ALLOWED_FILES,
  initializeStorage 
};