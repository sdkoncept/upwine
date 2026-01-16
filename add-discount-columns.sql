-- Add missing discount columns to orders table
-- Run this in Supabase SQL Editor if you get "discount_amount column not found" error

-- Add discount_code_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'discount_code_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN discount_code_id BIGINT REFERENCES discount_codes(id);
    RAISE NOTICE 'Added discount_code_id column';
  ELSE
    RAISE NOTICE 'discount_code_id column already exists';
  END IF;
END $$;

-- Add discount_amount column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'discount_amount'
  ) THEN
    ALTER TABLE orders ADD COLUMN discount_amount INTEGER DEFAULT 0;
    RAISE NOTICE 'Added discount_amount column';
  ELSE
    RAISE NOTICE 'discount_amount column already exists';
  END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name IN ('discount_code_id', 'discount_amount')
ORDER BY column_name;
