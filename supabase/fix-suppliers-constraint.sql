-- Fix suppliers table and create suppliers from ingredients
-- Run each section one by one

-- 1. First, let's see what's in your ingredients table
SELECT COUNT(*) as total_ingredients FROM ingredients;

-- 2. Show sample ingredients
SELECT name, supplier, category FROM ingredients LIMIT 10;

-- 3. Show distinct suppliers from ingredients
SELECT DISTINCT supplier, COUNT(*) as ingredient_count
FROM ingredients 
WHERE supplier IS NOT NULL AND supplier != ''
GROUP BY supplier
ORDER BY supplier;

-- 4. Add unique constraint to suppliers table
ALTER TABLE suppliers ADD CONSTRAINT suppliers_name_unique UNIQUE (name);

-- 5. Now safely insert suppliers from ingredients (without ON CONFLICT)
-- First, let's see which suppliers we need to create
SELECT DISTINCT i.supplier
FROM ingredients i
WHERE i.supplier IS NOT NULL 
AND i.supplier != ''
AND i.supplier NOT IN (SELECT name FROM suppliers);

-- 6. Insert missing suppliers one by one to avoid conflicts
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
AND i.supplier NOT IN (SELECT name FROM suppliers);

-- 7. Show all suppliers now
SELECT * FROM suppliers ORDER BY name;

-- 8. Show count of ingredients per supplier
SELECT 
    s.name as supplier_name,
    COUNT(i.id) as ingredient_count
FROM suppliers s
LEFT JOIN ingredients i ON s.name = i.supplier
GROUP BY s.name
ORDER BY s.name;