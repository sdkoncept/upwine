-- Add order_items JSONB column to support multiple bottle sizes and quantities in one order
-- This enables customers to order multiple items like: 2x1L + 1x5L + 1x10L in a single order

DO $$ 
DECLARE
  bottle_size_exists BOOLEAN;
  price_per_bottle_exists BOOLEAN;
BEGIN
  -- Check if bottle_size column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='orders' AND column_name='bottle_size'
  ) INTO bottle_size_exists;
  
  -- Check if price_per_bottle column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='orders' AND column_name='price_per_bottle'
  ) INTO price_per_bottle_exists;
  
  -- Add order_items column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='orders' AND column_name='order_items') THEN
    ALTER TABLE orders ADD COLUMN order_items JSONB DEFAULT '[]'::jsonb;
    
    -- Migrate existing orders to order_items format for backward compatibility
    -- Only migrate if bottle_size column exists, otherwise use defaults
    IF bottle_size_exists AND price_per_bottle_exists THEN
      -- Both columns exist - full migration
      UPDATE orders 
      SET order_items = jsonb_build_array(
        jsonb_build_object(
          'size', COALESCE(bottle_size, '1L'),
          'quantity', quantity,
          'price_per_unit', COALESCE(price_per_bottle, 
            CASE 
              WHEN bottle_size = '5L' THEN 10000
              WHEN bottle_size = '10L' THEN 20000
              ELSE 2000
            END
          )
        )
      )
      WHERE order_items IS NULL OR order_items::text = '[]'::text;
    ELSIF bottle_size_exists THEN
      -- Only bottle_size exists - use default price
      UPDATE orders 
      SET order_items = jsonb_build_array(
        jsonb_build_object(
          'size', COALESCE(bottle_size, '1L'),
          'quantity', quantity,
          'price_per_unit', 
            CASE 
              WHEN bottle_size = '5L' THEN 10000
              WHEN bottle_size = '10L' THEN 20000
              ELSE 2000
            END
        )
      )
      WHERE order_items IS NULL OR order_items::text = '[]'::text;
    ELSE
      -- Neither column exists - use default values
      UPDATE orders 
      SET order_items = jsonb_build_array(
        jsonb_build_object(
          'size', '1L',
          'quantity', quantity,
          'price_per_unit', 2000
        )
      )
      WHERE order_items IS NULL OR order_items::text = '[]'::text;
    END IF;
  END IF;
END $$;

-- Create index on order_items for better query performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_orders_order_items ON orders USING GIN (order_items);

-- Verify the update
SELECT 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name = 'order_items';
