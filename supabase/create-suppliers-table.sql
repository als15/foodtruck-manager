-- Create the suppliers table with all dependencies
-- Run this in your Supabase SQL Editor

-- First, ensure the update function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the suppliers table
CREATE TABLE suppliers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    delivery_days TEXT[] NOT NULL,
    minimum_order_amount DECIMAL(10,2) DEFAULT 0,
    lead_time INTEGER DEFAULT 1,
    auto_order_enabled BOOLEAN DEFAULT false,
    payment_terms VARCHAR(100) DEFAULT 'Net 30',
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_active ON suppliers(is_active);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_suppliers_updated_at 
    BEFORE UPDATE ON suppliers
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Create policy (allow all operations for now)
CREATE POLICY "Allow all operations" ON suppliers FOR ALL USING (true);

-- Verify the table was created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'suppliers';