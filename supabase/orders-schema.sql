-- Orders Management Schema
-- Add these tables to support comprehensive order management and POS integration

-- 1. Customers table (optional - for customer tracking)
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    loyalty_points INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL, -- For display/receipt purposes
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    total DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    tip_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled', 'refunded')),
    order_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_time TIMESTAMP WITH TIME ZONE,
    location VARCHAR(255) DEFAULT 'Main Location',
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'card', 'mobile', 'online', 'other')),
    payment_status VARCHAR(20) DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    special_instructions TEXT,
    -- POS/External system integration
    external_order_id VARCHAR(100), -- ID from defrayal machine or other POS
    external_source VARCHAR(50), -- 'defrayal', 'manual', 'online', etc.
    -- Operational data
    prep_time_minutes INTEGER, -- How long it actually took to prepare
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL, -- Who handled the order
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Order Items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL, -- Price at time of order (for historical accuracy)
    total_price DECIMAL(10,2) NOT NULL, -- quantity * unit_price
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Order Status History table (for tracking order progress)
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    changed_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- 5. Daily Sales Summary table (for analytics)
CREATE TABLE IF NOT EXISTS daily_sales_summary (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    total_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    total_tax DECIMAL(10,2) DEFAULT 0,
    total_tips DECIMAL(10,2) DEFAULT 0,
    average_order_value DECIMAL(10,2) DEFAULT 0,
    busiest_hour INTEGER, -- 0-23, hour with most orders
    top_selling_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
    weather_conditions VARCHAR(100), -- Optional weather tracking
    location VARCHAR(255) DEFAULT 'Main Location',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_time ON orders(order_time);
CREATE INDEX IF NOT EXISTS idx_orders_external_order_id ON orders(external_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_daily_sales_summary_date ON daily_sales_summary(date);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- Add triggers to update updated_at timestamps
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_daily_sales_summary_updated_at ON daily_sales_summary;
CREATE TRIGGER update_daily_sales_summary_updated_at BEFORE UPDATE ON daily_sales_summary FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    order_num TEXT;
    order_count INTEGER;
BEGIN
    -- Get count of orders today
    SELECT COUNT(*) INTO order_count
    FROM orders 
    WHERE DATE(order_time) = CURRENT_DATE;
    
    -- Generate order number: YYYYMMDD-###
    order_num := TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD((order_count + 1)::TEXT, 3, '0');
    
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically update daily sales summary
CREATE OR REPLACE FUNCTION update_daily_sales_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert daily summary
    INSERT INTO daily_sales_summary (
        date, 
        total_orders, 
        total_revenue, 
        total_tax, 
        total_tips, 
        average_order_value
    )
    SELECT 
        DATE(order_time),
        COUNT(*),
        SUM(total),
        SUM(tax_amount),
        SUM(tip_amount),
        AVG(total)
    FROM orders 
    WHERE DATE(order_time) = DATE(COALESCE(NEW.order_time, OLD.order_time))
    AND status IN ('completed', 'ready')
    GROUP BY DATE(order_time)
    ON CONFLICT (date) DO UPDATE SET
        total_orders = EXCLUDED.total_orders,
        total_revenue = EXCLUDED.total_revenue,
        total_tax = EXCLUDED.total_tax,
        total_tips = EXCLUDED.total_tips,
        average_order_value = EXCLUDED.average_order_value,
        updated_at = NOW();
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update daily sales summary when orders change
DROP TRIGGER IF EXISTS trigger_update_daily_sales_summary ON orders;
CREATE TRIGGER trigger_update_daily_sales_summary
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_daily_sales_summary();

-- Function to automatically track order status changes
CREATE OR REPLACE FUNCTION track_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only track if status actually changed
    IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) OR TG_OP = 'INSERT' THEN
        INSERT INTO order_status_history (order_id, status, changed_at)
        VALUES (NEW.id, NEW.status, NOW());
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically track order status changes
DROP TRIGGER IF EXISTS trigger_track_order_status_change ON orders;
CREATE TRIGGER trigger_track_order_status_change
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION track_order_status_change();