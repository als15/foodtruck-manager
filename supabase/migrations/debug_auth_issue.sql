-- Debug why users are not being created in auth.users
-- Run this in Supabase SQL Editor to check for issues

-- 1. Check if there are any triggers on auth schema
SELECT
  trigger_name,
  event_object_table,
  action_statement,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
ORDER BY event_object_table, trigger_name;

-- 2. Check for any policies on auth.users (there shouldn't be any)
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'auth' AND tablename = 'users';

-- 3. List users in auth.users vs auth.identities
SELECT
  'auth.users' as source,
  COUNT(*) as count
FROM auth.users
UNION ALL
SELECT
  'auth.identities' as source,
  COUNT(*) as count
FROM auth.identities;

-- 5. Check for orphaned identities (identities without users)
SELECT
  i.id,
  i.provider,
  i.email,
  i.created_at,
  i.last_sign_in_at,
  i.user_id,
  CASE WHEN u.id IS NULL THEN 'MISSING USER' ELSE 'HAS USER' END as status
FROM auth.identities i
LEFT JOIN auth.users u ON i.user_id = u.id
ORDER BY i.created_at DESC
LIMIT 20;

-- 6. Try to find what's in auth.users
SELECT
  id,
  email,
  email_confirmed_at,
  created_at,
  confirmation_sent_at,
  confirmed_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 20;

-- 7. Check if there's a mismatch in user_id references
SELECT
  i.user_id as identity_user_id,
  i.email as identity_email,
  u.id as user_id,
  u.email as user_email
FROM auth.identities i
LEFT JOIN auth.users u ON i.user_id = u.id
WHERE u.id IS NULL
LIMIT 10;
