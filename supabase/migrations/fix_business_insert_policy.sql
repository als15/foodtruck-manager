-- Drop the existing insert policy that's causing issues
DROP POLICY IF EXISTS "Users can insert businesses" ON businesses;

-- Create a new insert policy that allows authenticated users to create businesses
CREATE POLICY "Authenticated users can create businesses" ON businesses
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Also ensure the trigger function exists and works properly
CREATE OR REPLACE FUNCTION add_owner_to_business()
RETURNS TRIGGER AS $$
BEGIN
  -- Add the creating user as the owner of the business
  INSERT INTO user_businesses (user_id, business_id, role)
  VALUES (auth.uid(), NEW.id, 'owner')
  ON CONFLICT (user_id, business_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger (drop first to avoid duplicates)
DROP TRIGGER IF EXISTS add_owner_to_business_trigger ON businesses;
CREATE TRIGGER add_owner_to_business_trigger
  AFTER INSERT ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION add_owner_to_business();