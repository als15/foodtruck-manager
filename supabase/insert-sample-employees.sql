-- Insert sample employees for testing the updated integration
INSERT INTO employees (first_name, last_name, email, phone, position, hourly_rate, hire_date, is_active) 
VALUES 
  ('John', 'Smith', 'john.smith@foodtruck.com', '555-0101', 'Head Chef', 22.00, '2024-01-15', true),
  ('Sarah', 'Johnson', 'sarah.johnson@foodtruck.com', '555-0102', 'Server', 16.50, '2024-02-01', true),
  ('Mike', 'Davis', 'mike.davis@foodtruck.com', '555-0103', 'Prep Cook', 18.00, '2024-03-10', true)
ON CONFLICT (email) DO NOTHING;

-- Insert sample shifts for testing
INSERT INTO shifts (employee_id, date, start_time, end_time, hours_worked, role, location)
SELECT 
  e.id,
  CURRENT_DATE - INTERVAL '1 day',
  '10:00',
  '18:00',
  8.0,
  e.position,
  'Downtown Food Market'
FROM employees e
WHERE e.email IN ('john.smith@foodtruck.com', 'sarah.johnson@foodtruck.com');

INSERT INTO shifts (employee_id, date, start_time, end_time, hours_worked, role, location)
SELECT 
  e.id,
  CURRENT_DATE,
  '11:00',
  '19:00',
  8.0,
  e.position,
  'Business District'
FROM employees e
WHERE e.email = 'mike.davis@foodtruck.com';