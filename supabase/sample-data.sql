-- Sample data for Food Truck Management App
-- Run this after running schema.sql

-- Insert sample ingredients
INSERT INTO ingredients (name, cost_per_unit, unit, supplier, category, is_available) VALUES
('Ground Beef', 8.50, 'lbs', 'Local Butcher Co', 'Meat', true),
('Burger Buns', 0.75, 'piece', 'Fresh Bakery', 'Bread', true),
('Cheddar Cheese', 12.00, 'lbs', 'Dairy Farm Co', 'Dairy', true),
('Lettuce', 2.50, 'head', 'Green Gardens', 'Vegetables', true),
('Tomatoes', 4.00, 'lbs', 'Green Gardens', 'Vegetables', true),
('Fish Fillets', 15.00, 'lbs', 'Ocean Fresh', 'Seafood', true),
('Corn Tortillas', 0.25, 'piece', 'Tortilla Factory', 'Bread', true),
('Onions', 3.00, 'lbs', 'Green Gardens', 'Vegetables', true),
('Bell Peppers', 5.00, 'lbs', 'Green Gardens', 'Vegetables', true),
('Chicken Breast', 7.50, 'lbs', 'Local Butcher Co', 'Meat', true),
('Black Beans', 2.25, 'lbs', 'Dry Goods Co', 'Legumes', true),
('Rice', 1.50, 'lbs', 'Dry Goods Co', 'Grains', true),
('Avocados', 8.00, 'lbs', 'Fresh Produce', 'Vegetables', true),
('Sour Cream', 4.50, 'lbs', 'Dairy Farm Co', 'Dairy', true),
('Salsa', 3.75, 'lbs', 'Local Kitchen', 'Condiments', true);

-- Insert sample employees
INSERT INTO employees (first_name, last_name, email, phone, position, hourly_rate, hire_date, is_active) VALUES
('John', 'Doe', 'john.doe@foodtruck.com', '555-0123', 'Head Chef', 25.00, '2023-01-15', true),
('Jane', 'Smith', 'jane.smith@foodtruck.com', 'jane@example.com', 'Cashier', 18.00, '2023-03-20', true),
('Mike', 'Johnson', 'mike.johnson@foodtruck.com', '555-0125', 'Line Cook', 20.00, '2023-02-10', true),
('Sarah', 'Wilson', 'sarah.wilson@foodtruck.com', '555-0126', 'Manager', 30.00, '2023-01-01', true);

-- Insert sample locations
INSERT INTO locations (name, address, lat, lng, type, permits_required) VALUES
('Downtown Park', '123 Main St, Downtown', 40.7128, -74.0060, 'regular', ARRAY['Food Vendor', 'Park Permit']),
('Business District', '456 Corporate Ave', 40.7580, -73.9855, 'regular', ARRAY['Food Vendor']),
('Music Festival', 'Central Park, Event Area', 40.7812, -73.9665, 'event', ARRAY['Food Vendor', 'Event Permit', 'Special License']),
('University Campus', '789 College St', 40.7505, -73.9934, 'regular', ARRAY['Food Vendor', 'Campus Permit']),
('Beach Boardwalk', '321 Ocean Ave', 40.7282, -73.9942, 'special', ARRAY['Food Vendor', 'Beach Permit']);

-- Insert sample customers
INSERT INTO customers (first_name, last_name, email, phone, loyalty_points, total_orders, total_spent, favorite_items, last_visit) VALUES
('Alice', 'Johnson', 'alice@example.com', '555-0101', 125, 15, 347.50, ARRAY['Classic Burger', 'Fish Tacos'], '2024-01-03'),
('Bob', 'Wilson', 'bob@example.com', '555-0102', 89, 8, 156.75, ARRAY['Classic Burger'], '2024-01-02'),
('Carol', 'Davis', 'carol@example.com', '555-0103', 234, 23, 542.25, ARRAY['Fish Tacos', 'Veggie Wrap'], '2024-01-01'),
('David', 'Brown', 'david@example.com', '555-0104', 45, 5, 89.50, ARRAY['Chicken Burrito'], '2023-12-28'),
('Emma', 'Garcia', 'emma@example.com', '555-0105', 178, 18, 432.75, ARRAY['Fish Tacos', 'Classic Burger'], '2024-01-04');

