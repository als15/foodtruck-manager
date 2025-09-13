-- Sample Menu Items Data for Testing
-- Run this in your Supabase SQL Editor after running sample-ingredients.sql

-- Insert sample menu items using predefined categories
INSERT INTO menu_items (name, description, price, category, allergens, is_available, prep_time) VALUES
-- Sandwiches
('Classic Burger', 'Beef patty with lettuce, tomato, and cheese on a fresh bun', 12.99, 'sandwiches', ARRAY['gluten', 'dairy'], true, 8),
('BBQ Bacon Burger', 'Beef patty with crispy bacon, BBQ sauce, and cheddar cheese', 14.99, 'sandwiches', ARRAY['gluten', 'dairy'], true, 10),
('Veggie Wrap', 'Fresh vegetables with hummus in a whole wheat tortilla', 8.99, 'sandwiches', ARRAY['gluten'], true, 5),

-- Salads
('Caesar Salad', 'Crisp romaine lettuce with parmesan cheese and croutons', 9.99, 'salads', ARRAY['gluten', 'dairy'], true, 5),
('Garden Salad', 'Mixed greens with tomatoes, peppers, and house dressing', 7.99, 'salads', ARRAY[], true, 3),

-- Desserts
('Chocolate Brownie', 'Rich chocolate brownie with vanilla ice cream', 6.99, 'desserts', ARRAY['gluten', 'dairy'], true, 2),
('Apple Pie Slice', 'Homemade apple pie with cinnamon and sugar', 5.99, 'desserts', ARRAY['gluten'], true, 2),

-- Sweet Pastries
('Blueberry Muffin', 'Fresh baked muffin with wild blueberries', 3.99, 'sweet pastries', ARRAY['gluten', 'dairy'], true, 1),
('Cinnamon Roll', 'Warm cinnamon roll with cream cheese glaze', 4.99, 'sweet pastries', ARRAY['gluten', 'dairy'], true, 2),

-- Savory Pastries
('Cheese Croissant', 'Buttery croissant filled with melted cheese', 4.99, 'savory pastries', ARRAY['gluten', 'dairy'], true, 3),
('Spinach Quiche', 'Flaky pastry filled with spinach and cheese', 6.99, 'savory pastries', ARRAY['gluten', 'dairy'], true, 4),

-- Fruit Shakes
('Strawberry Shake', 'Creamy strawberry milkshake with fresh berries', 5.99, 'fruit shakes', ARRAY['dairy'], true, 3),
('Mango Smoothie', 'Tropical mango smoothie with coconut milk', 6.99, 'fruit shakes', ARRAY[], true, 3),

-- Hot Drinks
('Cappuccino', 'Rich espresso with steamed milk and foam', 4.99, 'hot drinks', ARRAY['dairy'], true, 4),
('Hot Chocolate', 'Creamy hot chocolate with whipped cream', 3.99, 'hot drinks', ARRAY['dairy'], true, 3),

-- Cold Drinks
('Iced Coffee', 'Cold brew coffee served over ice', 3.99, 'cold drinks', ARRAY[], true, 2),
('Lemonade', 'Fresh squeezed lemonade with mint', 2.99, 'cold drinks', ARRAY[], true, 1);

-- Get the menu item IDs for ingredient associations
DO $$
DECLARE
    burger_id UUID;
    bbq_burger_id UUID;
    tacos_id UUID;
    wrap_id UUID;
    fries_id UUID;
    beef_id UUID;
    buns_id UUID;
    cheese_id UUID;
    lettuce_id UUID;
    tomato_id UUID;
    bacon_id UUID;
    bbq_sauce_id UUID;
    chicken_id UUID;
    onion_id UUID;
    pepper_id UUID;
    sour_cream_id UUID;
BEGIN
    -- Get menu item IDs
    SELECT id INTO burger_id FROM menu_items WHERE name = 'Classic Burger';
    SELECT id INTO bbq_burger_id FROM menu_items WHERE name = 'BBQ Bacon Burger';
    SELECT id INTO wrap_id FROM menu_items WHERE name = 'Veggie Wrap';
    
    -- Get ingredient IDs (using names from sample-ingredients.sql)
    SELECT id INTO beef_id FROM ingredients WHERE name = 'Ground Beef';
    SELECT id INTO cheese_id FROM ingredients WHERE name = 'Cheddar Cheese';
    SELECT id INTO lettuce_id FROM ingredients WHERE name = 'Lettuce';
    SELECT id INTO tomato_id FROM ingredients WHERE name = 'Tomatoes';
    SELECT id INTO bacon_id FROM ingredients WHERE name = 'Bacon';
    SELECT id INTO bbq_sauce_id FROM ingredients WHERE name = 'BBQ Sauce';
    SELECT id INTO chicken_id FROM ingredients WHERE name = 'Chicken Breast';
    SELECT id INTO onion_id FROM ingredients WHERE name = 'Onions';
    SELECT id INTO pepper_id FROM ingredients WHERE name = 'Bell Peppers';
    SELECT id INTO sour_cream_id FROM ingredients WHERE name = 'Sour Cream';
    
    -- Classic Burger ingredients
    IF burger_id IS NOT NULL THEN
        INSERT INTO menu_item_ingredients (menu_item_id, ingredient_id, quantity, unit) VALUES
        (burger_id, beef_id, 0.25, 'lbs'),
        (burger_id, cheese_id, 0.125, 'lbs'),
        (burger_id, lettuce_id, 0.1, 'head'),
        (burger_id, tomato_id, 0.1, 'lbs');
    END IF;
    
    -- BBQ Bacon Burger ingredients
    IF bbq_burger_id IS NOT NULL THEN
        INSERT INTO menu_item_ingredients (menu_item_id, ingredient_id, quantity, unit) VALUES
        (bbq_burger_id, beef_id, 0.33, 'lbs'),
        (bbq_burger_id, bacon_id, 0.125, 'lbs'),
        (bbq_burger_id, cheese_id, 0.125, 'lbs'),
        (bbq_burger_id, bbq_sauce_id, 0.1, 'bottle');
    END IF;
    
    
    -- Veggie Wrap ingredients
    IF wrap_id IS NOT NULL THEN
        INSERT INTO menu_item_ingredients (menu_item_id, ingredient_id, quantity, unit) VALUES
        (wrap_id, lettuce_id, 0.15, 'head'),
        (wrap_id, tomato_id, 0.1, 'lbs'),
        (wrap_id, onion_id, 0.05, 'lbs'),
        (wrap_id, pepper_id, 0.1, 'lbs');
    END IF;
    
    
END $$;