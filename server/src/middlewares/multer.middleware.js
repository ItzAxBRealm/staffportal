import multer from "multer";
import path from "path";
import fs from "fs";

const tempDir = './public/temp';
if (!fs.existsSync(tempDir)) {
    console.log(`Creating temp directory: ${tempDir}`);
    fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/temp');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ];
    
    console.log(`Multer received file: ${file.originalname} (${file.mimetype})`);
    console.log(`File details:`, { 
        fieldname: file.fieldname,
        originalname: file.originalname,
        encoding: file.encoding,
        mimetype: file.mimetype,
        size: file.size || 'unknown'
    });
    
    if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
        console.log(`File accepted: ${file.originalname}`);
        cb(null, true);
    } 
    else {
        console.log(`File rejected: ${file.originalname} - type not allowed`);
        cb(new Error(`File type not allowed: ${file.mimetype}`), false);
    }
};

const multerInstance = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, 
        files: 5 
    }
});

export const upload = {
    single: (fieldName) => {
        return (req, res, next) => {
            console.log(`Processing single file upload for field: ${fieldName}`);
            const upload = multerInstance.single(fieldName);
            upload(req, res, (err) => {
                if (err) {
                    console.error(`File upload error: ${err.message}`);
                    return res.status(400).json({ 
                        success: false, 
                        message: `File upload failed: ${err.message}` 
                    });
                }
                next();
            });
        };
    },
    array: (fieldName, maxCount) => {
        return (req, res, next) => {
            console.log(`Processing multiple file upload for field: ${fieldName}, max: ${maxCount}`);
            const upload = multerInstance.array(fieldName, maxCount);
            upload(req, res, (err) => {
                if (err) {
                    console.error(`File upload error: ${err.message}`);
                    return res.status(400).json({ 
                        success: false, 
                        message: `File upload failed: ${err.message}` 
                    });
                }
                next();
            });
        };
    }
};
