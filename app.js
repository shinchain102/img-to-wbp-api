const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const dotenv = require('dotenv');
const { connectDB } = require('./config/database');
const logger = require('./middlewares/logger');
const authMiddleware = require('./middlewares/auth');
const apiKeyValidator = require('./middlewares/apiKeyValidator');
const singleConvertRouter = require('./routes/single-convert');
const bulkConvertRouter = require('./routes/bulk-convert');
const { errorHandler } = require('./middlewares/errorHandler');
const { initializeJobQueue } = require('./services/jobQueue');

// Initialize environment variables
dotenv.config();

// Initialize database connection
connectDB();

// Initialize the app
const app = express();

// Security middleware
app.use(helmet());

// Enable CORS
app.use(cors());

// Setup body parser for JSON and form-data (for file uploads)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable file uploads with express-fileupload
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max file size
  createParentPath: true,
}));

// Apply compression for faster delivery of responses
app.use(compression());

// Set up rate limiting (optional but recommended for production)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

app.use(limiter);

// Setup Morgan logging for HTTP request logging
app.use(morgan('combined', { stream: logger.stream }));

// API Key validation middleware for sensitive routes
app.use('/convert', apiKeyValidator);

// Routes
app.use('/convert', singleConvertRouter);
app.use('/bulk-convert', bulkConvertRouter);

// Initialize job queue for bulk conversion
initializeJobQueue();

// Serve static files in production (e.g., for handling file downloads)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
}

// Health check route for monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'API is healthy' });
});

// Error handling middleware
app.use(errorHandler);

// Global error handler
app.use((err, req, res, next) => {
  logger.error(err.message, err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
  });
});

// Default route to handle undefined routes
app.all('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start the server
const port = process.env.PORT || 3000;

app.listen(port, (err) => {
  if (err) {
    console.error('Error starting server:', err);
  } else {
    console.log(`Server is running on http://localhost:${port}`);
  }
});


// Loggin for debugging
console.log('Starting server...');

// Log any initialization code
try {
  connectDB();
  console.log('Database connection established.');
} catch (err) {
  console.error('Error connecting to database:', err);
}

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


module.exports = app;
