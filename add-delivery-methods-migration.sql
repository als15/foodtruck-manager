-- =====================================================
-- ADD DELIVERY METHODS TO SUPPLIERS TABLE
-- =====================================================
-- This migration adds the delivery_methods column to the suppliers table
-- Run this in your Supabase SQL editor

-- Add delivery_methods column to suppliers table
ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS delivery_methods TEXT[] DEFAULT '{}';

-- Update existing suppliers to have default delivery methods
-- This sets all existing suppliers to support both pickup and delivery
UPDATE suppliers 
SET delivery_methods = ARRAY['pickup', 'delivery']
WHERE delivery_methods IS NULL OR delivery_methods = '{}';

-- Add a check constraint to ensure only valid delivery methods
ALTER TABLE suppliers 
ADD CONSTRAINT check_delivery_methods 
CHECK (
    delivery_methods <@ ARRAY['pickup', 'delivery']
    AND array_length(delivery_methods, 1) > 0
);

-- Create an index for performance on delivery methods queries
CREATE INDEX IF NOT EXISTS idx_suppliers_delivery_methods 
ON suppliers USING GIN (delivery_methods);

-- Verify the migration
SELECT 
    'delivery_methods column added successfully!' as status,
    count(*) as total_suppliers,
    count(*) FILTER (WHERE delivery_methods IS NOT NULL AND array_length(delivery_methods, 1) > 0) as suppliers_with_delivery_methods
FROM suppliers;