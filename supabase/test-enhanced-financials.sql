-- Test data for enhanced financial calculations

-- Sample menu items with realistic pricing and profit margins
INSERT INTO menu_items (name, description, price, category, allergens, is_available, prep_time) 
VALUES 
  ('Classic Burger', 'Beef patty with lettuce, tomato, onion', 12.99, 'Burgers', '{}', true, 8),
  ('Chicken Sandwich', 'Grilled chicken breast with mayo', 11.49, 'Sandwiches', '{}', true, 7),
  ('Fish Tacos', 'Fresh fish with cabbage slaw', 14.99, 'Tacos', '{"fish"}', true, 10),
  ('Veggie Wrap', 'Fresh vegetables in tortilla wrap', 9.99, 'Wraps', '{}', true, 5),
  ('BBQ Pulled Pork', 'Slow-cooked pork with BBQ sauce', 13.49, 'Sandwiches', '{}', true, 6),
  ('Caesar Salad', 'Romaine lettuce with Caesar dressing', 8.99, 'Salads', '{}', true, 4),
  ('Loaded Fries', 'Fries with cheese, bacon, and sour cream', 7.99, 'Sides', '{"dairy"}', true, 6),
  ('Craft Soda', 'Locally made artisan sodas', 3.99, 'Beverages', '{}', true, 1)
ON CONFLICT (name) DO NOTHING;

-- Add some sample ingredients for cost calculation
INSERT INTO ingredients (name, cost_per_unit, unit, supplier, category, is_available) 
VALUES 
  ('Ground Beef', 6.99, 'lb', 'Local Butcher', 'Meat', true),
  ('Chicken Breast', 4.99, 'lb', 'Local Butcher', 'Meat', true),
  ('Fresh Fish', 12.99, 'lb', 'Seafood Co', 'Seafood', true),
  ('Burger Buns', 3.99, 'pack of 8', 'Bakery Supply', 'Bread', true),
  ('Lettuce', 2.49, 'head', 'Produce Market', 'Vegetables', true),
  ('Tomatoes', 3.99, 'lb', 'Produce Market', 'Vegetables', true),
  ('Cheese Slices', 4.99, 'pack', 'Dairy Co', 'Dairy', true)
ON CONFLICT (name) DO NOTHING;

-- Sample menu item ingredients (simplified for demonstration)
-- For Classic Burger
INSERT INTO menu_item_ingredients (menu_item_id, ingredient_id, quantity, unit)
SELECT 
  mi.id,
  i.id,
  0.25,
  'lb'
FROM menu_items mi, ingredients i
WHERE mi.name = 'Classic Burger' AND i.name = 'Ground Beef'
LIMIT 1;

INSERT INTO menu_item_ingredients (menu_item_id, ingredient_id, quantity, unit)
SELECT 
  mi.id,
  i.id,
  1,
  'bun'
FROM menu_items mi, ingredients i
WHERE mi.name = 'Classic Burger' AND i.name = 'Burger Buns'
LIMIT 1;

-- For Chicken Sandwich
INSERT INTO menu_item_ingredients (menu_item_id, ingredient_id, quantity, unit)
SELECT 
  mi.id,
  i.id,
  0.2,
  'lb'
FROM menu_items mi, ingredients i
WHERE mi.name = 'Chicken Sandwich' AND i.name = 'Chicken Breast'
LIMIT 1;

-- Query to see the menu items and their calculated margins
SELECT 
  name,
  price,
  total_ingredient_cost,
  profit_margin,
  (price - total_ingredient_cost) as profit_amount,
  is_available
FROM menu_items
ORDER BY price DESC;

-- Query to calculate overall average order value and profit margin
SELECT 
  'Financial Analysis' as metric,
  COUNT(*) as total_items,
  COUNT(*) FILTER (WHERE is_available = true) as available_items,
  AVG(price) FILTER (WHERE is_available = true) as avg_order_value,
  AVG(profit_margin) FILTER (WHERE is_available = true AND profit_margin > 0) as avg_profit_margin_percent,
  AVG(price - total_ingredient_cost) FILTER (WHERE is_available = true) as avg_profit_per_item
FROM menu_items;