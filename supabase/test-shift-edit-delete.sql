-- Test data to verify shift edit and delete functionality

-- First ensure we have test employees
INSERT INTO employees (first_name, last_name, email, phone, position, hourly_rate, hire_date, is_active) 
VALUES 
  ('Test', 'Employee', 'test@foodtruck.com', '555-TEST', 'Test Position', 20.00, '2024-01-01', true)
ON CONFLICT (email) DO NOTHING;

-- Create test shifts with different scenarios to test editing
INSERT INTO shifts (employee_id, date, start_time, end_time, hours_worked, role, location)
SELECT 
  e.id,
  CURRENT_DATE + INTERVAL '1 day', -- Tomorrow
  '10:00',
  '18:00',
  8.0,
  e.position,
  'Main Location'
FROM employees e
WHERE e.email = 'test@foodtruck.com'
LIMIT 1;

-- Add another shift for the same employee (different time)
INSERT INTO shifts (employee_id, date, start_time, end_time, hours_worked, role, location)
SELECT 
  e.id,
  CURRENT_DATE + INTERVAL '2 days', -- Day after tomorrow
  '12:00',
  '16:00',
  4.0,
  e.position,
  'Main Location'
FROM employees e
WHERE e.email = 'test@foodtruck.com'
LIMIT 1;

-- Query to see all shifts for verification
SELECT 
  s.id,
  e.first_name || ' ' || e.last_name as employee_name,
  s.date,
  s.start_time,
  s.end_time,
  s.hours_worked,
  s.role,
  s.location
FROM shifts s
JOIN employees e ON s.employee_id = e.id
ORDER BY s.date DESC, s.start_time;