-- Add bottle_size and price_per_bottle columns to orders table
-- This enables customers to choose between 1L, 5L, and 10L bottles

DO $$ 
BEGIN
  -- Add bottle_size column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orders' AND column_name='bottle_size') THEN
    ALTER TABLE orders ADD COLUMN bottle_size TEXT DEFAULT '1L';
  END IF;
  
  -- Add price_per_bottle column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orders' AND column_name='price_per_bottle') THEN
    ALTER TABLE orders ADD COLUMN price_per_bottle INTEGER;
    
    -- Set default price_per_bottle for existing orders based on old price_per_bottle setting
    UPDATE orders 
    SET price_per_bottle = 2000 
    WHERE price_per_bottle IS NULL;
  END IF;
END $$;

-- Add price_per_liter setting (default: 2000)
INSERT INTO settings (key, value) VALUES
  ('price_per_liter', '2000')
ON CONFLICT (key) DO UPDATE SET value = '2000';

-- Verify the updates
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name IN ('bottle_size', 'price_per_bottle');

SELECT key, value FROM settings WHERE key = 'price_per_liter';
