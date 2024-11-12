// controllers/imageConverter.js

const path = require('path');
const fs = require('fs');
const logger = require('../config/logging');
const imageService = require('../services/imageService');

// Directory to store processed files temporarily
const outputDir = path.join(__dirname, '..', 'tmp');

// Single image conversion handler
exports.convertImage = async (req, res) => {
    try {
        const { outputFormat, quality = 80, compression = 'medium' } = req.body;
        const image = req.file;

        // Validate request
        if (!image) {
            return res.status(400).json({ message: 'No image uploaded' });
        }
        if (!['webp', 'avif'].includes(outputFormat)) {
            return res.status(400).json({ message: 'Invalid output format. Supported formats: webp, avif' });
        }

        // Generate output file path
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        const outputPath = path.join(outputDir, `${path.parse(image.originalname).name}.${outputFormat}`);

        // Process image conversion
        await imageService.convertImage(image.path, outputFormat, quality, compression, outputPath);

        // Prepare converted file for download
        res.download(outputPath, (err) => {
            if (err) {
                logger.error(`Error sending converted file: ${err.message}`);
                return res.status(500).json({ message: 'Error downloading the file' });
            }

            // Clean up: delete output file after sending
            fs.unlinkSync(outputPath);
            logger.info(`Successfully processed and delivered image: ${outputPath}`);
        });
    } catch (error) {
        logger.error(`Error in image conversion: ${error.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
};
