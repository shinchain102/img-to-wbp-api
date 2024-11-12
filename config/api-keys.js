// config/api-keys.js

const db = require('./database'); // Import your database configuration
const crypto = require('crypto'); // For secure hashing, if needed

/**
 * Retrieve API keys securely from the database.
 * @returns {Promise<Set>} - A set of valid API keys.
 */
async function getValidApiKeys() {
    try {
        // Fetch API keys from the database
        const keys = await db.query('SELECT apiKey FROM ApiKeys WHERE isActive = true');
        return new Set(keys.map((key) => key.apiKey));
    } catch (error) {
        console.error('Error fetching API keys:', error);
        throw new Error('Failed to load API keys');
    }
}

/**
 * Check if an API key is valid by verifying against the database.
 * @param {string} apiKey - The API key to validate.
 * @returns {Promise<boolean>} - True if valid, false otherwise.
 */
async function isValidApiKey(apiKey) {
    const validApiKeys = await getValidApiKeys();
    return validApiKeys.has(apiKey);
}

/**
 * Generate a new API key.
 * @returns {string} - A secure, random API key.
 */
function generateApiKey() {
    return crypto.randomBytes(32).toString('hex'); // Generates a 64-character API key
}

module.exports = {
    isValidApiKey,
    generateApiKey,
};
