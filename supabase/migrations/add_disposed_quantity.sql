-- Add disposed_quantity column to inventory_items table
-- This column tracks the total quantity of each item that has been marked as disposed/wasted

ALTER TABLE inventory_items 
ADD COLUMN IF NOT EXISTS disposed_quantity DECIMAL(10,3) DEFAULT 0;

-- Add a comment to the column to explain its purpose
COMMENT ON COLUMN inventory_items.disposed_quantity IS 'Total quantity of this item that has been marked as disposed/wasted';

-- Update any existing records to have a default value of 0 for disposed_quantity
UPDATE inventory_items 
SET disposed_quantity = 0 
WHERE disposed_quantity IS NULL;