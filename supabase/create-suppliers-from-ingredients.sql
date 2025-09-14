-- Create suppliers from existing ingredient suppliers
-- Run this in your Supabase SQL Editor

-- First, let's see what suppliers we have in ingredients
SELECT DISTINCT supplier, COUNT(*) as ingredient_count
FROM ingredients 
WHERE supplier IS NOT NULL AND supplier != ''
GROUP BY supplier
ORDER BY supplier;

-- Create suppliers from existing ingredient suppliers
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
    'Contact Person' as contact_person,
    LOWER(REPLACE(supplier, ' ', '')) || '@supplier.com' as email,
    '(555) 000-0000' as phone,
    '123 Supplier Street, City, State 12345' as address,
    ARRAY['Monday', 'Wednesday', 'Friday'] as delivery_days,
    200.00 as minimum_order_amount,
    2 as lead_time,
    true as auto_order_enabled,
    'Net 30' as payment_terms,
    'Auto-created from existing ingredient suppliers' as notes,
    true as is_active
FROM ingredients 
WHERE supplier IS NOT NULL 
AND supplier != ''
AND supplier NOT IN (SELECT name FROM suppliers);

-- Update suppliers with more realistic data based on common supplier types
UPDATE suppliers SET
    contact_person = 'John Smith',
    email = 'orders@' || LOWER(REPLACE(name, ' ', '')) || '.com',
    phone = '(555) 123-' || LPAD((id::text)::numeric::int % 9999, 4, '0'),
    delivery_days = CASE 
        WHEN name ILIKE '%dairy%' OR name ILIKE '%milk%' THEN ARRAY['Tuesday', 'Thursday', 'Saturday']
        WHEN name ILIKE '%meat%' OR name ILIKE '%butcher%' THEN ARRAY['Monday', 'Wednesday', 'Friday']
        WHEN name ILIKE '%farm%' OR name ILIKE '%produce%' THEN ARRAY['Monday', 'Wednesday', 'Friday', 'Saturday']
        WHEN name ILIKE '%bakery%' OR name ILIKE '%bread%' THEN ARRAY['Tuesday', 'Thursday', 'Friday']
        ELSE ARRAY['Monday', 'Wednesday', 'Friday']
    END,
    minimum_order_amount = CASE 
        WHEN name ILIKE '%meat%' OR name ILIKE '%butcher%' THEN 500.00
        WHEN name ILIKE '%dairy%' THEN 300.00
        WHEN name ILIKE '%farm%' OR name ILIKE '%produce%' THEN 200.00
        WHEN name ILIKE '%bakery%' THEN 150.00
        ELSE 250.00
    END,
    lead_time = CASE 
        WHEN name ILIKE '%local%' THEN 1
        WHEN name ILIKE '%fresh%' OR name ILIKE '%farm%' THEN 1
        ELSE 2
    END,
    payment_terms = CASE 
        WHEN name ILIKE '%local%' THEN 'COD'
        WHEN name ILIKE '%fresh%' OR name ILIKE '%farm%' THEN 'Net 15'
        ELSE 'Net 30'
    END;

-- Show the created suppliers
SELECT 
    name,
    contact_person,
    email,
    phone,
    delivery_days,
    minimum_order_amount,
    lead_time,
    auto_order_enabled,
    payment_terms
FROM suppliers 
ORDER BY name;

-- Show count of suppliers created
SELECT COUNT(*) as total_suppliers FROM suppliers;