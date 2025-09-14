-- Sample Orders Import
-- This demonstrates how orders would be imported from a Defrayal machine or other POS system

-- First, let's add some sample menu items if they don't exist
INSERT INTO menu_items (name, description, price, category, is_available, prep_time) VALUES
('Classic Burger', 'Beef patty with lettuce, tomato, and onion', 12.99, 'Burgers', true, 8),
('Chicken Sandwich', 'Grilled chicken breast with mayo and lettuce', 11.49, 'Sandwiches', true, 7),
('Fish Tacos', 'Fresh fish with cabbage slaw and chipotle sauce', 14.99, 'Tacos', true, 10),
('Fries', 'Crispy golden french fries', 4.99, 'Sides', true, 5),
('Soda', 'Soft drinks (various flavors)', 2.99, 'Beverages', true, 1)
ON CONFLICT (name) DO NOTHING;

-- Sample orders that might come from a Defrayal machine
-- These would typically be imported via the application's import functionality

-- Order 1: Lunch rush order
WITH order_1 AS (
  INSERT INTO orders (
    order_number,
    total,
    subtotal,
    tax_amount,
    status,
    order_time,
    location,
    payment_method,
    external_order_id,
    external_source
  ) VALUES (
    '20240115-001',
    15.48,
    14.23,
    1.25,
    'completed',
    '2024-01-15 12:30:00',
    'Main Location',
    'card',
    'DEF001',
    'defrayal'
  ) RETURNING id
),
burger_item AS (
  SELECT id FROM menu_items WHERE name = 'Classic Burger' LIMIT 1
),
soda_item AS (
  SELECT id FROM menu_items WHERE name = 'Soda' LIMIT 1
)
INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price)
SELECT order_1.id, burger_item.id, 1, 12.99, 12.99 FROM order_1, burger_item
UNION ALL
SELECT order_1.id, soda_item.id, 1, 2.99, 2.99 FROM order_1, soda_item;

-- Order 2: Family order
WITH order_2 AS (
  INSERT INTO orders (
    order_number,
    total,
    subtotal,
    tax_amount,
    tip_amount,
    status,
    order_time,
    location,
    payment_method,
    external_order_id,
    external_source
  ) VALUES (
    '20240115-002',
    34.95,
    32.45,
    2.50,
    5.00,
    'completed',
    '2024-01-15 13:15:00',
    'Main Location',
    'card',
    'DEF002',
    'defrayal'
  ) RETURNING id
),
burger_item AS (
  SELECT id FROM menu_items WHERE name = 'Classic Burger' LIMIT 1
),
chicken_item AS (
  SELECT id FROM menu_items WHERE name = 'Chicken Sandwich' LIMIT 1
),
fries_item AS (
  SELECT id FROM menu_items WHERE name = 'Fries' LIMIT 1
),
soda_item AS (
  SELECT id FROM menu_items WHERE name = 'Soda' LIMIT 1
)
INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price)
SELECT order_2.id, burger_item.id, 1, 12.99, 12.99 FROM order_2, burger_item
UNION ALL
SELECT order_2.id, chicken_item.id, 1, 11.49, 11.49 FROM order_2, chicken_item
UNION ALL
SELECT order_2.id, fries_item.id, 2, 4.99, 9.98 FROM order_2, fries_item
UNION ALL
SELECT order_2.id, soda_item.id, 2, 2.99, 5.98 FROM order_2, soda_item;

-- Order 3: Current pending order (in kitchen)
WITH order_3 AS (
  INSERT INTO orders (
    order_number,
    total,
    subtotal,
    tax_amount,
    status,
    order_time,
    location,
    payment_method,
    external_order_id,
    external_source
  ) VALUES (
    '20240115-003',
    17.48,
    16.23,
    1.25,
    'preparing',
    NOW() - INTERVAL '10 minutes',
    'Main Location',
    'card',
    'DEF003',
    'defrayal'
  ) RETURNING id
),
tacos_item AS (
  SELECT id FROM menu_items WHERE name = 'Fish Tacos' LIMIT 1
),
soda_item AS (
  SELECT id FROM menu_items WHERE name = 'Soda' LIMIT 1
)
INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, total_price)
SELECT order_3.id, tacos_item.id, 1, 14.99, 14.99 FROM order_3, tacos_item
UNION ALL
SELECT order_3.id, soda_item.id, 1, 2.99, 2.99 FROM order_3, soda_item;

-- Add some more orders for realistic data
-- Morning orders
INSERT INTO orders (
  order_number, total, subtotal, tax_amount, status, order_time, 
  location, payment_method, external_order_id, external_source
) VALUES 
('20240115-004', 7.98, 7.48, 0.50, 'completed', '2024-01-15 09:30:00', 'Main Location', 'cash', 'DEF004', 'defrayal'),
('20240115-005', 23.97, 22.47, 1.50, 'completed', '2024-01-15 11:00:00', 'Main Location', 'card', 'DEF005', 'defrayal'),
('20240115-006', 41.94, 39.44, 2.50, 'completed', '2024-01-15 12:00:00', 'Main Location', 'mobile', 'DEF006', 'defrayal');

-- Check the imported orders
SELECT 
  o.order_number,
  o.total,
  o.status,
  o.order_time,
  o.external_source,
  COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.external_source = 'defrayal'
GROUP BY o.id, o.order_number, o.total, o.status, o.order_time, o.external_source
ORDER BY o.order_time DESC;