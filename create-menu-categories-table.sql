-- Create menu_categories table
CREATE TABLE IF NOT EXISTS menu_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique category names per business
    UNIQUE(business_id, name)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_menu_categories_business_id ON menu_categories(business_id);

-- Enable RLS (Row Level Security)
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view categories for their business" ON menu_categories
    FOR SELECT USING (
        business_id IN (
            SELECT business_id FROM user_businesses 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert categories for their business" ON menu_categories
    FOR INSERT WITH CHECK (
        business_id IN (
            SELECT business_id FROM user_businesses 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update categories for their business" ON menu_categories
    FOR UPDATE USING (
        business_id IN (
            SELECT business_id FROM user_businesses 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete categories for their business" ON menu_categories
    FOR DELETE USING (
        business_id IN (
            SELECT business_id FROM user_businesses 
            WHERE user_id = auth.uid()
        )
    );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_menu_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_menu_categories_updated_at
    BEFORE UPDATE ON menu_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_menu_categories_updated_at();

-- Insert default categories for existing businesses
INSERT INTO menu_categories (business_id, name)
SELECT DISTINCT b.id, unnest(ARRAY['salads', 'sandwiches', 'desserts', 'sweet pastries', 'savory pastries', 'fruit shakes', 'hot drinks', 'cold drinks'])
FROM businesses b
WHERE NOT EXISTS (
    SELECT 1 FROM menu_categories mc WHERE mc.business_id = b.id
)
ON CONFLICT (business_id, name) DO NOTHING;