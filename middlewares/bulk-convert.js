// middlewares/bulk-convert.js

const multer = require('multer');
const path = require('path');
const logger = require('../config/logging');

// Set up Multer for handling file uploads
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true); // Accept the file
    } else {
        logger.warn(`Rejected file type: ${file.mimetype}`);
        cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and AVIF images are allowed.'), false);
    }
};

// Middleware for bulk file upload handling with file size limit
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Limit file size to 5 MB per file
}).array('images', 20); // Maximum of 20 files per bulk conversion

// Wrapper middleware to handle Multer errors and proceed to the controller
const bulkConvertMiddleware = (req, res, next) => {
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // Multer-specific errors
            logger.error(`Multer error during file upload: ${err.message}`);
            return res.status(400).json({ message: `File upload error: ${err.message}` });
        } else if (err) {
            // General errors
            logger.error(`Error during file upload: ${err.message}`);
            return res.status(400).json({ message: err.message });
        }
        
        // If no files are uploaded
        if (!req.files || req.files.length === 0) {
            logger.warn('No images uploaded in bulk-convert request');
            return res.status(400).json({ message: 'Please upload at least one image' });
        }

        // Proceed if all checks pass
        logger.info(`Successfully uploaded ${req.files.length} images for bulk conversion`);
        next();
    });
};

module.exports = bulkConvertMiddleware;
