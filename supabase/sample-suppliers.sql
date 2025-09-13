-- Sample Suppliers Data for Testing
-- Run this in your Supabase SQL Editor to add test suppliers

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
-- Meat Suppliers
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
    'Best quality meat supplier in the area. Always delivers fresh products.',
    true
),

-- Dairy Suppliers
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
    'Local dairy farm with organic certification.',
    true
),

-- Produce Suppliers
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
    'Seasonal produce supplier. Great prices for bulk orders.',
    true
),

-- Bakery Suppliers
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
    'Artisan bakery products. Pre-orders required for specialty items.',
    true
),

-- Spice & Condiment Suppliers
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
    'Wide variety of spices and condiments. Bulk discounts available.',
    true
),

-- Beverage Suppliers
(
    'Beverage Distributors LLC',
    'Amanda White',
    'service@bevdist.com',
    '(555) 678-9012',
    '987 Liquid Lane, Drinkburg, CA 90215',
    ARRAY['Monday', 'Wednesday'],
    400.00,
    2,
    true,
    'Net 30',
    'Full beverage distributor. Handles sodas, juices, and specialty drinks.',
    true
),

-- Packaging Suppliers
(
    'EcoPack Solutions',
    'Robert Green',
    'info@ecopack.com',
    '(555) 789-0123',
    '147 Package Plaza, Wrapville, CA 90216',
    ARRAY['Thursday'],
    250.00,
    5,
    false,
    'Prepaid',
    'Eco-friendly packaging solutions. Sustainable and biodegradable options.',
    true
),

-- Inactive supplier for testing
(
    'Old Supplier Co',
    'Tom Wilson',
    'contact@oldsupplier.com',
    '(555) 890-1234',
    '258 Old Road, Pastville, CA 90217',
    ARRAY['Monday'],
    1000.00,
    7,
    false,
    'Net 30',
    'Former supplier - keeping for historical records.',
    false
);