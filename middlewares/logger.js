// middlewares/logger.js

const winston = require('winston');
const path = require('path');

// Define log file paths
const logDir = path.join(__dirname, '..', 'logs');

// Create logs directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Configure winston logger
const logger = winston.createLogger({
    level: 'info', // Default log level
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
            level: 'info' // Logs to the console will be at 'info' level
        }),
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error' // Error level logs to this file
        }),
        new winston.transports.File({
            filename: path.join(logDir, 'combined.log') // All logs go to this file
        })
    ]
});

// Add an additional transport for request logs if needed
const requestLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({
            filename: path.join(logDir, 'requests.log'),
            level: 'info' // Logs request-related information
        })
    ]
});

// Function to log HTTP requests (for Express middleware)
const logRequest = (req, res, next) => {
    const logMessage = `${req.method} ${req.originalUrl} - ${req.ip}`;
    logger.info(logMessage);
    next();
};

// Function to log errors
const logError = (error, req, res, next) => {
    const errorMessage = `Error: ${error.message}, Stack: ${error.stack}`;
    logger.error(errorMessage);
    res.status(500).json({ message: 'Internal server error' });
};

// Export logger and request logging function
module.exports = {
    logger,
    requestLogger,
    logError
};
