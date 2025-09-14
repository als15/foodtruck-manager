-- Add order_submission_days column to suppliers table
-- This column will store the days when orders should be submitted to suppliers

ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS order_submission_days TEXT[] DEFAULT '{}';

-- Update existing suppliers to have empty array if null
UPDATE suppliers 
SET order_submission_days = '{}' 
WHERE order_submission_days IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN suppliers.order_submission_days IS 'Array of weekdays when orders should be submitted to this supplier (e.g., {Friday, Tuesday})';