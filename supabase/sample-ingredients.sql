-- Sample Ingredients Data for Testing
-- Run this in your Supabase SQL Editor to add test data

INSERT INTO ingredients (name, cost_per_unit, unit, supplier, category, is_available) VALUES
-- Vegetables
('Tomatoes', 2.50, 'lbs', 'Fresh Farms Co', 'Vegetables', true),
('Lettuce', 1.80, 'head', 'Green Valley Suppliers', 'Vegetables', true),
('Onions', 1.20, 'lbs', 'Farm Direct', 'Vegetables', true),
('Bell Peppers', 3.00, 'lbs', 'Fresh Farms Co', 'Vegetables', true),
('Mushrooms', 4.50, 'lbs', 'Organic Gardens', 'Vegetables', true),

-- Meat
('Ground Beef', 8.99, 'lbs', 'Premium Meats Inc', 'Meat', true),
('Chicken Breast', 6.50, 'lbs', 'Quality Poultry', 'Meat', true),
('Bacon', 12.00, 'lbs', 'Premium Meats Inc', 'Meat', true),
('Turkey', 7.25, 'lbs', 'Quality Poultry', 'Meat', false),

-- Dairy
('Cheddar Cheese', 8.50, 'lbs', 'Dairy Fresh', 'Dairy', true),
('Mozzarella', 7.80, 'lbs', 'Dairy Fresh', 'Dairy', true),
('Butter', 4.20, 'lbs', 'Local Creamery', 'Dairy', true),
('Sour Cream', 3.50, 'container', 'Dairy Fresh', 'Dairy', true),

-- Pantry Items
('Flour', 2.00, 'lbs', 'Bulk Foods', 'Pantry', true),
('Salt', 1.50, 'container', 'Spice World', 'Pantry', true),
('Black Pepper', 8.00, 'container', 'Spice World', 'Pantry', true),
('Olive Oil', 12.00, 'bottle', 'Mediterranean Imports', 'Pantry', true),
('Garlic', 3.00, 'lbs', 'Farm Direct', 'Pantry', true),

-- Condiments
('Ketchup', 3.50, 'bottle', 'Condiment Co', 'Condiments', true),
('Mustard', 2.80, 'bottle', 'Condiment Co', 'Condiments', true),
('Mayo', 4.20, 'jar', 'Condiment Co', 'Condiments', true),
('BBQ Sauce', 5.50, 'bottle', 'Sauce Masters', 'Condiments', true);