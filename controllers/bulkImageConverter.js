// controllers/bulkImageConverter.js

const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const logger = require('../config/logging');
const imageService = require('../services/imageService');
const zipUtils = require('../utils/zipUtils');
const ConversionJob = require('../models/conversionJob');

// Directory to store processed files temporarily
const outputDir = path.join(__dirname, '..', 'tmp');

// Initialize bulk conversion process
exports.startBulkConversion = async (req, res) => {
    try {
        const { outputFormat, quality = 80, compression = 'medium' } = req.body;
        const images = req.files;

        // Validate request
        if (!images || images.length === 0) {
            return res.status(400).json({ message: 'No images uploaded' });
        }

        // Create a unique job ID for tracking
        const jobId = uuidv4();

        // Store job details
        await ConversionJob.create({
            jobId,
            status: 'processing',
            outputFormat,
            quality,
            compression,
            fileCount: images.length
        });

        // Start async conversion process
        processBulkConversion(images, outputFormat, quality, compression, jobId);

        // Respond with job ID for status polling
        res.status(202).json({ message: 'Bulk conversion started', jobId });
    } catch (error) {
        logger.error(`Error in starting bulk conversion: ${error.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Poll conversion job status
exports.getBulkConversionStatus = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await ConversionJob.findByJobId(jobId);

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        // Check if the job is completed and provide download link
        if (job.status === 'completed') {
            return res.json({ 
                status: job.status, 
                downloadUrl: `${req.protocol}://${req.get('host')}/downloads/${jobId}.zip` 
            });
        }

        // Return current job status
        res.json({ status: job.status });
    } catch (error) {
        logger.error(`Error fetching bulk conversion status: ${error.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Asynchronous processing of bulk images
const processBulkConversion = async (images, outputFormat, quality, compression, jobId) => {
    try {
        const convertedFiles = [];
        
        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Process each image asynchronously
        for (const image of images) {
            const outputPath = path.join(outputDir, `${uuidv4()}.${outputFormat}`);
            await imageService.convertImage(image.path, outputFormat, quality, compression, outputPath);
            convertedFiles.push(outputPath);
        }

        // Zip all converted files
        const zipPath = path.join(outputDir, `${jobId}.zip`);
        await zipUtils.zipFiles(convertedFiles, zipPath);

        // Clean up individual files after zipping
        for (const filePath of convertedFiles) {
            fs.unlinkSync(filePath);
        }

        // Update job status to completed
        await ConversionJob.updateJobStatus(jobId, 'completed');

        logger.info(`Bulk conversion job ${jobId} completed successfully.`);
    } catch (error) {
        logger.error(`Error in bulk conversion job ${jobId}: ${error.message}`);
        
        // Update job status to failed
        await ConversionJob.updateJobStatus(jobId, 'failed');
    }
};
