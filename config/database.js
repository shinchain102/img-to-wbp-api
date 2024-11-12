// config/database.js

const { Pool } = require('pg'); // PostgreSQL client
require('dotenv').config(); // Load environment variables from .env file

// Create a new pool instance with connection settings
const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    max: 10, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if no connection can be established
});

// Database connection test (optional but recommended)
(async () => {
    try {
        const client = await pool.connect();
        console.log('Connected to the database');
        client.release();
    } catch (error) {
        console.error('Database connection failed', error);
        process.exit(1); // Exit process with failure if the database connection fails
    }
})();

/**
 * Executes a query on the database pool.
 * @param {string} text - The SQL query text
 * @param {Array} params - The query parameters
 * @returns {Promise} - The result of the query
 */
async function query(text, params) {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
}

module.exports = {
    query,
    pool, // Exporting the pool in case you need direct access
};
