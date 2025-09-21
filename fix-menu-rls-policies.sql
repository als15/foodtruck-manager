-- Fix Row Level Security policies for menu-related tables

-- ==================== MENU ITEMS TABLE ====================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view menu items for their business" ON menu_items;
DROP POLICY IF EXISTS "Users can insert menu items for their business" ON menu_items;
DROP POLICY IF EXISTS "Users can update menu items for their business" ON menu_items;
DROP POLICY IF EXISTS "Users can delete menu items for their business" ON menu_items;

-- Create/update RLS policies for menu_items
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

-- ==================== MENU ITEM INGREDIENTS TABLE ====================

-- Check if table exists, if not create it
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

-- Enable RLS if not already enabled
ALTER TABLE menu_item_ingredients ENABLE ROW LEVEL SECURITY;

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

-- ==================== CREATE INDEXES FOR PERFORMANCE ====================

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_menu_item_ingredients_menu_item_id ON menu_item_ingredients(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_menu_item_ingredients_ingredient_id ON menu_item_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_business_id ON menu_items(business_id);

-- ==================== CREATE UPDATE TRIGGER ====================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_menu_item_ingredients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_menu_item_ingredients_updated_at ON menu_item_ingredients;
CREATE TRIGGER trigger_update_menu_item_ingredients_updated_at
    BEFORE UPDATE ON menu_item_ingredients
    FOR EACH ROW
    EXECUTE FUNCTION update_menu_item_ingredients_updated_at();

-- ==================== VERIFICATION QUERIES ====================

-- Verify the policies are in place
DO $$
BEGIN
    -- Check if we can see the policies
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'menu_item_ingredients' 
        AND policyname = 'Users can insert menu item ingredients for their business'
    ) THEN
        RAISE NOTICE 'RLS policies for menu_item_ingredients have been successfully created/updated';
    ELSE
        RAISE WARNING 'RLS policies for menu_item_ingredients may not have been created properly';
    END IF;
END $$;