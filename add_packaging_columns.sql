-- Add packaging columns to ingredients table
ALTER TABLE ingredients 
ADD COLUMN IF NOT EXISTS units_per_package INTEGER,
ADD COLUMN IF NOT EXISTS package_type TEXT,
ADD COLUMN IF NOT EXISTS minimum_order_quantity INTEGER,
ADD COLUMN IF NOT EXISTS order_by_package BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN ingredients.units_per_package IS 'Number of units in each package (e.g., 12 bottles per box)';
COMMENT ON COLUMN ingredients.package_type IS 'Type of package (e.g., box, case, crate)';
COMMENT ON COLUMN ingredients.minimum_order_quantity IS 'Minimum quantity that can be ordered';
COMMENT ON COLUMN ingredients.order_by_package IS 'Whether this ingredient must be ordered by package';