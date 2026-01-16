-- Update delivery fee min and max settings in Supabase
-- This adds ₦800 to all delivery fees

-- Update minimum delivery fee from ₦800 to ₦1,600
UPDATE settings 
SET value = '1600' 
WHERE key = 'delivery_fee_min';

-- Update maximum delivery fee from ₦2,200 to ₦3,000
UPDATE settings 
SET value = '3000' 
WHERE key = 'delivery_fee_max';

-- Verify the updates
SELECT key, value 
FROM settings 
WHERE key IN ('delivery_fee_min', 'delivery_fee_max');
