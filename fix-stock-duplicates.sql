-- Fix Stock Issue: Delete duplicate stock entries and ensure only today's entry exists
-- Run this in Supabase SQL Editor

-- 1. Check all stock entries (especially for today and recent days)
SELECT 
  id,
  week_start_date,
  total_bottles,
  sold_bottles,
  available_bottles,
  created_at
FROM stock
WHERE week_start_date >= CURRENT_DATE - INTERVAL '2 days'
ORDER BY week_start_date DESC, id DESC;

-- 2. Check what CURRENT_DATE returns in the database
SELECT CURRENT_DATE as database_today, NOW() as database_now;

-- 3. Delete duplicate entries for today, keeping only the most recent one (highest ID)
-- BE CAREFUL: This will delete old entries for today
DELETE FROM stock 
WHERE week_start_date = CURRENT_DATE 
AND id NOT IN (
  SELECT id 
  FROM stock 
  WHERE week_start_date = CURRENT_DATE 
  ORDER BY id DESC 
  LIMIT 1
);

-- 4. If there are entries with old dates that shouldn't exist, delete them:
-- DELETE FROM stock WHERE week_start_date < CURRENT_DATE;

-- 5. Ensure today's stock is set to 100 (this will create if it doesn't exist, update if it does)
INSERT INTO stock (week_start_date, total_bottles, sold_bottles, available_bottles)
VALUES (CURRENT_DATE, 100, 0, 100)
ON CONFLICT (week_start_date) 
DO UPDATE SET
  total_bottles = 100,
  sold_bottles = 0,
  available_bottles = 100,
  id = stock.id  -- Keep the existing ID to avoid confusion
RETURNING *;

-- 6. Verify: There should be only ONE entry for today
SELECT 
  COUNT(*) as entries_count,
  week_start_date,
  MAX(id) as latest_id,
  MAX(available_bottles) as available
FROM stock
WHERE week_start_date = CURRENT_DATE
GROUP BY week_start_date;
