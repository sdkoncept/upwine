-- Update admin phone number to 2347061350467
-- Run this in Supabase SQL Editor

UPDATE settings 
SET value = '2347061350467' 
WHERE key = 'admin_phone';

-- Verify the update
SELECT key, value FROM settings WHERE key = 'admin_phone';
