-- Test data for multiple weeks to verify week navigation functionality

-- Ensure we have test employees
INSERT INTO employees (first_name, last_name, email, phone, position, hourly_rate, hire_date, is_active) 
VALUES 
  ('Week', 'Navigator', 'week.nav@foodtruck.com', '555-WEEK', 'Navigator', 20.00, '2024-01-01', true),
  ('Multi', 'Week', 'multi.week@foodtruck.com', '555-MULTI', 'Tester', 18.50, '2024-01-01', true)
ON CONFLICT (email) DO NOTHING;

-- Create shifts for current week
INSERT INTO shifts (employee_id, date, start_time, end_time, hours_worked, role, location)
SELECT 
  e.id,
  CURRENT_DATE - EXTRACT(dow FROM CURRENT_DATE)::integer + 1, -- Monday of current week
  '09:00',
  '17:00',
  8.0,
  e.position,
  'Main Location'
FROM employees e
WHERE e.email IN ('week.nav@foodtruck.com', 'multi.week@foodtruck.com');

-- Create shifts for last week
INSERT INTO shifts (employee_id, date, start_time, end_time, hours_worked, role, location)
SELECT 
  e.id,
  CURRENT_DATE - EXTRACT(dow FROM CURRENT_DATE)::integer - 6, -- Monday of last week
  '10:00',
  '18:00',
  8.0,
  e.position,
  'Main Location'
FROM employees e
WHERE e.email = 'week.nav@foodtruck.com';

INSERT INTO shifts (employee_id, date, start_time, end_time, hours_worked, role, location)
SELECT 
  e.id,
  CURRENT_DATE - EXTRACT(dow FROM CURRENT_DATE)::integer - 5, -- Tuesday of last week
  '12:00',
  '16:00',
  4.0,
  e.position,
  'Main Location'
FROM employees e
WHERE e.email = 'multi.week@foodtruck.com';

-- Create shifts for next week
INSERT INTO shifts (employee_id, date, start_time, end_time, hours_worked, role, location)
SELECT 
  e.id,
  CURRENT_DATE - EXTRACT(dow FROM CURRENT_DATE)::integer + 8, -- Monday of next week
  '11:00',
  '19:00',
  8.0,
  e.position,
  'Main Location'
FROM employees e
WHERE e.email = 'week.nav@foodtruck.com';

-- Create shifts two weeks ago
INSERT INTO shifts (employee_id, date, start_time, end_time, hours_worked, role, location)
SELECT 
  e.id,
  CURRENT_DATE - EXTRACT(dow FROM CURRENT_DATE)::integer - 13, -- Monday two weeks ago
  '08:00',
  '16:00',
  8.0,
  e.position,
  'Main Location'
FROM employees e
WHERE e.email IN ('week.nav@foodtruck.com', 'multi.week@foodtruck.com');

INSERT INTO shifts (employee_id, date, start_time, end_time, hours_worked, role, location)
SELECT 
  e.id,
  CURRENT_DATE - EXTRACT(dow FROM CURRENT_DATE)::integer - 12, -- Tuesday two weeks ago
  '14:00',
  '18:00',
  4.0,
  e.position,
  'Main Location'
FROM employees e
WHERE e.email = 'multi.week@foodtruck.com';

-- Query to verify the test data across different weeks
SELECT 
  'Week Summary' as info,
  e.first_name || ' ' || e.last_name as employee,
  DATE_TRUNC('week', s.date) as week_start,
  COUNT(*) as shift_count,
  SUM(s.hours_worked) as total_hours,
  MIN(s.date) as first_shift,
  MAX(s.date) as last_shift
FROM shifts s
JOIN employees e ON s.employee_id = e.id
WHERE e.email IN ('week.nav@foodtruck.com', 'multi.week@foodtruck.com')
GROUP BY e.first_name, e.last_name, DATE_TRUNC('week', s.date)
ORDER BY week_start DESC, employee;