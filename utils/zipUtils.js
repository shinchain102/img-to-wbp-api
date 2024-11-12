// utils/imageServiceZipUtils.js

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const unzipper = require('unzipper');
const logger = require('../config/logging').logger;

/**
 * Utility class for handling image file zipping and unzipping operations.
 */
class ImageServiceZipUtils {

    /**
     * Create a zip file containing multiple image files.
     * @param {Array<string>} filePaths - An array of file paths to image files.
     * @param {string} outputZipPath - The path to save the output zip file.
     * @returns {Promise<string>} - A promise that resolves to the path of the created zip file.
     */
    static async zipImages(filePaths, outputZipPath) {
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(outputZipPath);
            const archive = archiver('zip', {
                zlib: { level: 9 } // Maximum compression
            });

            output.on('close', () => {
                logger.info(`Zip file created successfully at ${outputZipPath}`);
                resolve(outputZipPath);
            });

            archive.on('error', (err) => {
                logger.error(`Error while creating zip: ${err.message}`);
                reject(err);
            });

            archive.pipe(output);

            // Add image files to the zip archive
            filePaths.forEach((filePath) => {
                if (fs.existsSync(filePath)) {
                    archive.file(filePath, { name: path.basename(filePath) });
                } else {
                    logger.warn(`File does not exist: ${filePath}`);
                }
            });

            archive.finalize();
        });
    }

    /**
     * Unzip a zip file containing images to a specified directory.
     * @param {string} zipFilePath - The path to the zip file.
     * @param {string} outputDir - The directory to unzip files into.
     * @returns {Promise<Array<string>>} - A promise that resolves to an array of file paths of unzipped files.
     */
    static async unzipImages(zipFilePath, outputDir) {
        return new Promise((resolve, reject) => {
            const extractedFiles = [];

            // Ensure the output directory exists
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            fs.createReadStream(zipFilePath)
                .pipe(unzipper.Extract({ path: outputDir }))
                .on('entry', (entry) => {
                    const filePath = path.join(outputDir, entry.path);
                    extractedFiles.push(filePath);
                    entry.autodrain();
                })
                .on('close', () => {
                    logger.info(`Unzipped files to ${outputDir}`);
                    resolve(extractedFiles);
                })
                .on('error', (err) => {
                    logger.error(`Error while unzipping: ${err.message}`);
                    reject(err);
                });
        });
    }

    /**
     * Validate if a file is a valid zip file.
     * @param {string} filePath - The path to the file.
     * @returns {boolean} - Returns true if the file is a valid zip file, false otherwise.
     */
    static isValidZipFile(filePath) {
        const extname = path.extname(filePath).toLowerCase();
        if (extname === '.zip') {
            return true;
        }

        logger.warn(`Invalid file extension: ${extname}. Expected .zip file.`);
        return false;
    }

    /**
     * Get the size of a zip file in bytes.
     * @param {string} filePath - The path to the zip file.
     * @returns {number} - The size of the zip file in bytes, or -1 if an error occurs.
     */
    static getZipFileSize(filePath) {
        try {
            const stats = fs.statSync(filePath);
            return stats.size;
        } catch (error) {
            logger.error(`Error getting zip file size: ${error.message}`);
            return -1;
        }
    }

    /**
     * Extract a zip file's contents and return a list of the files contained inside it.
     * @param {string} zipFilePath - The path to the zip file.
     * @returns {Promise<Array<string>>} - A promise that resolves to an array of file paths.
     */
    static async listZipContents(zipFilePath) {
        try {
            const zip = await unzipper.Open.file(zipFilePath);
            const fileList = zip.files.map(file => file.path);
            logger.info(`Contents of zip file: ${fileList.join(', ')}`);
            return fileList;
        } catch (error) {
            logger.error(`Error listing zip contents: ${error.message}`);
            throw new Error('Unable to list zip contents');
        }
    }
}

module.exports = ImageServiceZipUtils;
