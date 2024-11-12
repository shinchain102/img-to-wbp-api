// services/imageService.js

const sharp = require('sharp');
const logger = require('../config/logging').logger;
const fs = require('fs');
const path = require('path');
const { tmpdir } = require('os'); // To use temporary directories for saving files

/**
 * Image service for processing images (conversion, resizing, compression).
 */
class ImageService {
    /**
     * Convert an image to the specified format (WebP or AVIF).
     * @param {Buffer} imageBuffer - The image file as a buffer.
     * @param {string} format - The target output format ('webp' or 'avif').
     * @param {number} quality - The quality level of the output image (1-100).
     * @param {string} compression - The compression level ('low', 'medium', 'high').
     * @returns {Promise<Buffer>} - The converted image as a buffer.
     */
    static async convertImage(imageBuffer, format, quality = 80, compression = 'medium') {
        try {
            // Set compression options
            const compressionOptions = this.getCompressionOptions(compression);
            
            // Perform the image conversion
            const outputBuffer = await sharp(imageBuffer)
                .toFormat(format, {
                    quality,
                    ...compressionOptions,
                })
                .toBuffer();

            logger.info(`Successfully converted image to ${format} with quality ${quality}`);
            return outputBuffer;
        } catch (error) {
            logger.error(`Error during image conversion: ${error.message}`);
            throw new Error('Image conversion failed');
        }
    }

    /**
     * Get compression options based on the compression level.
     * @param {string} compression - The compression level ('low', 'medium', 'high').
     * @returns {Object} - Compression options.
     */
    static getCompressionOptions(compression) {
        switch (compression) {
            case 'low':
                return { effort: 1 }; // Low compression effort
            case 'medium':
                return { effort: 5 }; // Default medium compression effort
            case 'high':
                return { effort: 9 }; // High compression effort
            default:
                return { effort: 5 }; // Default to medium if invalid compression is provided
        }
    }

    /**
     * Save an image to the filesystem.
     * @param {Buffer} imageBuffer - The image file as a buffer.
     * @param {string} outputPath - The path where the image will be saved.
     * @returns {Promise<string>} - The file path of the saved image.
     */
    static async saveImage(imageBuffer, outputPath) {
        try {
            const writeStream = fs.createWriteStream(outputPath);
            writeStream.write(imageBuffer);
            writeStream.end();
            return new Promise((resolve, reject) => {
                writeStream.on('finish', () => resolve(outputPath));
                writeStream.on('error', (err) => reject(new Error('Failed to save image: ' + err.message)));
            });
        } catch (error) {
            logger.error(`Error saving image: ${error.message}`);
            throw new Error('Failed to save image');
        }
    }

    /**
     * Convert multiple images in a batch and return a zip URL for downloading.
     * @param {Array<Buffer>} imageBuffers - An array of image buffers to convert.
     * @param {string} format - The target output format ('webp' or 'avif').
     * @param {number} quality - The quality level of the output images (1-100).
     * @param {string} compression - The compression level ('low', 'medium', 'high').
     * @returns {Promise<string>} - The URL of the generated zip file.
     */
    static async bulkConvertImages(imageBuffers, format, quality = 80, compression = 'medium') {
        try {
            const convertedImages = [];

            // Process each image buffer in the array
            for (let i = 0; i < imageBuffers.length; i++) {
                const convertedImage = await this.convertImage(imageBuffers[i], format, quality, compression);
                const tempFilePath = path.join(tmpdir(), `converted_image_${Date.now()}_${i}.${format}`);
                await this.saveImage(convertedImage, tempFilePath);
                convertedImages.push(tempFilePath);
            }

            // Create a ZIP file from the converted images
            const zipFilePath = await this.createZipFromImages(convertedImages);

            // Clean up the temporary files
            convertedImages.forEach((filePath) => fs.unlinkSync(filePath));

            logger.info('Bulk image conversion completed successfully.');
            return zipFilePath;
        } catch (error) {
            logger.error(`Error during bulk image conversion: ${error.message}`);
            throw new Error('Bulk image conversion failed');
        }
    }

    /**
     * Create a ZIP file from an array of image file paths.
     * @param {Array<string>} imagePaths - An array of file paths to include in the zip.
     * @returns {Promise<string>} - The path to the generated zip file.
     */
    static async createZipFromImages(imagePaths) {
        const archiver = require('archiver');
        const zipFilePath = path.join(tmpdir(), `images_${Date.now()}.zip`);
        const output = fs.createWriteStream(zipFilePath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        return new Promise((resolve, reject) => {
            output.on('close', () => resolve(zipFilePath));
            archive.on('error', (err) => reject(new Error('Failed to create zip file: ' + err.message)));

            archive.pipe(output);

            // Append each image file to the zip archive
            imagePaths.forEach((imagePath) => {
                archive.file(imagePath, { name: path.basename(imagePath) });
            });

            archive.finalize();
        });
    }
}

module.exports = ImageService;
