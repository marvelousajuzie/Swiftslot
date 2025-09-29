-- SwiftSlot Database Schema
-- All datetime fields store UTC timestamps

CREATE DATABASE IF NOT EXISTS swiftslot;
USE swiftslot;

-- Vendors table
CREATE TABLE vendors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    timezone VARCHAR(100) NOT NULL DEFAULT 'Africa/Lagos',
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)
);

-- Bookings table
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vendor_id INT NOT NULL,
    buyer_id VARCHAR(255) NOT NULL DEFAULT 'anonymous',
    start_time_utc DATETIME(3) NOT NULL,
    end_time_utc DATETIME(3) NOT NULL,
    status ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    FOREIGN KEY (vendor_id) REFERENCES vendors(id),
    INDEX idx_vendor_time (vendor_id, start_time_utc)
);

-- Booking slots for conflict prevention
CREATE TABLE booking_slots (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    vendor_id INT NOT NULL,
    slot_start_utc DATETIME(3) NOT NULL,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id),
    UNIQUE KEY unique_vendor_slot (vendor_id, slot_start_utc)
);

-- Payments table
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    ref VARCHAR(255) UNIQUE NOT NULL,
    status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
    raw_event_json JSON,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- Idempotency keys for preventing duplicate requests
CREATE TABLE idempotency_keys (
    key_value VARCHAR(255) PRIMARY KEY,
    scope VARCHAR(100) NOT NULL,
    response_hash VARCHAR(255) NOT NULL,
    response_data JSON,
    created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_scope_created (scope, created_at)
);
