-- Test shifts for the current week to verify payroll calculations

-- First ensure we have test employees
INSERT INTO employees (first_name, last_name, email, phone, position, hourly_rate, hire_date, is_active) 
VALUES 
  ('Current', 'Week', 'current.week@foodtruck.com', '555-WEEK', 'Tester', 25.00, '2024-01-01', true)
ON CONFLICT (email) DO NOTHING;

-- Get the current week's dates
-- Sunday (start of week)
WITH week_dates AS (
  SELECT 
    CURRENT_DATE - EXTRACT(dow FROM CURRENT_DATE)::integer AS week_start,
    CURRENT_DATE - EXTRACT(dow FROM CURRENT_DATE)::integer + 6 AS week_end
)
-- Insert shifts for current week
INSERT INTO shifts (employee_id, date, start_time, end_time, hours_worked, role, location)
SELECT 
  e.id,
  wd.week_start + 1, -- Monday
  '09:00',
  '17:00',
  8.0,
  e.position,
  'Main Location'
FROM employees e, week_dates wd
WHERE e.email = 'current.week@foodtruck.com'
LIMIT 1;

-- Add Tuesday shift
INSERT INTO shifts (employee_id, date, start_time, end_time, hours_worked, role, location)
SELECT 
  e.id,
  wd.week_start + 2, -- Tuesday
  '10:00',
  '18:00',
  8.0,
  e.position,
  'Main Location'
FROM employees e, week_dates wd
WHERE e.email = 'current.week@foodtruck.com'
LIMIT 1;

-- Add partial day Wednesday
INSERT INTO shifts (employee_id, date, start_time, end_time, hours_worked, role, location)
SELECT 
  e.id,
  wd.week_start + 3, -- Wednesday
  '12:00',
  '16:00',
  4.0,
  e.position,
  'Main Location'
FROM employees e, week_dates wd
WHERE e.email = 'current.week@foodtruck.com'
LIMIT 1;

-- Add today's shift if it's not Sunday
INSERT INTO shifts (employee_id, date, start_time, end_time, hours_worked, role, location)
SELECT 
  e.id,
  CURRENT_DATE,
  '11:00',
  '15:00',
  4.0,
  e.position,
  'Main Location'
FROM employees e
WHERE e.email = 'current.week@foodtruck.com'
  AND EXTRACT(dow FROM CURRENT_DATE) != 0 -- Not Sunday
LIMIT 1;

-- Verify the shifts
SELECT 
  'Current week shifts' as info,
  e.first_name || ' ' || e.last_name as employee,
  s.date,
  EXTRACT(dow FROM s.date) as day_of_week,
  s.start_time,
  s.end_time,
  s.hours_worked,
  CASE 
    WHEN s.date >= CURRENT_DATE - EXTRACT(dow FROM CURRENT_DATE)::integer
     AND s.date <= CURRENT_DATE - EXTRACT(dow FROM CURRENT_DATE)::integer + 6
    THEN 'YES' 
    ELSE 'NO' 
  END as is_current_week
FROM shifts s
JOIN employees e ON s.employee_id = e.id
WHERE e.email = 'current.week@foodtruck.com'
ORDER BY s.date;