-- Insert sample transactions
INSERT INTO transactions (date, type, category, amount, description, location, payment_method) VALUES
('2024-01-03', 'revenue', 'Food Sales', 1247.50, 'Daily food sales', 'Downtown Park', 'Mixed'),
('2024-01-03', 'expense', 'Supplies', 245.80, 'Ingredient restocking', 'Warehouse', 'Credit Card'),
('2024-01-02', 'revenue', 'Food Sales', 1150.25, 'Daily food sales', 'Business District', 'Mixed'),
('2024-01-02', 'expense', 'Fuel', 85.00, 'Truck fuel', 'Gas Station', 'Debit Card'),
('2024-01-01', 'revenue', 'Food Sales', 1890.75, 'Festival sales', 'Music Festival', 'Mixed'),
('2024-01-01', 'expense', 'Permits', 150.00, 'Event permit fee', 'City Hall', 'Check');

-- Insert sample inventory items
INSERT INTO inventory_items (name, category, current_stock, unit, min_threshold, cost_per_unit, supplier, last_restocked) VALUES
('Ground Beef', 'Meat', 25.0, 'lbs', 10.0, 8.50, 'Local Butcher Co', '2024-01-01'),
('Burger Buns', 'Bread', 5.0, 'dozen', 12.0, 0.75, 'Fresh Bakery', '2024-01-02'),
('Cheddar Cheese', 'Dairy', 8.0, 'lbs', 5.0, 12.00, 'Dairy Farm Co', '2024-01-01'),
('Lettuce', 'Vegetables', 3.0, 'heads', 6.0, 2.50, 'Green Gardens', '2024-01-03'),
('Tomatoes', 'Vegetables', 12.0, 'lbs', 8.0, 4.00, 'Green Gardens', '2024-01-03');

