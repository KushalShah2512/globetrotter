-- Drop existing tables to ensure clean initialization
DROP TABLE IF EXISTS trip_activities;
DROP TABLE IF EXISTS stops;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS user_tokens;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS destinations;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    city VARCHAR(100),
    country VARCHAR(100),
    additional_information TEXT,
    photo_url VARCHAR(500),
    language_preference VARCHAR(10) DEFAULT 'en'
);

-- User tokens for custom session authentication
CREATE TABLE user_tokens (
    token VARCHAR(255) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    expiry_time TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Destinations (pre-populated cities)
CREATE TABLE destinations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(255) NOT NULL,
    region VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    cost_index INT CHECK (cost_index BETWEEN 1 AND 5),
    popularity INT CHECK (popularity BETWEEN 1 AND 5)
);

-- Activities (pre-populated options per destination)
CREATE TABLE activities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    destination_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- e.g., transport, stay, activities, meals
    cost DOUBLE NOT NULL,
    duration_minutes INT NOT NULL,
    image_url VARCHAR(500),
    FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE
);

-- Trips
CREATE TABLE trips (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    budget DOUBLE NOT NULL,
    cover_photo VARCHAR(500),
    is_public BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Stops inside a Trip (multi-city stops)
CREATE TABLE stops (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    trip_id BIGINT NOT NULL,
    destination_id BIGINT NOT NULL,
    arrival_date DATE NOT NULL,
    departure_date DATE NOT NULL,
    sequence_order INT NOT NULL,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE
);

-- Activities scheduled inside a Trip
CREATE TABLE trip_activities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    trip_id BIGINT NOT NULL,
    stop_id BIGINT,
    activity_id BIGINT,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- transport, stay, activities, meals
    cost DOUBLE NOT NULL,
    duration_minutes INT,
    activity_date DATE NOT NULL,
    activity_time TIME,
    notes TEXT,
    sequence_order INT NOT NULL,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (stop_id) REFERENCES stops(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE SET NULL
);
