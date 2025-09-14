-- If you have no ingredients, run this to add sample data
-- Only run this if your ingredients table is empty

-- Add sample ingredients with suppliers
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
    ('Burger Buns', 3.25, 'dozen', 'Fresh Bakery', 'Bread', true),
    ('Salt', 1.50, 'lbs', 'Spice World', 'Spices', true),
    ('Ketchup', 3.75, 'bottles', 'Condiment Co', 'Condiments', true);

-- Then create suppliers for these ingredients
INSERT INTO suppliers (name, contact_person, email, phone, address, delivery_days, minimum_order_amount, lead_time, auto_order_enabled, payment_terms, notes, is_active)
VALUES 
    ('Premium Meats Inc', 'John Smith', 'orders@premiummeats.com', '(555) 123-4567', '123 Butcher Lane, Meatville, CA', ARRAY['Monday', 'Wednesday', 'Friday'], 500.00, 2, true, 'Net 30', 'Quality meat supplier', true),
    ('Dairy Fresh Co', 'Sarah Johnson', 'supply@dairyfresh.com', '(555) 234-5678', '456 Milk Road, Dairy Valley, CA', ARRAY['Tuesday', 'Thursday', 'Saturday'], 300.00, 1, true, 'Net 15', 'Local dairy farm', true),
    ('Fresh Farms', 'Mike Rodriguez', 'mike@freshfarms.com', '(555) 345-6789', '789 Green Valley Drive, Farmland, CA', ARRAY['Monday', 'Wednesday', 'Friday', 'Saturday'], 200.00, 1, true, 'COD', 'Seasonal produce supplier', true),
    ('Fresh Bakery', 'Lisa Chen', 'orders@freshbakery.com', '(555) 456-7890', '321 Baker Street, Breadtown, CA', ARRAY['Tuesday', 'Thursday', 'Friday'], 150.00, 1, false, 'Net 30', 'Artisan bakery products', true),
    ('Spice World', 'David Kumar', 'sales@spiceworld.com', '(555) 567-8901', '654 Spice Avenue, Flavortown, CA', ARRAY['Monday', 'Friday'], 100.00, 3, false, 'Net 60', 'Wide variety of spices', true),
    ('Condiment Co', 'Anna Wilson', 'orders@condimentco.com', '(555) 678-9012', '987 Sauce Street, Tasteville, CA', ARRAY['Wednesday'], 175.00, 2, true, 'Net 30', 'Sauces and condiments', true);

-- Show results
SELECT * FROM suppliers WHERE name != 'Test Supplier' ORDER BY name;