-- Create product_mappings table for AI Order Importer
-- This table stores mappings between external product names and menu items
-- so users don't have to re-map products every time they import

CREATE TABLE IF NOT EXISTS product_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- External product information
  original_name TEXT NOT NULL,
  source_type TEXT DEFAULT 'payment_provider', -- e.g., 'payment_provider', 'pos', etc.

  -- Mapped menu item
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,

  -- Mapping metadata
  confidence FLOAT DEFAULT 0.0, -- AI confidence score (0-1)
  is_manual BOOLEAN DEFAULT false, -- True if user manually set the mapping
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Track when this mapping was last used

  -- Ensure unique mapping per business and product
  UNIQUE(business_id, original_name, source_type)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_mappings_business ON product_mappings(business_id);
CREATE INDEX IF NOT EXISTS idx_product_mappings_original_name ON product_mappings(original_name);
CREATE INDEX IF NOT EXISTS idx_product_mappings_menu_item ON product_mappings(menu_item_id);

-- RLS policies
ALTER TABLE product_mappings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view product mappings for their business
CREATE POLICY "Users can view their business product mappings" ON product_mappings
  FOR SELECT
  USING (
    business_id IN (
      SELECT business_id
      FROM business_users
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert product mappings for their business
CREATE POLICY "Users can insert their business product mappings" ON product_mappings
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT business_id
      FROM business_users
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update product mappings for their business
CREATE POLICY "Users can update their business product mappings" ON product_mappings
  FOR UPDATE
  USING (
    business_id IN (
      SELECT business_id
      FROM business_users
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete product mappings for their business
CREATE POLICY "Users can delete their business product mappings" ON product_mappings
  FOR DELETE
  USING (
    business_id IN (
      SELECT business_id
      FROM business_users
      WHERE user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_product_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS product_mappings_updated_at ON product_mappings;
CREATE TRIGGER product_mappings_updated_at
  BEFORE UPDATE ON product_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_product_mappings_updated_at();
