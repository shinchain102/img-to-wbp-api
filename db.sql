-- Creating the 'users' table to store user information
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,           -- Unique identifier for each user
    name VARCHAR(100) NOT NULL,                       -- User's name
    email VARCHAR(100) UNIQUE NOT NULL,               -- User's email (unique)
    password_hash VARCHAR(255) NOT NULL,              -- Hashed password for security
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,   -- When the user was created
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP  -- When the user was last updated
);

-- Creating the 'api_keys' table to store the generated API keys for users
CREATE TABLE api_keys (
    api_key_id INT AUTO_INCREMENT PRIMARY KEY,        -- Unique identifier for each API key
    user_id INT,                                      -- Foreign key referencing 'users' table
    api_key VARCHAR(255) NOT NULL,                     -- The API key itself (unique and required)
    name VARCHAR(100),                                 -- Optional field to name the key (e.g., app or service name)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- When the API key was created
    FOREIGN KEY (user_id) REFERENCES users(user_id)    -- Establishing the foreign key relationship
        ON DELETE CASCADE,
    UNIQUE (api_key(191))                              -- Adding a prefix length to reduce the size of the index
);


-- Creating the 'conversion_jobs' table to track bulk image conversion jobs
CREATE TABLE conversion_jobs (
    job_id INT AUTO_INCREMENT PRIMARY KEY,            -- Unique identifier for each conversion job
    user_id INT,                                      -- Foreign key referencing 'users' table
    status ENUM('pending', 'in-progress', 'completed', 'failed') NOT NULL,  -- Status of the job
    output_format ENUM('webp', 'avif') NOT NULL,      -- Desired output format (WebP or AVIF)
    quality INT DEFAULT 80,                           -- Quality of the converted image (1-100)
    compression ENUM('low', 'medium', 'high') DEFAULT 'medium',  -- Compression level (low, medium, high)
    job_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- When the job started
    job_end TIMESTAMP,                                -- When the job ended (nullable until completion)
    total_images INT,                                 -- Total number of images to convert
    converted_images INT,                             -- Number of successfully converted images
    failed_images INT,                                -- Number of failed conversions
    job_progress INT DEFAULT 0,                       -- Job progress (percentage)
    job_file_path VARCHAR(255),                       -- Path to the job result file (if applicable)
    FOREIGN KEY (user_id) REFERENCES users(user_id)   -- Linking job to a user
);

-- Creating the 'logs' table to store logs related to conversions and API usage
CREATE TABLE logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,            -- Unique identifier for each log entry
    user_id INT,                                      -- Foreign key referencing 'users' table
    api_key_id INT,                                   -- Foreign key referencing 'api_keys' table
    log_type ENUM('error', 'info', 'warning') NOT NULL, -- Type of the log (error, info, warning)
    message TEXT NOT NULL,                            -- The content of the log
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,   -- When the log was created
    FOREIGN KEY (user_id) REFERENCES users(user_id)   -- Associating the log with the user
        ON DELETE CASCADE,
    FOREIGN KEY (api_key_id) REFERENCES api_keys(api_key_id)   -- Associating the log with an API key
        ON DELETE CASCADE
);

-- Creating the 'image_conversions' table to store metadata for converted images
CREATE TABLE image_conversions (
    conversion_id INT AUTO_INCREMENT PRIMARY KEY,     -- Unique identifier for each conversion record
    job_id INT,                                       -- Foreign key referencing 'conversion_jobs' table
    original_image_path VARCHAR(255) NOT NULL,         -- Path to the original image
    converted_image_path VARCHAR(255) NOT NULL,        -- Path to the converted image
    format ENUM('webp', 'avif') NOT NULL,              -- Format of the converted image
    quality INT DEFAULT 80,                           -- Quality of the converted image
    compression ENUM('low', 'medium', 'high') DEFAULT 'medium',  -- Compression applied
    conversion_status ENUM('success', 'failed') NOT NULL, -- Status of the conversion
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,   -- When the conversion record was created
    FOREIGN KEY (job_id) REFERENCES conversion_jobs(job_id)  -- Linking to a conversion job
);

-- Creating an index for the 'conversion_jobs' table to speed up queries based on status
CREATE INDEX idx_conversion_status ON conversion_jobs(status);

-- Creating an index for the 'image_conversions' table for better performance on conversion status queries
CREATE INDEX idx_conversion_status_image ON image_conversions(conversion_status);
