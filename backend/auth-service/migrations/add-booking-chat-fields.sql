-- Add booking chat integration fields to messages table
-- Run this migration on your database

USE ikri;

-- Add booking_id column
ALTER TABLE messages ADD COLUMN IF NOT EXISTS booking_id INT;

-- Add property_id column  
ALTER TABLE messages ADD COLUMN IF NOT EXISTS property_id INT;

-- Add is_system column
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;

-- Make sender_id nullable (for system messages)
ALTER TABLE messages MODIFY sender_id INT NULL;

-- Add foreign key constraints (optional, but recommended)
-- ALTER TABLE messages ADD CONSTRAINT fk_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;
-- ALTER TABLE messages ADD CONSTRAINT fk_property FOREIGN KEY (property_id) REFERENCES proprietes(id) ON DELETE CASCADE;

-- Create index on booking_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_messages_booking_id ON messages(booking_id);

-- Create index on property_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_messages_property_id ON messages(property_id);

-- Verify the changes
DESCRIBE messages;
