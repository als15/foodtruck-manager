-- Check all triggers that might interfere with user creation
SELECT
  trigger_schema,
  trigger_name,
  event_object_table,
  action_statement,
  action_timing,
  event_manipulation,
  action_orientation
FROM information_schema.triggers
WHERE trigger_schema IN ('public', 'auth')
ORDER BY trigger_schema, event_object_table, trigger_name;

-- Check specifically for triggers on businesses table
SELECT
  t.tgname as trigger_name,
  t.tgtype as trigger_type,
  p.proname as function_name,
  pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'businesses'
AND n.nspname = 'public';
