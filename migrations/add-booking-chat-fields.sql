-- Chat-Booking Integration Database Migration
-- Adds booking and property linking to messages table
-- Created: December 3, 2025

-- ============================================
-- 1. ADD NEW COLUMNS TO MESSAGES TABLE
-- ============================================

ALTER TABLE messages 
ADD COLUMN booking_id INT NULL COMMENT 'Links message to booking',
ADD COLUMN property_id INT NULL COMMENT 'Links message to property',
ADD COLUMN is_system BOOLEAN DEFAULT FALSE COMMENT 'True for automatic system messages';

-- ============================================
-- 2. MODIFY SENDER_ID TO ALLOW NULL
-- ============================================

ALTER TABLE messages 
MODIFY COLUMN sender_id INT NULL COMMENT 'Null for system messages';

-- ============================================
-- 3. ADD FOREIGN KEY CONSTRAINTS (OPTIONAL)
-- ============================================
-- Note: Add these if your bookings and proprietes tables exist

-- ALTER TABLE messages 
-- ADD CONSTRAINT fk_messages_booking 
-- FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;

-- ALTER TABLE messages 
-- ADD CONSTRAINT fk_messages_property 
-- FOREIGN KEY (property_id) REFERENCES proprietes(id) ON DELETE SET NULL;

-- ============================================
-- 4. ADD PERFORMANCE INDEXES
-- ============================================

CREATE INDEX idx_booking_id ON messages(booking_id);
CREATE INDEX idx_property_id ON messages(property_id);

-- ============================================
-- 5. VERIFICATION QUERIES
-- ============================================
-- Run these to verify migration was successful

-- Show table structure
-- DESCRIBE messages;

-- Check new columns exist
-- SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
-- FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_NAME = 'messages' 
-- AND TABLE_SCHEMA = 'ikri';

-- Check indexes
-- SHOW INDEX FROM messages;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
