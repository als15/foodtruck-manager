-- Test data for the updated shift scheduling functionality

-- First, let's ensure we have some employees to work with
INSERT INTO employees (first_name, last_name, email, phone, position, hourly_rate, hire_date, is_active) 
VALUES 
  ('Alice', 'Rodriguez', 'alice@foodtruck.com', '555-0201', 'Manager', 25.00, '2024-01-01', true),
  ('Bob', 'Wilson', 'bob@foodtruck.com', '555-0202', 'Cook', 19.50, '2024-02-15', true),
  ('Carol', 'Kim', 'carol@foodtruck.com', '555-0203', 'Cashier', 17.00, '2024-03-01', true)
ON CONFLICT (email) DO NOTHING;

-- Test shifts with the new auto-calculated hours and populated roles
-- These shifts should demonstrate the new functionality:
-- 1. Hours calculated automatically from time differences
-- 2. Roles match employee positions
-- 3. Location is consistently set to 'Main Location'

-- Example: 8-hour shift for Manager
INSERT INTO shifts (employee_id, date, start_time, end_time, hours_worked, role, location)
SELECT 
  e.id,
  CURRENT_DATE,
  '09:00',
  '17:00',
  8.0,
  e.position,
  'Main Location'
FROM employees e
WHERE e.email = 'alice@foodtruck.com'
LIMIT 1;

-- Example: 6-hour shift for Cook
INSERT INTO shifts (employee_id, date, start_time, end_time, hours_worked, role, location)
SELECT 
  e.id,
  CURRENT_DATE,
  '11:00',
  '17:00',
  6.0,
  e.position,
  'Main Location'
FROM employees e
WHERE e.email = 'bob@foodtruck.com'
LIMIT 1;

-- Example: 4-hour shift for Cashier
INSERT INTO shifts (employee_id, date, start_time, end_time, hours_worked, role, location)
SELECT 
  e.id,
  CURRENT_DATE,
  '14:00',
  '18:00',
  4.0,
  e.position,
  'Main Location'
FROM employees e
WHERE e.email = 'carol@foodtruck.com'
LIMIT 1;