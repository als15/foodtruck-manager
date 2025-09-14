-- Test data for 3-day operating schedule (Thursday, Friday, Saturday)

-- Ensure we have employees for the 3-day schedule
INSERT INTO employees (first_name, last_name, email, phone, position, hourly_rate, hire_date, is_active) 
VALUES 
  ('Thu-Fri-Sat', 'Worker', 'weekend@foodtruck.com', '555-WKND', 'Food Truck Operator', 22.00, '2024-01-01', true),
  ('Part', 'Timer', 'parttime@foodtruck.com', '555-PART', 'Assistant', 18.00, '2024-01-01', true)
ON CONFLICT (email) DO NOTHING;

-- Create shifts for current week on operating days only
-- Thursday shifts (slower day)
INSERT INTO shifts (employee_id, date, start_time, end_time, hours_worked, role, location)
SELECT 
  e.id,
  CURRENT_DATE - EXTRACT(dow FROM CURRENT_DATE)::integer + 4, -- Thursday of current week
  '11:00',
  '19:00',
  8.0,
  e.position,
  'Main Location'
FROM employees e
WHERE e.email = 'weekend@foodtruck.com';

INSERT INTO shifts (employee_id, date, start_time, end_time, hours_worked, role, location)
SELECT 
  e.id,
  CURRENT_DATE - EXTRACT(dow FROM CURRENT_DATE)::integer + 4, -- Thursday of current week
  '12:00',
  '16:00',
  4.0,
  e.position,
  'Main Location'
FROM employees e
WHERE e.email = 'parttime@foodtruck.com';

-- Friday shifts (better day)
INSERT INTO shifts (employee_id, date, start_time, end_time, hours_worked, role, location)
SELECT 
  e.id,
  CURRENT_DATE - EXTRACT(dow FROM CURRENT_DATE)::integer + 5, -- Friday of current week
  '10:00',
  '20:00',
  10.0,
  e.position,
  'Main Location'
FROM employees e
WHERE e.email = 'weekend@foodtruck.com';

INSERT INTO shifts (employee_id, date, start_time, end_time, hours_worked, role, location)
SELECT 
  e.id,
  CURRENT_DATE - EXTRACT(dow FROM CURRENT_DATE)::integer + 5, -- Friday of current week
  '11:00',
  '19:00',
  8.0,
  e.position,
  'Main Location'
FROM employees e
WHERE e.email = 'parttime@foodtruck.com';

-- Saturday shifts (best day)
INSERT INTO shifts (employee_id, date, start_time, end_time, hours_worked, role, location)
SELECT 
  e.id,
  CURRENT_DATE - EXTRACT(dow FROM CURRENT_DATE)::integer + 6, -- Saturday of current week
  '09:00',
  '21:00',
  12.0,
  e.position,
  'Main Location'
FROM employees e
WHERE e.email = 'weekend@foodtruck.com';

INSERT INTO shifts (employee_id, date, start_time, end_time, hours_worked, role, location)
SELECT 
  e.id,
  CURRENT_DATE - EXTRACT(dow FROM CURRENT_DATE)::integer + 6, -- Saturday of current week
  '10:00',
  '20:00',
  10.0,
  e.position,
  'Main Location'
FROM employees e
WHERE e.email = 'parttime@foodtruck.com';

-- Add some non-operating day shifts (should not count in weekly totals)
-- Monday shift (should be ignored in 3-day calculation)
INSERT INTO shifts (employee_id, date, start_time, end_time, hours_worked, role, location)
SELECT 
  e.id,
  CURRENT_DATE - EXTRACT(dow FROM CURRENT_DATE)::integer + 1, -- Monday of current week
  '09:00',
  '17:00',
  8.0,
  'Special Event',
  'Off-Schedule Location'
FROM employees e
WHERE e.email = 'weekend@foodtruck.com'
LIMIT 1;

-- Query to verify the 3-day schedule
SELECT 
  'Operating Schedule Analysis' as report,
  e.first_name || ' ' || e.last_name as employee,
  s.date,
  CASE EXTRACT(dow FROM s.date)
    WHEN 0 THEN 'Sunday'
    WHEN 1 THEN 'Monday'
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'
  END as day_of_week,
  CASE 
    WHEN EXTRACT(dow FROM s.date) IN (4, 5, 6) THEN 'OPERATING DAY'
    ELSE 'NON-OPERATING'
  END as day_type,
  s.hours_worked,
  s.location
FROM shifts s
JOIN employees e ON s.employee_id = e.id
WHERE e.email IN ('weekend@foodtruck.com', 'parttime@foodtruck.com')
  AND s.date >= CURRENT_DATE - EXTRACT(dow FROM CURRENT_DATE)::integer
  AND s.date <= CURRENT_DATE - EXTRACT(dow FROM CURRENT_DATE)::integer + 6
ORDER BY s.date, e.first_name;

-- Summary of weekly hours by employee (should only count Thu/Fri/Sat)
SELECT 
  'Weekly Hours Summary' as report,
  e.first_name || ' ' || e.last_name as employee,
  COUNT(*) as total_shifts,
  COUNT(*) FILTER (WHERE EXTRACT(dow FROM s.date) IN (4, 5, 6)) as operating_day_shifts,
  SUM(s.hours_worked) as total_hours_all_days,
  SUM(s.hours_worked) FILTER (WHERE EXTRACT(dow FROM s.date) IN (4, 5, 6)) as operating_hours_only
FROM shifts s
JOIN employees e ON s.employee_id = e.id
WHERE e.email IN ('weekend@foodtruck.com', 'parttime@foodtruck.com')
  AND s.date >= CURRENT_DATE - EXTRACT(dow FROM CURRENT_DATE)::integer
  AND s.date <= CURRENT_DATE - EXTRACT(dow FROM CURRENT_DATE)::integer + 6
GROUP BY e.first_name, e.last_name
ORDER BY e.first_name;