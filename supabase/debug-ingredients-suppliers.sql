-- Debug what's happening with ingredients and suppliers
-- Run each section one by one and tell me the results

-- 1. Check how many ingredients you have
SELECT COUNT(*) as total_ingredients FROM ingredients;

-- 2. Show all ingredients with their suppliers
SELECT 
    name,
    supplier,
    category
FROM ingredients 
ORDER BY supplier, name;

-- 3. Show distinct suppliers from ingredients
SELECT DISTINCT supplier, COUNT(*) as count
FROM ingredients 
WHERE supplier IS NOT NULL 
AND supplier != '' 
AND TRIM(supplier) != ''
GROUP BY supplier
ORDER BY supplier;

-- 4. Check what suppliers already exist in suppliers table
SELECT name FROM suppliers ORDER BY name;

-- 5. See which suppliers from ingredients are NOT in suppliers table
SELECT DISTINCT i.supplier
FROM ingredients i
WHERE i.supplier IS NOT NULL 
AND i.supplier != ''
AND i.supplier NOT IN (SELECT name FROM suppliers)
ORDER BY i.supplier;

-- 6. Manual insert of suppliers that should exist
-- Let's try a direct approach based on your existing ingredients
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
)
SELECT DISTINCT
    i.supplier,
    'Contact Person',
    LOWER(REPLACE(i.supplier, ' ', '')) || '@example.com',
    '(555) 123-4567',
    '123 Business Ave, City, State 12345',
    ARRAY['Monday', 'Wednesday', 'Friday'],
    200.00,
    2,
    true,
    'Net 30',
    'Auto-created from ingredients',
    true
FROM ingredients i
WHERE i.supplier IS NOT NULL 
AND i.supplier != ''
AND TRIM(i.supplier) != ''
AND i.supplier NOT IN (SELECT COALESCE(s.name, '') FROM suppliers s)
ON CONFLICT (name) DO NOTHING;

-- 7. Check suppliers table again
SELECT * FROM suppliers ORDER BY name;