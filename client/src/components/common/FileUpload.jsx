import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { FaPaperclip, FaTimes, FaFile, FaImage } from 'react-icons/fa';

const FileUpload = ({ 
  files = [], 
  setFiles, 
  maxFiles = 5, 
  allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'], 
  maxSizeMB = 5,
  disabled = false,
  onFileSelect,
  className = ''
}) => {
  const [previews, setPreviews] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  
  const validateFile = useCallback((file) => {
    const isTypeAllowed = allowedTypes.some(type => {
      if (type === 'image/*') return file.type.startsWith('image/');
      if (type === 'application/*') return file.type.startsWith('application/');
      return file.type === type;
    });
    
    const isFileSizeValid = file.size <= (maxSizeMB * 1024 * 1024);
    return { isValid: isTypeAllowed && isFileSizeValid, isTypeAllowed, isFileSizeValid };
  }, [allowedTypes, maxSizeMB]);
  
  useEffect(() => {
    const oldPreviews = [...previews];
    
    if (files && files.length > 0) {
      try {
        const newPreviews = files.map(file => {
          const preview = {
            file,
            name: file.name,
            type: file.type,
            size: file.size,
            url: null
          };
          
          if (file.type.startsWith('image/')) {
            preview.url = URL.createObjectURL(file);
          }
          
          return preview;
        });
        
        setPreviews(newPreviews);
      } 
      catch (error) {
        console.error('Error creating previews:', error);
        setPreviews([]);
      }
    } 
    else {
      setPreviews([]);
    }
    
    setTimeout(() => {
      oldPreviews.forEach(preview => {
        if (preview.url) {
          URL.revokeObjectURL(preview.url);
        }
      });
    }, 0);
  }, [files]);
  
  useEffect(() => {
    return () => {
      previews.forEach(preview => {
        if (preview.url) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, []);
  
  const handleFileChange = useCallback((selectedFiles) => {
    if (disabled || !selectedFiles?.length) return;
    
    const validFiles = [];
    const errors = [];
    
    selectedFiles.forEach(file => {
      const validation = validateFile(file);
      
      if (validation.isValid) {
        validFiles.push(file);
      } 
      else {
        if (!validation.isTypeAllowed) {
          errors.push(`${file.name}: File type not allowed`);
        }
        if (!validation.isFileSizeValid) {
          errors.push(`${file.name}: File too large (max ${maxSizeMB}MB)`);
        }
      }
    });
    
    if (errors.length > 0) {
      console.warn('File validation errors:', errors);
      if (onFileSelect?.onError) {
        onFileSelect.onError(errors);
      }
    }
    
    if (validFiles.length === 0) {
      return;
    }
    
    const remainingSlots = maxFiles - files.length;
    const filesToAdd = remainingSlots <= 0 ? [] : validFiles.slice(0, remainingSlots);
    
    if (filesToAdd.length < validFiles.length) {
      if (onFileSelect?.onError) {
        onFileSelect.onError([`Maximum ${maxFiles} files allowed`]);
      }
    }
    
    if (filesToAdd.length > 0) {
      const updatedFiles = [...files, ...filesToAdd];
      setFiles(updatedFiles);
      
      if (onFileSelect?.onAdd) {
        onFileSelect.onAdd(filesToAdd);
      }
    }
  }, [disabled, files, maxFiles, validateFile, setFiles, onFileSelect]);
  
  const handleInputChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFileChange(selectedFiles);
    e.target.value = '';
  };
  
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } 
    else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);
  
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFileChange(droppedFiles);
  }, [disabled, handleFileChange]);
  
  const removeFile = useCallback((index) => {
    if (disabled) return;
    
    const fileToRemove = files[index];
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    
    if (onFileSelect?.onRemove) {
      onFileSelect.onRemove(fileToRemove);
    }
  }, [disabled, files, setFiles, onFileSelect]);
  
  const handleBrowseClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
          disabled 
            ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700' 
            : dragActive
              ? 'border-[#947BD3] dark:border-[#947BD3] bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 cursor-pointer hover:border-[#947BD3] dark:hover:border-[#947BD3] hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }`}
        onClick={handleBrowseClick}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            handleBrowseClick();
          }
        }}
        aria-label="Upload files"
      >
        <FaPaperclip className={`mx-auto h-8 w-8 mb-2 ${
          dragActive ? 'text-[#947BD3] dark:text-[#947BD3]' : 'text-gray-400 dark:text-gray-500'
        }`} />
        <p className={`text-sm ${
          dragActive ? 'text-[#7964ad] dark:text-[#947BD3]' : 'text-gray-500 dark:text-gray-400'
        }`}>
          {disabled 
            ? 'File upload disabled' 
            : dragActive
              ? 'Drop files here'
              : 'Click to upload files or drag and drop'
          }
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Max {maxFiles} files, up to {maxSizeMB}MB each
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Supported: {allowedTypes.join(', ')}
        </p>
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        className="hidden"
        multiple
        accept={allowedTypes.join(',')}
        disabled={disabled}
        aria-label="File input"
      />
      {previews.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {previews.map((preview, index) => (
            <motion.div 
              key={`file-${index}-${preview.name}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="relative group border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="aspect-video relative">
                {preview.url ? (
                  <img 
                    src={preview.url} 
                    alt={`Preview of ${preview.name}`} 
                    className="w-full h-full object-cover"
                    onError={() => {
                      console.error('Failed to load preview for:', preview.name);
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FaFile className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
                
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-white text-xs font-medium truncate" title={preview.name}>
                    {preview.name}
                  </p>
                  <p className="text-white/80 text-xs">
                    {formatFileSize(preview.size)}
                  </p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                disabled={disabled}
                aria-label={`Remove ${preview.name}`}
                title={`Remove ${preview.name}`}
              >
                <FaTimes className="h-3 w-3" />
              </button>
              
              <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white rounded px-1.5 py-0.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                {preview.type.startsWith('image/') ? (
                  <FaImage className="inline mr-1" />
                ) : (
                  <FaFile className="inline mr-1" />
                )}
                {preview.type.split('/')[1]?.toUpperCase()}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default FileUpload;