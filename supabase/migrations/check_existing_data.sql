-- Check if data exists in tables (run as admin/service role)
-- This bypasses RLS to see all data

-- Check for any existing data
SELECT 'ingredients' as table_name, COUNT(*) as count FROM ingredients
UNION ALL
SELECT 'menu_items', COUNT(*) FROM menu_items
UNION ALL
SELECT 'employees', COUNT(*) FROM employees
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'expenses', COUNT(*) FROM expenses;

-- Check if any data has NULL business_id (unmigrated data)
SELECT 'Data without business_id:' as info;
SELECT 'ingredients without business_id', COUNT(*) FROM ingredients WHERE business_id IS NULL
UNION ALL
SELECT 'menu_items without business_id', COUNT(*) FROM menu_items WHERE business_id IS NULL
UNION ALL
SELECT 'employees without business_id', COUNT(*) FROM employees WHERE business_id IS NULL
UNION ALL
SELECT 'transactions without business_id', COUNT(*) FROM transactions WHERE business_id IS NULL;

-- Check businesses table
SELECT * FROM businesses;

-- Check user_businesses associations
SELECT * FROM user_businesses;