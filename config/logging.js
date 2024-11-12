// config/logging.js

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, json } = format;
require('dotenv').config();

// Define custom log format for readability
const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

// Create the logger instance
const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info', // Default to 'info' level if LOG_LEVEL is not set
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Standard timestamp format
        process.env.NODE_ENV === 'production' ? json() : colorize(), // JSON format in production, colorized in dev
        logFormat
    ),
    transports: [
        new transports.Console(), // Log to console
        new transports.File({ filename: 'logs/error.log', level: 'error' }), // Only errors to error.log
        new transports.File({ filename: 'logs/combined.log' }) // All logs to combined.log
    ],
    exceptionHandlers: [
        new transports.File({ filename: 'logs/exceptions.log' }) // Capture unhandled exceptions
    ],
    rejectionHandlers: [
        new transports.File({ filename: 'logs/rejections.log' }) // Capture unhandled promise rejections
    ]
});

// Optional: Stream method for integrating with external logging libraries (e.g., Morgan for HTTP logging)
logger.stream = {
    write: (message) => logger.info(message.trim()),
};

module.exports = logger;
