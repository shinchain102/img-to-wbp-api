// utils/imageUtils.js

const path = require('path');
const fs = require('fs');
const logger = require('../config/logging').logger;

/**
 * Utility class for image-related operations.
 */
class ImageUtils {

    /**
     * Validate if the provided image file is of an accepted type.
     * @param {string} filePath - The path to the image file.
     * @returns {boolean} - Returns true if the file is a valid image, false otherwise.
     */
    static isValidImageType(filePath) {
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
        const mimeType = this.getMimeType(filePath);

        if (allowedImageTypes.includes(mimeType)) {
            return true;
        }
        
        logger.warn(`Invalid image type: ${mimeType}`);
        return false;
    }

    /**
     * Get the MIME type of an image file based on its extension.
     * @param {string} filePath - The path to the image file.
     * @returns {string} - The MIME type of the file (e.g., 'image/jpeg', 'image/png').
     */
    static getMimeType(filePath) {
        const extname = path.extname(filePath).toLowerCase();

        const mimeTypes = {
            '.jpeg': 'image/jpeg',
            '.jpg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.avif': 'image/avif',
        };

        return mimeTypes[extname] || 'application/octet-stream';
    }

    /**
     * Check if the file exists at the given path.
     * @param {string} filePath - The path to the image file.
     * @returns {boolean} - Returns true if the file exists, false otherwise.
     */
    static fileExists(filePath) {
        try {
            return fs.existsSync(filePath);
        } catch (error) {
            logger.error(`Error checking file existence: ${error.message}`);
            return false;
        }
    }

    /**
     * Get the size of an image file in bytes.
     * @param {string} filePath - The path to the image file.
     * @returns {number} - The size of the file in bytes, or -1 if the file does not exist.
     */
    static getImageSize(filePath) {
        try {
            const stats = fs.statSync(filePath);
            return stats.size;
        } catch (error) {
            logger.error(`Error getting image size: ${error.message}`);
            return -1; // Return -1 if the file does not exist or there is an error
        }
    }

    /**
     * Get the dimensions (width and height) of an image.
     * @param {string} filePath - The path to the image file.
     * @returns {Promise<{width: number, height: number}>} - A promise that resolves with the image dimensions.
     */
    static async getImageDimensions(filePath) {
        try {
            const sharp = require('sharp');
            const metadata = await sharp(filePath).metadata();
            return { width: metadata.width, height: metadata.height };
        } catch (error) {
            logger.error(`Error getting image dimensions: ${error.message}`);
            throw new Error('Unable to get image dimensions');
        }
    }

    /**
     * Resize an image to a given width and height while maintaining aspect ratio.
     * @param {Buffer} imageBuffer - The image buffer.
     * @param {number} width - The target width.
     * @param {number} height - The target height.
     * @returns {Promise<Buffer>} - The resized image buffer.
     */
    static async resizeImage(imageBuffer, width, height) {
        try {
            const sharp = require('sharp');
            const resizedImageBuffer = await sharp(imageBuffer)
                .resize(width, height, { fit: 'inside', withoutEnlargement: true })
                .toBuffer();
            return resizedImageBuffer;
        } catch (error) {
            logger.error(`Error resizing image: ${error.message}`);
            throw new Error('Image resizing failed');
        }
    }

    /**
     * Check if an image exceeds the maximum allowed size.
     * @param {string} filePath - The path to the image file.
     * @param {number} maxSize - The maximum allowed size in bytes.
     * @returns {boolean} - Returns true if the image exceeds the size limit.
     */
    static isImageTooLarge(filePath, maxSize) {
        const imageSize = this.getImageSize(filePath);
        if (imageSize === -1) return false; // If the image does not exist, consider it valid (error handling)

        return imageSize > maxSize;
    }

    /**
     * Generate a unique file name for saving the image.
     * @param {string} originalFileName - The original name of the file.
     * @returns {string} - A unique file name.
     */
    static generateUniqueFileName(originalFileName) {
        const timestamp = Date.now();
        const extname = path.extname(originalFileName);
        const basename = path.basename(originalFileName, extname);

        return `${basename}_${timestamp}${extname}`;
    }
}

module.exports = ImageUtils;
