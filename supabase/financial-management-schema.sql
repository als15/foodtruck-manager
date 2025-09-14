-- Financial Management Schema
-- Add these tables to support comprehensive financial management

-- 1. Expense Categories table
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('fixed', 'variable', 'one_time')),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('fixed', 'variable', 'one_time')),
    frequency VARCHAR(50) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly', 'one_time')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Financial Goals table
CREATE TABLE IF NOT EXISTS financial_goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('monthly_revenue', 'monthly_profit', 'break_even', 'custom')),
    target_amount DECIMAL(10,2) NOT NULL,
    current_amount DECIMAL(10,2) DEFAULT 0,
    target_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Financial Projections table
CREATE TABLE IF NOT EXISTS financial_projections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    projection_period VARCHAR(50) NOT NULL CHECK (projection_period IN ('monthly', 'quarterly', 'yearly')),
    projected_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
    projected_expenses DECIMAL(10,2) NOT NULL DEFAULT 0,
    projected_profit DECIMAL(10,2) NOT NULL DEFAULT 0,
    average_order_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    orders_per_day INTEGER NOT NULL DEFAULT 0,
    working_days_per_month INTEGER NOT NULL DEFAULT 22,
    profit_margin_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    break_even_point INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Cash Flow table
CREATE TABLE IF NOT EXISTS cash_flows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('inflow', 'outflow')),
    amount DECIMAL(10,2) NOT NULL,
    category VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    recurring BOOLEAN DEFAULT false,
    recurring_period VARCHAR(50) CHECK (recurring_period IN ('daily', 'weekly', 'monthly', 'yearly')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default expense categories for food truck business
INSERT INTO expense_categories (name, type, description) VALUES
('Truck Payment/Lease', 'fixed', 'Monthly payment or lease for the food truck'),
('Insurance', 'fixed', 'Business, vehicle, and liability insurance'),
('Permits & Licenses', 'fixed', 'Health permits, business licenses, vendor permits'),
('Fuel', 'variable', 'Gasoline for truck and generator'),
('Food & Ingredients', 'variable', 'Raw materials and ingredients for menu items'),
('Maintenance & Repairs', 'variable', 'Truck and equipment maintenance'),
('Marketing', 'variable', 'Advertising, social media, promotional materials'),
('Utilities', 'fixed', 'Phone, internet, storage facility utilities'),
('Equipment', 'one_time', 'Kitchen equipment, tools, and appliances'),
('Initial Investment', 'one_time', 'Startup costs and initial capital'),
('Staff Wages', 'variable', 'Employee salaries and wages'),
('Packaging & Supplies', 'variable', 'Food containers, napkins, utensils')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(type);
CREATE INDEX IF NOT EXISTS idx_expenses_is_active ON expenses(is_active);
CREATE INDEX IF NOT EXISTS idx_financial_goals_type ON financial_goals(type);
CREATE INDEX IF NOT EXISTS idx_financial_goals_is_active ON financial_goals(is_active);
CREATE INDEX IF NOT EXISTS idx_cash_flows_date ON cash_flows(date);
CREATE INDEX IF NOT EXISTS idx_cash_flows_type ON cash_flows(type);

-- Add triggers to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_expense_categories_updated_at BEFORE UPDATE ON expense_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_goals_updated_at BEFORE UPDATE ON financial_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_projections_updated_at BEFORE UPDATE ON financial_projections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();