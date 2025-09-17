-- First, let's check and fix the RLS policies for the businesses table

-- Temporarily disable RLS to fix policies
ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on businesses table
DROP POLICY IF EXISTS "Users can view businesses they belong to" ON businesses;
DROP POLICY IF EXISTS "Users can update their own businesses if admin or owner" ON businesses;
DROP POLICY IF EXISTS "Users can insert businesses" ON businesses;
DROP POLICY IF EXISTS "Authenticated users can create businesses" ON businesses;
DROP POLICY IF EXISTS "Only owners can delete businesses" ON businesses;

-- Re-enable RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Create new, working policies
-- 1. Allow authenticated users to create businesses
CREATE POLICY "Anyone authenticated can create a business" 
ON businesses FOR INSERT 
TO authenticated
WITH CHECK (true);

-- 2. Users can view businesses they belong to
CREATE POLICY "Users can view their businesses" 
ON businesses FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_businesses
    WHERE user_businesses.user_id = auth.uid()
    AND user_businesses.business_id = businesses.id
  )
);

-- 3. Admins and owners can update
CREATE POLICY "Admins and owners can update businesses" 
ON businesses FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_businesses
    WHERE user_businesses.user_id = auth.uid()
    AND user_businesses.business_id = businesses.id
    AND user_businesses.role IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_businesses
    WHERE user_businesses.user_id = auth.uid()
    AND user_businesses.business_id = businesses.id
    AND user_businesses.role IN ('owner', 'admin')
  )
);

-- 4. Only owners can delete
CREATE POLICY "Only owners can delete businesses" 
ON businesses FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_businesses
    WHERE user_businesses.user_id = auth.uid()
    AND user_businesses.business_id = businesses.id
    AND user_businesses.role = 'owner'
  )
);

-- Make sure the trigger function is working
CREATE OR REPLACE FUNCTION add_owner_to_business()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_businesses (user_id, business_id, role, joined_at)
  VALUES (auth.uid(), NEW.id, 'owner', NOW())
  ON CONFLICT (user_id, business_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in add_owner_to_business: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS add_owner_to_business_trigger ON businesses;
CREATE TRIGGER add_owner_to_business_trigger
  AFTER INSERT ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION add_owner_to_business();

-- Also fix the user_businesses policies to ensure they work
DROP POLICY IF EXISTS "Users can view their own business associations" ON user_businesses;
DROP POLICY IF EXISTS "Admins and owners can manage user_businesses" ON user_businesses;

-- Allow users to see their own associations
CREATE POLICY "Users can view their own associations" 
ON user_businesses FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- The trigger will handle inserts, but we need a policy for it
CREATE POLICY "System can create user_businesses" 
ON user_businesses FOR INSERT
TO authenticated
WITH CHECK (true);

-- Admins and owners can manage associations
CREATE POLICY "Admins and owners can manage associations" 
ON user_businesses FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_businesses ub
    WHERE ub.user_id = auth.uid()
    AND ub.business_id = user_businesses.business_id
    AND ub.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins and owners can delete associations" 
ON user_businesses FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_businesses ub
    WHERE ub.user_id = auth.uid()
    AND ub.business_id = user_businesses.business_id
    AND ub.role IN ('owner', 'admin')
  )
);

-- Grant necessary permissions
GRANT ALL ON businesses TO authenticated;
GRANT ALL ON user_businesses TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;