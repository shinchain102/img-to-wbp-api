// middlewares/auth.js

const apiKeyService = require('../config/api-keys');
const logger = require('../config/logging');

// Middleware to validate API key for each request
const authenticateApiKey = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];
        
        // Check if API key is provided
        if (!apiKey) {
            logger.warn('Missing API key in request');
            return res.status(401).json({ message: 'API key is required' });
        }

        // Validate API key
        const isValidKey = await apiKeyService.validateApiKey(apiKey);
        if (!isValidKey) {
            logger.warn(`Invalid API key: ${apiKey}`);
            return res.status(403).json({ message: 'Invalid API key' });
        }

        // Proceed if valid
        logger.info(`Valid API key access granted: ${apiKey}`);
        next();
    } catch (error) {
        logger.error(`API key authentication error: ${error.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = authenticateApiKey;
