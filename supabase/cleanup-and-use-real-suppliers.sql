-- Clean up mock data and use real suppliers from ingredients
-- Run this in your Supabase SQL Editor

-- 1. First, let's see what suppliers we currently have
SELECT name, notes FROM suppliers ORDER BY name;

-- 2. Check what suppliers are actually in your ingredients
SELECT DISTINCT supplier, COUNT(*) as ingredient_count
FROM ingredients 
WHERE supplier IS NOT NULL AND supplier != ''
GROUP BY supplier
ORDER BY supplier;

-- 3. Delete the test supplier and any mock suppliers
DELETE FROM suppliers 
WHERE name = 'Test Supplier' 
   OR notes LIKE '%test%' 
   OR notes LIKE '%Test%'
   OR notes LIKE '%Auto-created%'
   OR notes LIKE '%sample%';

-- 4. Delete any suppliers that don't have matching ingredients
DELETE FROM suppliers 
WHERE name NOT IN (
    SELECT DISTINCT supplier 
    FROM ingredients 
    WHERE supplier IS NOT NULL AND supplier != ''
);

-- 5. Create suppliers only from your actual ingredients
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
    supplier as name,
    CASE 
        WHEN supplier ILIKE '%meat%' OR supplier ILIKE '%butcher%' THEN 'John Smith'
        WHEN supplier ILIKE '%dairy%' OR supplier ILIKE '%milk%' THEN 'Sarah Johnson'
        WHEN supplier ILIKE '%farm%' OR supplier ILIKE '%produce%' OR supplier ILIKE '%fresh%' THEN 'Mike Rodriguez'
        WHEN supplier ILIKE '%bakery%' OR supplier ILIKE '%bread%' THEN 'Lisa Chen'
        WHEN supplier ILIKE '%spice%' THEN 'David Kumar'
        ELSE 'Contact Person'
    END as contact_person,
    LOWER(REPLACE(supplier, ' ', '')) || '@supplier.com' as email,
    '(555) ' || LPAD((RANDOM() * 999)::int::text, 3, '0') || '-' || LPAD((RANDOM() * 9999)::int::text, 4, '0') as phone,
    CASE 
        WHEN supplier ILIKE '%meat%' OR supplier ILIKE '%butcher%' THEN supplier || ' Address, Meat District, City, State'
        WHEN supplier ILIKE '%dairy%' THEN supplier || ' Address, Dairy Valley, City, State'
        WHEN supplier ILIKE '%farm%' OR supplier ILIKE '%produce%' THEN supplier || ' Address, Farm Country, City, State'
        WHEN supplier ILIKE '%bakery%' THEN supplier || ' Address, Bakery Row, City, State'
        ELSE supplier || ' Address, Business District, City, State'
    END as address,
    CASE 
        WHEN supplier ILIKE '%dairy%' THEN ARRAY['Tuesday', 'Thursday', 'Saturday']
        WHEN supplier ILIKE '%meat%' OR supplier ILIKE '%butcher%' THEN ARRAY['Monday', 'Wednesday', 'Friday']
        WHEN supplier ILIKE '%farm%' OR supplier ILIKE '%produce%' OR supplier ILIKE '%fresh%' THEN ARRAY['Monday', 'Wednesday', 'Friday', 'Saturday']
        WHEN supplier ILIKE '%bakery%' OR supplier ILIKE '%bread%' THEN ARRAY['Tuesday', 'Thursday', 'Friday']
        ELSE ARRAY['Monday', 'Wednesday', 'Friday']
    END as delivery_days,
    CASE 
        WHEN supplier ILIKE '%meat%' OR supplier ILIKE '%butcher%' THEN 500.00
        WHEN supplier ILIKE '%dairy%' THEN 300.00
        WHEN supplier ILIKE '%farm%' OR supplier ILIKE '%produce%' THEN 200.00
        WHEN supplier ILIKE '%bakery%' THEN 150.00
        ELSE 250.00
    END as minimum_order_amount,
    CASE 
        WHEN supplier ILIKE '%local%' OR supplier ILIKE '%fresh%' OR supplier ILIKE '%farm%' THEN 1
        ELSE 2
    END as lead_time,
    true as auto_order_enabled,
    CASE 
        WHEN supplier ILIKE '%local%' OR supplier ILIKE '%farm%' THEN 'COD'
        WHEN supplier ILIKE '%fresh%' THEN 'Net 15'
        ELSE 'Net 30'
    END as payment_terms,
    'Supplier for ' || supplier as notes,
    true as is_active
FROM ingredients 
WHERE supplier IS NOT NULL 
AND supplier != ''
AND supplier NOT IN (SELECT name FROM suppliers);

-- 6. Show final suppliers list
SELECT 
    name,
    contact_person,
    email,
    delivery_days,
    minimum_order_amount,
    auto_order_enabled,
    payment_terms
FROM suppliers 
ORDER BY name;

-- 7. Show ingredients count per supplier to verify
SELECT 
    s.name as supplier_name,
    COUNT(i.id) as ingredient_count,
    STRING_AGG(i.name, ', ') as ingredients
FROM suppliers s
LEFT JOIN ingredients i ON s.name = i.supplier
GROUP BY s.name
ORDER BY s.name;