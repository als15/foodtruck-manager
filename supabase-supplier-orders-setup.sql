-- =====================================================
-- SUPABASE SUPPLIER ORDERS SETUP
-- =====================================================
-- This script creates all necessary database components for supplier order management
-- Run this in your Supabase SQL editor

-- =====================================================
-- 1. CREATE SUPPLIER ORDERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS supplier_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expected_delivery_date TIMESTAMPTZ,
    actual_delivery_date TIMESTAMPTZ,
    submitted_date TIMESTAMPTZ,
    notes TEXT,
    auto_generated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 2. CREATE SUPPLIER ORDER ITEMS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS supplier_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_order_id UUID NOT NULL REFERENCES supplier_orders(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
    quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Supplier orders indexes
CREATE INDEX IF NOT EXISTS idx_supplier_orders_supplier_id ON supplier_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_status ON supplier_orders(status);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_order_date ON supplier_orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_expected_delivery ON supplier_orders(expected_delivery_date);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_auto_generated ON supplier_orders(auto_generated);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_order_number ON supplier_orders(order_number);

-- Supplier order items indexes
CREATE INDEX IF NOT EXISTS idx_supplier_order_items_order_id ON supplier_order_items(supplier_order_id);
CREATE INDEX IF NOT EXISTS idx_supplier_order_items_ingredient_id ON supplier_order_items(ingredient_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_supplier_orders_supplier_status ON supplier_orders(supplier_id, status);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_status_date ON supplier_orders(status, order_date DESC);

-- =====================================================
-- 4. CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Update total_price automatically when quantity or unit_price changes
CREATE OR REPLACE FUNCTION update_supplier_order_item_total()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_price = NEW.quantity * NEW.unit_price;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_supplier_order_item_total
    BEFORE INSERT OR UPDATE ON supplier_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_supplier_order_item_total();

-- Update order total_amount when items change
CREATE OR REPLACE FUNCTION update_supplier_order_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE supplier_orders 
    SET 
        total_amount = (
            SELECT COALESCE(SUM(total_price), 0) 
            FROM supplier_order_items 
            WHERE supplier_order_id = COALESCE(NEW.supplier_order_id, OLD.supplier_order_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.supplier_order_id, OLD.supplier_order_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_supplier_order_total
    AFTER INSERT OR UPDATE OR DELETE ON supplier_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_supplier_order_total();

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_supplier_orders_updated_at
    BEFORE UPDATE ON supplier_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_supplier_order_items_updated_at
    BEFORE UPDATE ON supplier_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. CREATE UTILITY FUNCTIONS
-- =====================================================

-- Function to generate unique order numbers
CREATE OR REPLACE FUNCTION generate_supplier_order_number()
RETURNS TEXT AS $$
DECLARE
    order_number TEXT;
    counter INTEGER;
BEGIN
    -- Get today's date in YYYYMMDD format
    order_number := 'SO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-';
    
    -- Get the next sequential number for today
    SELECT COALESCE(MAX(
        CASE 
            WHEN order_number LIKE 'SO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%' 
            THEN CAST(SUBSTRING(order_number FROM 'SO-\d{8}-(\d+)') AS INTEGER)
            ELSE 0
        END
    ), 0) + 1 INTO counter
    FROM supplier_orders;
    
    -- Return formatted order number
    RETURN order_number || LPAD(counter::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to get low stock items for auto-ordering
CREATE OR REPLACE FUNCTION get_low_stock_items_for_supplier(supplier_name TEXT)
RETURNS TABLE (
    ingredient_id UUID,
    ingredient_name TEXT,
    current_stock DECIMAL,
    min_threshold DECIMAL,
    suggested_quantity DECIMAL,
    unit_price DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id as ingredient_id,
        i.name as ingredient_name,
        COALESCE(inv.current_stock, 0) as current_stock,
        COALESCE(inv.min_threshold, 5) as min_threshold,
        GREATEST(COALESCE(inv.min_threshold, 5) * 2, 10) as suggested_quantity,
        i.cost_per_unit as unit_price
    FROM ingredients i
    LEFT JOIN inventory_items inv ON i.name = inv.name
    WHERE i.supplier = supplier_name
    AND i.is_available = true
    AND COALESCE(inv.current_stock, 0) <= COALESCE(inv.min_threshold, 5);
END;
$$ LANGUAGE plpgsql;

-- Function to automatically set expected delivery date
CREATE OR REPLACE FUNCTION set_expected_delivery_date()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set if not already provided
    IF NEW.expected_delivery_date IS NULL THEN
        SELECT 
            NEW.order_date + INTERVAL '1 day' * s.lead_time
        INTO NEW.expected_delivery_date
        FROM suppliers s 
        WHERE s.id = NEW.supplier_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_expected_delivery_date
    BEFORE INSERT OR UPDATE ON supplier_orders
    FOR EACH ROW
    EXECUTE FUNCTION set_expected_delivery_date();

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on tables
ALTER TABLE supplier_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_order_items ENABLE ROW LEVEL SECURITY;

-- Policies for supplier_orders
CREATE POLICY "Enable read access for authenticated users" ON supplier_orders
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON supplier_orders
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON supplier_orders
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON supplier_orders
    FOR DELETE USING (auth.role() = 'authenticated');

-- Policies for supplier_order_items
CREATE POLICY "Enable read access for authenticated users" ON supplier_order_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON supplier_order_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON supplier_order_items
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON supplier_order_items
    FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- 7. CREATE VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for supplier orders with supplier details
CREATE OR REPLACE VIEW supplier_orders_with_details AS
SELECT 
    so.*,
    s.name as supplier_name,
    s.contact_person,
    s.email as supplier_email,
    s.phone as supplier_phone,
    s.lead_time,
    s.minimum_order_amount,
    COUNT(soi.id) as item_count,
    CASE 
        WHEN so.expected_delivery_date < NOW() AND so.status NOT IN ('delivered', 'cancelled') 
        THEN true 
        ELSE false 
    END as is_overdue
FROM supplier_orders so
LEFT JOIN suppliers s ON so.supplier_id = s.id
LEFT JOIN supplier_order_items soi ON so.id = soi.supplier_order_id
GROUP BY so.id, s.id;

-- View for order items with ingredient details
CREATE OR REPLACE VIEW supplier_order_items_with_details AS
SELECT 
    soi.*,
    i.name as ingredient_name,
    i.unit as ingredient_unit,
    i.category as ingredient_category,
    so.order_number,
    so.status as order_status,
    s.name as supplier_name
FROM supplier_order_items soi
LEFT JOIN ingredients i ON soi.ingredient_id = i.id
LEFT JOIN supplier_orders so ON soi.supplier_order_id = so.id
LEFT JOIN suppliers s ON so.supplier_id = s.id;

-- =====================================================
-- 8. INSERT SAMPLE DATA (OPTIONAL)
-- =====================================================

-- Note: Uncomment the following section if you want to insert sample data
-- Make sure you have existing suppliers and ingredients first

/*
-- Sample supplier order
INSERT INTO supplier_orders (
    order_number, 
    supplier_id, 
    status, 
    priority, 
    notes,
    auto_generated
) VALUES (
    'SO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-0001',
    (SELECT id FROM suppliers WHERE name LIKE '%Pizza%' LIMIT 1),
    'draft',
    'medium',
    'Sample order for testing',
    false
);

-- Sample order items (adjust ingredient IDs as needed)
INSERT INTO supplier_order_items (
    supplier_order_id,
    ingredient_id,
    quantity,
    unit_price,
    notes
) VALUES 
(
    (SELECT id FROM supplier_orders WHERE order_number LIKE 'SO-%0001' LIMIT 1),
    (SELECT id FROM ingredients WHERE name LIKE '%dough%' LIMIT 1),
    10.0,
    2.50,
    'For weekend pizza special'
),
(
    (SELECT id FROM supplier_orders WHERE order_number LIKE 'SO-%0001' LIMIT 1),
    (SELECT id FROM ingredients WHERE name LIKE '%cheese%' LIMIT 1),
    5.0,
    4.00,
    'Mozzarella for pizzas'
);
*/

-- =====================================================
-- 9. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT ALL ON supplier_orders TO authenticated;
GRANT ALL ON supplier_order_items TO authenticated;
GRANT SELECT ON supplier_orders_with_details TO authenticated;
GRANT SELECT ON supplier_order_items_with_details TO authenticated;

-- Grant usage on sequences (if any are created automatically)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================

-- Verify the setup
SELECT 'Supplier orders tables created successfully!' as status;

-- Show table info
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN ('supplier_orders', 'supplier_order_items')
ORDER BY tablename;