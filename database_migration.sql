-- Migration to add passengers column to bookings table with proper constraints
-- Run this SQL in your MySQL database

-- Add passengers column to store JSON data
ALTER TABLE bookings 
ADD COLUMN passengers TEXT NULL 
COMMENT 'JSON array of passenger details: [{"firstName":"John","lastName":"Doe","email":"john@example.com","mobile":"1234567890","country":"India","state":"Maharashtra"}]'
AFTER flight_id;

-- Add index on user_id for faster queries
CREATE INDEX idx_bookings_user_id ON bookings(user_id);

-- Add index on flight_id for faster queries  
CREATE INDEX idx_bookings_flight_id ON bookings(flight_id);

-- Add index on created_at for sorting
CREATE INDEX idx_bookings_created_at ON bookings(created_at);

-- Optional: Add check constraint to ensure passengers JSON is valid (MySQL 8.0.16+)
-- ALTER TABLE bookings ADD CONSTRAINT chk_passengers_json 
-- CHECK (JSON_VALID(passengers) OR passengers IS NULL);


-- ================================
-- Flight class pricing & seats
-- ================================

-- Add seats column to bookings to track how many seats each booking uses
ALTER TABLE bookings
ADD COLUMN seats INT NOT NULL DEFAULT 1 AFTER flight_id;

-- Add class-specific prices and total seats to flights
ALTER TABLE flights
ADD COLUMN total_seats INT NOT NULL DEFAULT 180 AFTER price,
ADD COLUMN business_price DECIMAL(10,2) NULL AFTER total_seats,
ADD COLUMN first_price DECIMAL(10,2) NULL AFTER business_price;