-- Insert sample menu items (we'll need the ingredient IDs for this)
DO $$
DECLARE
    beef_id UUID;
    bun_id UUID;
    cheese_id UUID;
    lettuce_id UUID;
    tomato_id UUID;
    fish_id UUID;
    tortilla_id UUID;
    chicken_id UUID;
    beans_id UUID;
    rice_id UUID;
    
    classic_burger_id UUID;
    fish_tacos_id UUID;
    chicken_burrito_id UUID;
BEGIN
    -- Get ingredient IDs
    SELECT id INTO beef_id FROM ingredients WHERE name = 'Ground Beef';
    SELECT id INTO bun_id FROM ingredients WHERE name = 'Burger Buns';
    SELECT id INTO cheese_id FROM ingredients WHERE name = 'Cheddar Cheese';
    SELECT id INTO lettuce_id FROM ingredients WHERE name = 'Lettuce';
    SELECT id INTO tomato_id FROM ingredients WHERE name = 'Tomatoes';
    SELECT id INTO fish_id FROM ingredients WHERE name = 'Fish Fillets';
    SELECT id INTO tortilla_id FROM ingredients WHERE name = 'Corn Tortillas';
    SELECT id INTO chicken_id FROM ingredients WHERE name = 'Chicken Breast';
    SELECT id INTO beans_id FROM ingredients WHERE name = 'Black Beans';
    SELECT id INTO rice_id FROM ingredients WHERE name = 'Rice';
    
    -- Insert Classic Burger
    INSERT INTO menu_items (name, description, price, category, allergens, is_available, prep_time)
    VALUES ('Classic Burger', 'Beef patty with lettuce, tomato, and cheese', 12.99, 'Burgers', ARRAY['gluten', 'dairy'], true, 8)
    RETURNING id INTO classic_burger_id;
    
    -- Insert Classic Burger ingredients
    INSERT INTO menu_item_ingredients (menu_item_id, ingredient_id, quantity, unit) VALUES
    (classic_burger_id, beef_id, 0.25, 'lbs'),
    (classic_burger_id, bun_id, 1, 'piece'),
    (classic_burger_id, cheese_id, 0.125, 'lbs'),
    (classic_burger_id, lettuce_id, 0.1, 'head'),
    (classic_burger_id, tomato_id, 0.1, 'lbs');
    
    -- Insert Fish Tacos
    INSERT INTO menu_items (name, description, price, category, allergens, is_available, prep_time)
    VALUES ('Fish Tacos', 'Grilled fish with fresh vegetables', 10.99, 'Tacos', ARRAY['fish'], true, 6)
    RETURNING id INTO fish_tacos_id;
    
    -- Insert Fish Tacos ingredients
    INSERT INTO menu_item_ingredients (menu_item_id, ingredient_id, quantity, unit) VALUES
    (fish_tacos_id, fish_id, 0.2, 'lbs'),
    (fish_tacos_id, tortilla_id, 2, 'piece'),
    (fish_tacos_id, lettuce_id, 0.05, 'head'),
    (fish_tacos_id, tomato_id, 0.05, 'lbs');
    
    -- Insert Chicken Burrito
    INSERT INTO menu_items (name, description, price, category, allergens, is_available, prep_time)
    VALUES ('Chicken Burrito', 'Grilled chicken with rice, beans, and cheese', 11.99, 'Burritos', ARRAY['gluten', 'dairy'], true, 7)
    RETURNING id INTO chicken_burrito_id;
    
    -- Insert Chicken Burrito ingredients
    INSERT INTO menu_item_ingredients (menu_item_id, ingredient_id, quantity, unit) VALUES
    (chicken_burrito_id, chicken_id, 0.2, 'lbs'),
    (chicken_burrito_id, rice_id, 0.25, 'lbs'),
    (chicken_burrito_id, beans_id, 0.15, 'lbs'),
    (chicken_burrito_id, cheese_id, 0.1, 'lbs'),
    (chicken_burrito_id, tortilla_id, 1, 'piece');
    
END $$;

-- Insert sample shifts
DO $$
DECLARE
    john_id UUID;
    jane_id UUID;
    mike_id UUID;
    sarah_id UUID;
BEGIN
    -- Get employee IDs
    SELECT id INTO john_id FROM employees WHERE email = 'john.doe@foodtruck.com';
    SELECT id INTO jane_id FROM employees WHERE email = 'jane.smith@foodtruck.com';
    SELECT id INTO mike_id FROM employees WHERE email = 'mike.johnson@foodtruck.com';
    SELECT id INTO sarah_id FROM employees WHERE email = 'sarah.wilson@foodtruck.com';
    
    -- Insert shifts for today
    INSERT INTO shifts (employee_id, date, start_time, end_time, hours_worked, role, location) VALUES
    (john_id, CURRENT_DATE, '09:00', '17:00', 8.0, 'Head Chef', 'Downtown Park'),
    (jane_id, CURRENT_DATE, '10:00', '18:00', 8.0, 'Cashier', 'Downtown Park'),
    (mike_id, CURRENT_DATE, '11:00', '19:00', 8.0, 'Line Cook', 'Downtown Park'),
    (sarah_id, CURRENT_DATE, '08:00', '16:00', 8.0, 'Manager', 'Downtown Park');
    
END $$;

-- Insert sample routes
DO $$
DECLARE
    downtown_id UUID;
    business_id UUID;
    festival_id UUID;
    route1_id UUID;
    route2_id UUID;
BEGIN
    -- Get location IDs
    SELECT id INTO downtown_id FROM locations WHERE name = 'Downtown Park';
    SELECT id INTO business_id FROM locations WHERE name = 'Business District';
    SELECT id INTO festival_id FROM locations WHERE name = 'Music Festival';
    
    -- Insert today's route
    INSERT INTO routes (name, date, estimated_revenue, actual_revenue, expenses, status)
    VALUES ('Daily Downtown Route', CURRENT_DATE, 1500.00, 1247.50, 245.00, 'completed')
    RETURNING id INTO route1_id;
    
    -- Insert future route
    INSERT INTO routes (name, date, estimated_revenue, expenses, status)
    VALUES ('Weekend Festival', CURRENT_DATE + INTERVAL '2 days', 2500.00, 350.00, 'planned')
    RETURNING id INTO route2_id;
    
    -- Insert route locations
    INSERT INTO route_locations (route_id, location_id, order_index) VALUES
    (route1_id, downtown_id, 1),
    (route1_id, business_id, 2),
    (route2_id, festival_id, 1);
    
END $$;