-- Fix Stock Issue: Check and clean up stock entries
-- Run this in Supabase SQL Editor

-- 1. Check all stock entries
SELECT 
  id,
  week_start_date,
  total_bottles,
  sold_bottles,
  available_bottles,
  created_at
FROM stock
ORDER BY week_start_date DESC
LIMIT 10;

-- 2. Delete all stock entries except today's (optional - use with caution)
-- First, check what today's date is in your timezone:
-- SELECT CURRENT_DATE as today_date;

-- Then, if you want to keep only today's entry:
-- DELETE FROM stock WHERE week_start_date != CURRENT_DATE;

-- 3. Ensure today's stock is set to 100 (this will create if it doesn't exist)
INSERT INTO stock (week_start_date, total_bottles, sold_bottles, available_bottles)
VALUES (CURRENT_DATE, 100, 0, 100)
ON CONFLICT (week_start_date) 
DO UPDATE SET
  total_bottles = 100,
  sold_bottles = 0,
  available_bottles = 100;

-- 4. Verify today's stock entry
SELECT 
  week_start_date,
  total_bottles,
  sold_bottles,
  available_bottles
FROM stock
WHERE week_start_date = CURRENT_DATE;
