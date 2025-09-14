-- Create suppliers from your real ingredients data
-- Run this in your Supabase SQL Editor

-- First, let's see the distinct suppliers from your ingredients
SELECT DISTINCT supplier, COUNT(*) as ingredient_count
FROM ingredients 
WHERE supplier IS NOT NULL AND supplier != ''
GROUP BY supplier
ORDER BY supplier;

-- Create realistic suppliers based on your actual ingredient suppliers
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
) VALUES 
-- Meshek Yakobovski - Farm/Produce supplier (most ingredients)
(
    'Meshek Yakobovski',
    'Yaakov Yakobovski',
    'orders@meshekyakobovski.co.il',
    '+972-54-123-4567',
    'Moshav Yakobovski, Northern Israel',
    ARRAY['Sunday', 'Tuesday', 'Thursday'],
    300.00,
    1,
    true,
    'Net 15',
    'Organic farm specializing in fresh vegetables, fruits, and herbs. Local Israeli produce supplier.',
    true
),
-- Boaron - Deli/Prepared foods supplier
(
    'Boaron',
    'David Boaron',
    'supply@boaron.co.il',
    '+972-3-456-7890',
    'Industrial Zone, Tel Aviv, Israel',
    ARRAY['Sunday', 'Wednesday'],
    500.00,
    2,
    true,
    'Net 30',
    'Premium deli and prepared foods supplier. Specializes in salads, spreads, and gourmet items.',
    true
),
-- Beit Maafe - Bakery supplier
(
    'Beit Maafe',
    'Sara Cohen',
    'orders@beitmaafe.co.il',
    '+972-2-789-0123',
    'Jerusalem Bakery District, Israel',
    ARRAY['Sunday', 'Tuesday', 'Thursday', 'Friday'],
    200.00,
    1,
    true,
    'Net 15',
    'Artisan bakery specializing in fresh breads, buns, and bagels. Daily fresh delivery.',
    true
),
-- Evan Yehuda - Dairy and specialty supplier
(
    'Evan Yehuda',
    'Moshe Yehuda',
    'contact@evanyehuda.co.il',
    '+972-9-234-5678',
    'Evan Yehuda, Central Israel',
    ARRAY['Monday', 'Wednesday', 'Friday'],
    400.00,
    1,
    true,
    'Net 20',
    'Premium dairy producer and specialty foods. Known for artisan cheeses and gourmet products.',
    true
),
-- Abudi - Specialty/Pantry supplier
(
    'Abudi',
    'Ahmad Abudi',
    'sales@abudi.co.il',
    '+972-4-345-6789',
    'Haifa Commercial District, Israel',
    ARRAY['Monday', 'Thursday'],
    250.00,
    2,
    true,
    'Net 30',
    'Specialty foods and pantry items supplier. Nuts, syrups, and imported goods.',
    true
),
-- Keep existing non-Israeli suppliers for comparison
-- Premium Meats Inc
(
    'Premium Meats Inc',
    'John Smith',
    'orders@premiummeats.com',
    '(555) 123-4567',
    '123 Butcher Lane, Meatville, CA 90210',
    ARRAY['Monday', 'Wednesday', 'Friday'],
    500.00,
    2,
    true,
    'Net 30',
    'Quality meat supplier for international ingredients',
    true
),
-- Fresh Farms
(
    'Fresh Farms',
    'Mike Rodriguez',
    'mike@freshfarms.com',
    '(555) 345-6789',
    '789 Green Valley Drive, Farmland, CA 90212',
    ARRAY['Monday', 'Wednesday', 'Friday', 'Saturday'],
    200.00,
    1,
    true,
    'COD',
    'International produce supplier',
    true
),
-- Dairy Fresh Co
(
    'Dairy Fresh Co',
    'Sarah Johnson',
    'supply@dairyfresh.com',
    '(555) 234-5678',
    '456 Milk Road, Dairy Valley, CA 90211',
    ARRAY['Tuesday', 'Thursday', 'Saturday'],
    300.00,
    1,
    true,
    'Net 15',
    'International dairy supplier',
    true
),
-- Fresh Bakery
(
    'Fresh Bakery',
    'Lisa Chen',
    'orders@freshbakery.com',
    '(555) 456-7890',
    '321 Baker Street, Breadtown, CA 90213',
    ARRAY['Tuesday', 'Thursday', 'Friday'],
    150.00,
    1,
    false,
    'Net 30',
    'International bakery supplier',
    true
),
-- Spice World
(
    'Spice World',
    'David Kumar',
    'sales@spiceworld.com',
    '(555) 567-8901',
    '654 Spice Avenue, Flavortown, CA 90214',
    ARRAY['Monday', 'Friday'],
    100.00,
    3,
    false,
    'Net 60',
    'International spices and seasonings',
    true
),
-- Condiment Co
(
    'Condiment Co',
    'Anna Wilson',
    'orders@condimentco.com',
    '(555) 678-9012',
    '987 Sauce Street, Tasteville, CA 90215',
    ARRAY['Wednesday'],
    175.00,
    2,
    true,
    'Net 30',
    'International condiments and sauces',
    true
)
ON CONFLICT (name) DO NOTHING;

-- Show the created suppliers with their ingredient counts
SELECT 
    s.name as supplier_name,
    s.contact_person,
    s.email,
    s.delivery_days,
    s.minimum_order_amount,
    s.auto_order_enabled,
    s.payment_terms,
    COUNT(i.id) as ingredient_count
FROM suppliers s
LEFT JOIN ingredients i ON s.name = i.supplier
GROUP BY s.name, s.contact_person, s.email, s.delivery_days, s.minimum_order_amount, s.auto_order_enabled, s.payment_terms
ORDER BY ingredient_count DESC, s.name;

-- Show ingredients by supplier
SELECT 
    supplier,
    COUNT(*) as count,
    STRING_AGG(name, ', ' ORDER BY name) as ingredients
FROM ingredients 
WHERE supplier IS NOT NULL
GROUP BY supplier
ORDER BY count DESC;