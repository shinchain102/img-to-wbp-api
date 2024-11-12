// middlewares/single-convert.js

const sharp = require('sharp');
const logger = require('../config/logging').logger;
const path = require('path');
const fs = require('fs');
const { fileTypeFromBuffer } = require('file-type');

// Helper function to validate image type (WebP or AVIF)
const validateImageType = async (buffer) => {
    try {
        const { ext } = await fileTypeFromBuffer(buffer);
        if (['jpeg', 'png', 'webp', 'avif'].includes(ext)) {
            return ext; // Return the extension if it's valid
        } else {
            throw new Error('Invalid image format. Only JPEG, PNG, WebP, or AVIF are supported.');
        }
    } catch (error) {
        throw new Error('Error detecting image type');
    }
};

// Function to handle image conversion
const convertImage = async (buffer, outputFormat, quality, compression) => {
    try {
        // Validate input image format
        const imageFormat = await validateImageType(buffer);

        // Set quality and compression settings based on the input parameters
        let image = sharp(buffer);
        image = image.toFormat(outputFormat, {
            quality: quality,
            chromaSubsampling: compression === 'high' ? '4:4:4' : '4:2:0',
        });

        // Apply compression for better results
        if (compression === 'low') {
            image = image.resize({ width: 800 }); // Low compression could mean a smaller image
        } else if (compression === 'medium') {
            image = image.resize({ width: 1200 }); // Medium compression with reasonable size
        } // High compression will leave the image as it is

        // Convert and return the buffer of the new image
        const convertedBuffer = await image.toBuffer();

        // Log successful conversion
        logger.info(`Successfully converted image to ${outputFormat} with ${compression} compression.`);
        return convertedBuffer;
    } catch (error) {
        logger.error(`Error during image conversion: ${error.message}`);
        throw new Error('Image conversion failed.');
    }
};

// Middleware to handle single image conversion request
const singleConvertMiddleware = async (req, res, next) => {
    try {
        // Validate input: check if the file is provided and if output format is supported
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided.' });
        }

        // Extract parameters from the request body
        const { outputFormat = 'webp', quality = 80, compression = 'medium' } = req.body;

        // Validate outputFormat
        const validFormats = ['webp', 'avif'];
        if (!validFormats.includes(outputFormat)) {
            return res.status(400).json({ message: 'Invalid output format. Supported formats are webp and avif.' });
        }

        // Ensure the quality and compression values are within acceptable ranges
        if (quality < 1 || quality > 100) {
            return res.status(400).json({ message: 'Quality must be between 1 and 100.' });
        }

        if (!['low', 'medium', 'high'].includes(compression)) {
            return res.status(400).json({ message: 'Invalid compression type. Supported values are low, medium, high.' });
        }

        // Convert the image using Sharp based on the provided parameters
        const convertedBuffer = await convertImage(req.file.buffer, outputFormat, quality, compression);

        // Return the converted image as an attachment
        res.setHeader('Content-Type', `image/${outputFormat}`);
        res.setHeader('Content-Disposition', `attachment; filename=converted-image.${outputFormat}`);
        res.status(200).send(convertedBuffer);
    } catch (error) {
        logger.error(`Image conversion failed: ${error.message}`);
        res.status(500).json({ message: error.message || 'An error occurred during image conversion' });
    }
};

module.exports = singleConvertMiddleware;
