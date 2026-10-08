-- ==========================================
-- Wanderlust DATABASE RELATIONAL SCHEMA
-- ==========================================

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
    category VARCHAR(100) NOT NULL, -- transport, stay, activities, meals
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

-- ==========================================
-- SEED DATA INSERTION
-- ==========================================

-- Seed default users (password: admin123)
INSERT INTO users (id, email, password, first_name, last_name, phone_number, city, country, additional_information, photo_url, language_preference)
VALUES (1, 'admin@globetrotter.com', '$2a$10$EitnB.WQnCgbRMOkEgl2ZuH9byFEm7q.0wLuA7sfS5T4YEsLoXEAu', 'Admin', 'User', '+123456789', 'Paris', 'France', 'System Administrator and avid traveler.', '', 'en');

-- Seed Destinations (Cities)
INSERT INTO destinations (id, name, country, region, description, image_url, cost_index, popularity) VALUES
(1, 'Paris', 'France', 'Europe', 'The City of Light, famous for Eiffel Tower, art, fashion, and French gastronomy.', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800', 4, 5),
(2, 'Tokyo', 'Japan', 'Asia', 'A bustling mix of ultra-modern skyscrapers, neon lights, and historic Shinto shrines.', 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800', 4, 5),
(3, 'New York', 'USA', 'North America', 'The Big Apple, featuring iconic Broadway theaters, Central Park, and the Statue of Liberty.', 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800', 5, 5),
(4, 'Rome', 'Italy', 'Europe', 'The Eternal City, steeped in nearly 3,000 years of globally influential art, architecture, and culture.', 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', 3, 5),
(5, 'Bali', 'Indonesia', 'Asia', 'A tropical paradise known for its forested volcanic mountains, iconic rice paddies, and beaches.', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800', 2, 4),
(6, 'Cape Town', 'South Africa', 'Africa', 'A port city on South Africa’s southwest coast, dominated by the majestic Table Mountain.', 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800', 3, 4),
(7, 'Sydney', 'Australia', 'Oceania', 'A coastal metropolis famous for its Sydney Opera House, Harbour Bridge, and sandy beaches.', 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800', 4, 4);

-- Seed Activities for Paris (id = 1)
INSERT INTO activities (destination_id, name, description, category, cost, duration_minutes, image_url) VALUES
(1, 'Eiffel Tower Visit', 'Access to the summit for stunning panoramic views of Paris.', 'activities', 35.0, 120, 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=300'),
(1, 'Louvre Museum Tour', 'Explore world-famous art collections including the Mona Lisa.', 'activities', 25.0, 180, 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=300'),
(1, 'Seine River Dinner Cruise', 'Enjoy gourmet French dining while floating past historic landmarks.', 'meals', 90.0, 120, 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=300'),
(1, 'Luxury Hotel Stay (Ritz)', 'Stay at the prestigious Ritz Paris in Place Vendome.', 'stay', 350.0, 1440, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300'),
(1, 'Metro / Public Transit Pass', 'Unlimited rides on Paris Metro, RER, and buses for 1 day.', 'transport', 12.0, 1440, 'https://images.unsplash.com/photo-1517479149777-5f3b1511d5ad?w=300');

-- Seed Activities for Tokyo (id = 2)
INSERT INTO activities (destination_id, name, description, category, cost, duration_minutes, image_url) VALUES
(2, 'Shibuya Crossing Walk', 'Experience the world’s busiest pedestrian intersection.', 'activities', 0.0, 30, 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=300'),
(2, 'Sushi Making Masterclass', 'Learn from a local sushi chef and enjoy your own creations.', 'meals', 65.0, 120, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=300'),
(2, 'Bullet Train (Shinkansen)', 'Fast transit from Tokyo Station to Kyoto.', 'transport', 130.0, 140, 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=300'),
(2, 'Shinjuku Capsule Hotel', 'A unique, cost-effective futuristic overnight stay experience.', 'stay', 45.0, 1440, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=300'),
(2, 'Ramen Street Lunch', 'Taste authentic Tonkotsu Ramen at Tokyo Station Ramen Street.', 'meals', 12.0, 45, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300');

-- Seed Activities for New York (id = 3)
INSERT INTO activities (destination_id, name, description, category, cost, duration_minutes, image_url) VALUES
(3, 'Broadway Show Tickets', 'Watch an award-winning musical in the heart of Times Square.', 'activities', 120.0, 150, 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=300'),
(3, 'Empire State Observatory', 'Enjoy 360-degree views of the Manhattan skyline.', 'activities', 45.0, 90, 'https://images.unsplash.com/photo-1522083165195-342750297f05?w=300'),
(3, 'Yellow Cab Taxi Ride', 'Standard transit across Manhattan districts.', 'transport', 25.0, 30, 'https://images.unsplash.com/photo-1492664738985-f96e3d79a48c?w=300'),
(3, 'Times Square Hotel Stay', 'Comfortable rooms adjacent to the neon heart of NYC.', 'stay', 190.0, 1440, 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=300'),
(3, 'Classic NY Pizza Slice', 'Quick, iconic lunch at Joe’s Pizza.', 'meals', 8.0, 20, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300');

-- Seed Activities for Rome (id = 4)
INSERT INTO activities (destination_id, name, description, category, cost, duration_minutes, image_url) VALUES
(4, 'Colosseum Guided Tour', 'Skip-the-line entry and history lecture on Roman gladiators.', 'activities', 40.0, 150, 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=300'),
(4, 'Vatican Museums & Chapel', 'Explore Sistine Chapel and classic Renaissance masterpieces.', 'activities', 35.0, 200, 'https://images.unsplash.com/photo-1594897030264-ab7d87efc473?w=300'),
(4, 'Traditional Pasta Making', 'Prepare hand-made carbonara and enjoy it with Italian wine.', 'meals', 55.0, 150, 'https://images.unsplash.com/photo-1556761223-4c4285c73f13?w=300'),
(4, 'Piazza Navona Boutique Hotel', 'Elegant stay overlooking historic fountains and plazas.', 'stay', 150.0, 1440, 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=300'),
(4, 'Leonardo Express Airport Train', 'Direct transit from Fiumicino Airport to Termini Station.', 'transport', 14.0, 32, 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=300');

-- Seed Activities for Bali (id = 5)
INSERT INTO activities (destination_id, name, description, category, cost, duration_minutes, image_url) VALUES
(5, 'Ubud Sacred Monkey Forest', 'Walk through the sanctuary and watch grey long-tailed macaques.', 'activities', 6.0, 90, 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=300'),
(5, 'Scuba Diving at Tulamben', 'Explore the famous USAT Liberty shipwreck.', 'activities', 75.0, 240, 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=300'),
(5, 'Scooter Rental (Daily)', 'Navigate through Bali roads easily on a moped.', 'transport', 8.0, 1440, 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=300'),
(5, 'Private Pool Ubud Villa', 'Luxury lodging nestled in Bali rice fields.', 'stay', 85.0, 1440, 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=300'),
(5, 'Jimbaran Beach Seafood BBQ', 'Fresh grilled snapper served on the sand during sunset.', 'meals', 25.0, 90, 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=300');

-- Seed Activities for Cape Town (id = 6)
INSERT INTO activities (destination_id, name, description, category, cost, duration_minutes, image_url) VALUES
(6, 'Table Mountain Cableway', 'Return ticket to the top of Table Mountain.', 'activities', 26.0, 90, 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=300'),
(6, 'Robben Island Museum Tour', 'Ferry ride and guided tour of Nelson Mandela’s prison cell.', 'activities', 30.0, 210, 'https://images.unsplash.com/photo-1528154291023-a6525fabe5b4?w=300'),
(6, 'Car Rental (1 Day)', 'Drive along the beautiful Chapman’s Peak road.', 'transport', 35.0, 1440, 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=300'),
(6, 'V&A Waterfront Hotel', 'Scenic hotel lodging overlooking the historic harbor.', 'stay', 110.0, 1440, 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=300'),
(6, 'South African Braai Lunch', 'Sample grilled meats, chakalaka, and pap.', 'meals', 18.0, 90, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300');

-- Seed Activities for Sydney (id = 7)
INSERT INTO activities (destination_id, name, description, category, cost, duration_minutes, image_url) VALUES
(7, 'Opera House Backstage Tour', 'Behind the scenes tour of the world’s most iconic performing arts center.', 'activities', 32.0, 90, 'https://images.unsplash.com/photo-1528072164453-f4e8ef0d475a?w=300'),
(7, 'Bondi to Coogee Coastal Walk', 'Guided scenic walk along Sydney’s stunning cliffs and beaches.', 'activities', 0.0, 180, 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=300'),
(7, 'Circular Quay to Manly Ferry', 'Picturesque public transit ferry ride across Sydney Harbour.', 'transport', 7.0, 30, 'https://images.unsplash.com/photo-1548565499-682c723b83a5?w=300'),
(7, 'Central Business District Hotel', 'High rise stay close to Harbour Bridge and public transit.', 'stay', 160.0, 1440, 'https://images.unsplash.com/photo-1541971875076-8f970d573be6?w=300'),
(7, 'Fish & Chips at Darling Harbour', 'Classic Aussie lunch by the marina.', 'meals', 15.0, 45, 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=300');
