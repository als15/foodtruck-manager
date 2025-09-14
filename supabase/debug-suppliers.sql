-- Debug script to check what's happening with suppliers table
-- Run each section one by one in Supabase SQL Editor

-- 1. Check if uuid extension is enabled (required for uuid_generate_v4())
SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';

-- If the above returns no rows, run this:
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Check what tables currently exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 3. Try to create a simple suppliers table first
CREATE TABLE IF NOT EXISTS suppliers_test (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- 4. Check if the test table was created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'suppliers_test';

-- 5. If test table works, drop it and try full suppliers table
DROP TABLE IF EXISTS suppliers_test;

-- 6. Create the actual suppliers table (step by step)
CREATE TABLE suppliers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    delivery_days TEXT[],
    minimum_order_amount DECIMAL(10,2) DEFAULT 0,
    lead_time INTEGER DEFAULT 1,
    auto_order_enabled BOOLEAN DEFAULT false,
    payment_terms VARCHAR(100) DEFAULT 'Net 30',
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Verify suppliers table exists
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'suppliers' 
AND table_schema = 'public'
ORDER BY ordinal_position;