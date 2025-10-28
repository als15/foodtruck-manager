-- Check permissions on auth.users table
SELECT
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'auth' AND table_name = 'users';

-- Check if there are any failing constraints
SELECT
  conname as constraint_name,
  conrelid::regclass as table_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'auth.users'::regclass;
