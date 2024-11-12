// models/conversionJob.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Assuming you've set up Sequelize
const logger = require('../config/logging').logger;

// Define the conversionJob model
const ConversionJob = sequelize.define('ConversionJob', {
    jobId: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4, // Automatically generate UUIDs for each job
    },
    status: {
        type: DataTypes.ENUM('pending', 'in-progress', 'completed', 'failed'),
        defaultValue: 'pending', // Default job status is 'pending'
    },
    outputFormat: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: [['webp', 'avif']], // Only allow 'webp' or 'avif' formats
        },
    },
    quality: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 100, // Quality between 1 and 100
        },
    },
    compression: {
        type: DataTypes.ENUM('low', 'medium', 'high'),
        defaultValue: 'medium',
    },
    zipUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isUrl: true, // Ensure zipUrl is a valid URL when provided
        },
    },
    errorMessage: {
        type: DataTypes.STRING,
        allowNull: true, // Optional field for error messages when job fails
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW, // Default to current timestamp when job is created
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
});

// Method to create a new conversion job
ConversionJob.createJob = async function (outputFormat, quality, compression) {
    try {
        const job = await this.create({
            outputFormat,
            quality,
            compression,
        });
        logger.info(`Created new conversion job with jobId: ${job.jobId}`);
        return job;
    } catch (error) {
        logger.error(`Error creating conversion job: ${error.message}`);
        throw new Error('Failed to create conversion job');
    }
};

// Method to update the job status
ConversionJob.updateJobStatus = async function (jobId, status, errorMessage = null, zipUrl = null) {
    try {
        const job = await this.findOne({ where: { jobId } });
        if (!job) {
            throw new Error('Job not found');
        }
        
        // Update job status and additional details
        await job.update({
            status,
            errorMessage,
            zipUrl,
        });

        logger.info(`Updated conversion job status for jobId: ${jobId} to ${status}`);
        return job;
    } catch (error) {
        logger.error(`Error updating conversion job status: ${error.message}`);
        throw new Error('Failed to update job status');
    }
};

// Method to get a job's details by jobId
ConversionJob.getJobById = async function (jobId) {
    try {
        const job = await this.findOne({ where: { jobId } });
        if (!job) {
            throw new Error('Job not found');
        }
        return job;
    } catch (error) {
        logger.error(`Error fetching conversion job details for jobId: ${jobId}: ${error.message}`);
        throw new Error('Failed to fetch job details');
    }
};

module.exports = ConversionJob;
