-- Debug script to check suppliers creation
-- Run each section one by one in Supabase SQL Editor

-- 1. Check if suppliers table exists and is empty
SELECT COUNT(*) as supplier_count FROM suppliers;

-- 2. Check what's in the ingredients table
SELECT 
    id,
    name,
    supplier,
    category,
    cost_per_unit,
    unit
FROM ingredients 
ORDER BY supplier, name;

-- 3. Check distinct suppliers in ingredients
SELECT 
    supplier,
    COUNT(*) as ingredient_count
FROM ingredients 
WHERE supplier IS NOT NULL 
AND supplier != '' 
AND TRIM(supplier) != ''
GROUP BY supplier
ORDER BY supplier;

-- 4. Check if there are any ingredients at all
SELECT COUNT(*) as total_ingredients FROM ingredients;

-- 5. Show sample ingredients data
SELECT * FROM ingredients LIMIT 5;

-- 6. Try to manually insert one test supplier
INSERT INTO suppliers (
    name,
    contact_person,
    email,
    phone,
    address,
    delivery_days,
    minimum_order_amount,
    lead_time,
    auto_order_enabled,
    payment_terms,
    notes,
    is_active
) VALUES (
    'Test Supplier',
    'John Doe',
    'test@supplier.com',
    '(555) 123-4567',
    '123 Test Street, Test City, TC 12345',
    ARRAY['Monday', 'Wednesday', 'Friday'],
    200.00,
    2,
    true,
    'Net 30',
    'Test supplier created manually',
    true
);

-- 7. Check if the manual supplier was created
SELECT * FROM suppliers;