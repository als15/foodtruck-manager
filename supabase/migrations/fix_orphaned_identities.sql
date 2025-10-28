-- Fix orphaned identities by manually creating auth.users records
-- This is a temporary fix - you need to find the root cause

-- IMPORTANT: Only run this if you're absolutely sure these are legitimate signups
-- and you've backed up your database

-- Step 1: Check what we're about to fix
SELECT
  i.user_id,
  i.email,
  i.provider,
  i.created_at,
  'Will create user record' as action
FROM auth.identities i
LEFT JOIN auth.users u ON i.user_id = u.id
WHERE u.id IS NULL;

-- Step 2: Create missing user records
-- This will manually create users from orphaned identities
-- Run this ONLY after you've identified and fixed the root cause

DO $$
DECLARE
  identity_record RECORD;
  instance_uuid UUID;
BEGIN
  -- Get the instance_id from an existing user, or use default
  SELECT COALESCE(
    (SELECT instance_id FROM auth.users LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::UUID
  ) INTO instance_uuid;

  -- Loop through orphaned identities and create users
  FOR identity_record IN
    SELECT
      i.user_id,
      i.email,
      i.created_at,
      i.last_sign_in_at,
      i.provider_id
    FROM auth.identities i
    LEFT JOIN auth.users u ON i.user_id = u.id
    WHERE u.id IS NULL
  LOOP
    -- Insert user record
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role,
      email_confirmed_at,
      confirmation_sent_at,
      created_at,
      updated_at,
      confirmed_at
    ) VALUES (
      identity_record.user_id,
      instance_uuid,
      identity_record.email,
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      'authenticated',
      'authenticated',
      NOW(),
      identity_record.created_at,
      identity_record.created_at,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Created user for email: %', identity_record.email;
  END LOOP;
END $$;
