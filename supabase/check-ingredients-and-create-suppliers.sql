-- Check ingredients and create suppliers from them
-- Run each section one by one

-- 1. First, let's see what ingredients you have
SELECT COUNT(*) as total_ingredients FROM ingredients;

-- 2. Show sample ingredients
SELECT 
    name,
    supplier,
    category,
    cost_per_unit,
    unit
FROM ingredients 
LIMIT 10;

-- 3. Check distinct suppliers in ingredients (if any)
SELECT 
    COALESCE(supplier, 'NO SUPPLIER') as supplier_name,
    COUNT(*) as ingredient_count
FROM ingredients 
GROUP BY supplier
ORDER BY supplier;

-- 4. If you have no ingredients, let's add some sample ingredients with suppliers
INSERT INTO ingredients (
    name,
    cost_per_unit,
    unit,
    supplier,
    category,
    is_available
) VALUES 
    ('Ground Beef', 8.99, 'lbs', 'Premium Meats Inc', 'Meat', true),
    ('Chicken Breast', 6.50, 'lbs', 'Premium Meats Inc', 'Meat', true),
    ('Cheddar Cheese', 5.25, 'lbs', 'Dairy Fresh Co', 'Dairy', true),
    ('Milk', 3.50, 'gallon', 'Dairy Fresh Co', 'Dairy', true),
    ('Tomatoes', 2.50, 'lbs', 'Fresh Farms', 'Vegetables', true),
    ('Lettuce', 1.75, 'heads', 'Fresh Farms', 'Vegetables', true),
    ('Onions', 1.25, 'lbs', 'Fresh Farms', 'Vegetables', true),
    ('Burger Buns', 3.25, 'dozen', 'Fresh Bakery', 'Bread', true),
    ('Hot Dog Buns', 2.75, 'dozen', 'Fresh Bakery', 'Bread', true),
    ('Salt', 1.50, 'lbs', 'Spice World', 'Spices', true),
    ('Black Pepper', 4.25, 'lbs', 'Spice World', 'Spices', true),
    ('Ketchup', 3.75, 'bottles', 'Condiment Co', 'Condiments', true),
    ('Mustard', 2.85, 'bottles', 'Condiment Co', 'Condiments', true)
ON CONFLICT (name) DO NOTHING;

-- 5. Now create suppliers from the ingredients
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
        WHEN supplier = 'Premium Meats Inc' THEN 'John Smith'
        WHEN supplier = 'Dairy Fresh Co' THEN 'Sarah Johnson'
        WHEN supplier = 'Fresh Farms' THEN 'Mike Rodriguez'
        WHEN supplier = 'Fresh Bakery' THEN 'Lisa Chen'
        WHEN supplier = 'Spice World' THEN 'David Kumar'
        WHEN supplier = 'Condiment Co' THEN 'Anna Wilson'
        ELSE 'Contact Person'
    END as contact_person,
    LOWER(REPLACE(supplier, ' ', '')) || '@supplier.com' as email,
    CASE 
        WHEN supplier = 'Premium Meats Inc' THEN '(555) 123-4567'
        WHEN supplier = 'Dairy Fresh Co' THEN '(555) 234-5678'
        WHEN supplier = 'Fresh Farms' THEN '(555) 345-6789'
        WHEN supplier = 'Fresh Bakery' THEN '(555) 456-7890'
        WHEN supplier = 'Spice World' THEN '(555) 567-8901'
        WHEN supplier = 'Condiment Co' THEN '(555) 678-9012'
        ELSE '(555) 000-0000'
    END as phone,
    CASE 
        WHEN supplier = 'Premium Meats Inc' THEN '123 Butcher Lane, Meatville, CA 90210'
        WHEN supplier = 'Dairy Fresh Co' THEN '456 Milk Road, Dairy Valley, CA 90211'
        WHEN supplier = 'Fresh Farms' THEN '789 Green Valley Drive, Farmland, CA 90212'
        WHEN supplier = 'Fresh Bakery' THEN '321 Baker Street, Breadtown, CA 90213'
        WHEN supplier = 'Spice World' THEN '654 Spice Avenue, Flavortown, CA 90214'
        WHEN supplier = 'Condiment Co' THEN '987 Sauce Street, Tasteville, CA 90215'
        ELSE '123 Supplier Street, City, State 12345'
    END as address,
    CASE 
        WHEN supplier LIKE '%Dairy%' THEN ARRAY['Tuesday', 'Thursday', 'Saturday']
        WHEN supplier LIKE '%Meat%' THEN ARRAY['Monday', 'Wednesday', 'Friday']
        WHEN supplier LIKE '%Farm%' THEN ARRAY['Monday', 'Wednesday', 'Friday', 'Saturday']
        WHEN supplier LIKE '%Bakery%' THEN ARRAY['Tuesday', 'Thursday', 'Friday']
        ELSE ARRAY['Monday', 'Wednesday', 'Friday']
    END as delivery_days,
    CASE 
        WHEN supplier LIKE '%Meat%' THEN 500.00
        WHEN supplier LIKE '%Dairy%' THEN 300.00
        WHEN supplier LIKE '%Farm%' THEN 200.00
        WHEN supplier LIKE '%Bakery%' THEN 150.00
        ELSE 250.00
    END as minimum_order_amount,
    CASE 
        WHEN supplier LIKE '%Fresh%' OR supplier LIKE '%Farm%' THEN 1
        ELSE 2
    END as lead_time,
    true as auto_order_enabled,
    CASE 
        WHEN supplier LIKE '%Farm%' THEN 'COD'
        WHEN supplier LIKE '%Fresh%' THEN 'Net 15'
        ELSE 'Net 30'
    END as payment_terms,
    'Created from ingredient suppliers' as notes,
    true as is_active
FROM ingredients 
WHERE supplier IS NOT NULL 
AND supplier != ''
AND supplier NOT IN (SELECT name FROM suppliers WHERE name != 'Test Supplier');

-- 6. Show all suppliers now
SELECT 
    name,
    contact_person,
    email,
    delivery_days,
    minimum_order_amount,
    auto_order_enabled
FROM suppliers 
ORDER BY name;

-- 7. Count ingredients per supplier
SELECT 
    s.name as supplier_name,
    COUNT(i.id) as ingredient_count
FROM suppliers s
LEFT JOIN ingredients i ON s.name = i.supplier
GROUP BY s.name
ORDER BY s.name;