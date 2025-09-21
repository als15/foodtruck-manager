-- Create menu_item_ingredients table from scratch
-- This table stores the relationship between menu items and their ingredients

-- First, ensure the parent tables exist
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    category VARCHAR(100) NOT NULL,
    allergens TEXT[],
    is_available BOOLEAN DEFAULT true,
    prep_time INTEGER DEFAULT 0,
    total_ingredient_cost DECIMAL(10,2) DEFAULT 0,
    profit_margin DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the menu_item_ingredients table
CREATE TABLE IF NOT EXISTS menu_item_ingredients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity DECIMAL(10,3) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique ingredient per menu item
    UNIQUE(menu_item_id, ingredient_id)
);

-- Enable RLS on both tables
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_ingredients ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_menu_items_business_id ON menu_items(business_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available);

CREATE INDEX IF NOT EXISTS idx_menu_item_ingredients_menu_item_id ON menu_item_ingredients(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_ingredients_ingredient_id ON menu_item_ingredients(ingredient_id);

-- ==================== RLS POLICIES FOR MENU_ITEMS ====================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view menu items for their business" ON menu_items;
DROP POLICY IF EXISTS "Users can insert menu items for their business" ON menu_items;
DROP POLICY IF EXISTS "Users can update menu items for their business" ON menu_items;
DROP POLICY IF EXISTS "Users can delete menu items for their business" ON menu_items;

-- Create RLS policies for menu_items
CREATE POLICY "Users can view menu items for their business" ON menu_items
    FOR SELECT USING (
        business_id IN (
            SELECT business_id FROM user_businesses 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert menu items for their business" ON menu_items
    FOR INSERT WITH CHECK (
        business_id IN (
            SELECT business_id FROM user_businesses 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update menu items for their business" ON menu_items
    FOR UPDATE USING (
        business_id IN (
            SELECT business_id FROM user_businesses 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete menu items for their business" ON menu_items
    FOR DELETE USING (
        business_id IN (
            SELECT business_id FROM user_businesses 
            WHERE user_id = auth.uid()
        )
    );

-- ==================== RLS POLICIES FOR MENU_ITEM_INGREDIENTS ====================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view menu item ingredients for their business" ON menu_item_ingredients;
DROP POLICY IF EXISTS "Users can insert menu item ingredients for their business" ON menu_item_ingredients;
DROP POLICY IF EXISTS "Users can update menu item ingredients for their business" ON menu_item_ingredients;
DROP POLICY IF EXISTS "Users can delete menu item ingredients for their business" ON menu_item_ingredients;

-- Create RLS policies for menu_item_ingredients
CREATE POLICY "Users can view menu item ingredients for their business" ON menu_item_ingredients
    FOR SELECT USING (
        menu_item_id IN (
            SELECT id FROM menu_items 
            WHERE business_id IN (
                SELECT business_id FROM user_businesses 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert menu item ingredients for their business" ON menu_item_ingredients
    FOR INSERT WITH CHECK (
        menu_item_id IN (
            SELECT id FROM menu_items 
            WHERE business_id IN (
                SELECT business_id FROM user_businesses 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update menu item ingredients for their business" ON menu_item_ingredients
    FOR UPDATE USING (
        menu_item_id IN (
            SELECT id FROM menu_items 
            WHERE business_id IN (
                SELECT business_id FROM user_businesses 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete menu item ingredients for their business" ON menu_item_ingredients
    FOR DELETE USING (
        menu_item_id IN (
            SELECT id FROM menu_items 
            WHERE business_id IN (
                SELECT business_id FROM user_businesses 
                WHERE user_id = auth.uid()
            )
        )
    );

-- ==================== UPDATE TRIGGERS ====================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for both tables
DROP TRIGGER IF EXISTS trigger_update_menu_items_updated_at ON menu_items;
CREATE TRIGGER trigger_update_menu_items_updated_at
    BEFORE UPDATE ON menu_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_menu_item_ingredients_updated_at ON menu_item_ingredients;
CREATE TRIGGER trigger_update_menu_item_ingredients_updated_at
    BEFORE UPDATE ON menu_item_ingredients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==================== VERIFICATION ====================

-- Verify tables exist and have correct structure
DO $$
BEGIN
    -- Check if menu_items table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_items') THEN
        RAISE NOTICE 'menu_items table exists';
    ELSE
        RAISE EXCEPTION 'menu_items table was not created successfully';
    END IF;
    
    -- Check if menu_item_ingredients table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_item_ingredients') THEN
        RAISE NOTICE 'menu_item_ingredients table exists';
    ELSE
        RAISE EXCEPTION 'menu_item_ingredients table was not created successfully';
    END IF;
    
    -- Check if RLS policies exist
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'menu_item_ingredients' 
        AND policyname = 'Users can insert menu item ingredients for their business'
    ) THEN
        RAISE NOTICE 'RLS policies for menu_item_ingredients have been created successfully';
    ELSE
        RAISE WARNING 'RLS policies for menu_item_ingredients may not have been created properly';
    END IF;
    
    RAISE NOTICE 'Database setup completed successfully!';
END $$;