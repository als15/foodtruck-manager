-- Disable RLS on all existing tables first
-- Run this in your Supabase SQL Editor

-- Disable RLS on existing tables
ALTER TABLE IF EXISTS ingredients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS menu_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS menu_item_ingredients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS route_locations DISABLE ROW LEVEL SECURITY;

-- Enable uuid extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create suppliers table without RLS
CREATE TABLE suppliers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    delivery_days TEXT[] NOT NULL DEFAULT '{}',
    minimum_order_amount DECIMAL(10,2) DEFAULT 0,
    lead_time INTEGER DEFAULT 1,
    auto_order_enabled BOOLEAN DEFAULT false,
    payment_terms VARCHAR(100) DEFAULT 'Net 30',
    notes TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_active ON suppliers(is_active);

-- Create update trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_suppliers_updated_at 
    BEFORE UPDATE ON suppliers
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verify table creation
SELECT 
    table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'suppliers'
GROUP BY table_name;

-- Show all columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'suppliers'
ORDER BY ordinal_position;