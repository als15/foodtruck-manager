-- Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  settings JSONB DEFAULT '{}',
  -- Business details
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  tax_id VARCHAR(50),
  currency VARCHAR(3) DEFAULT 'USD',
  timezone VARCHAR(50) DEFAULT 'UTC',
  -- Subscription/billing info (for future use)
  subscription_tier VARCHAR(50) DEFAULT 'free',
  subscription_status VARCHAR(50) DEFAULT 'active'
);

-- Create user_businesses junction table with roles
CREATE TABLE IF NOT EXISTS user_businesses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  -- Possible roles: owner, admin, member, viewer
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Permissions can be customized per user
  permissions JSONB DEFAULT '{}',
  UNIQUE(user_id, business_id)
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS business_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Function to safely add business_id column to a table
CREATE OR REPLACE FUNCTION add_business_id_to_table(table_name TEXT)
RETURNS VOID AS $$
BEGIN
  -- Check if table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = add_business_id_to_table.table_name
  ) THEN
    -- Check if business_id column already exists
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = add_business_id_to_table.table_name 
      AND column_name = 'business_id'
    ) THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE CASCADE', table_name);
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add business_id to all existing tables
SELECT add_business_id_to_table('ingredients');
SELECT add_business_id_to_table('menu_items');
SELECT add_business_id_to_table('menu_item_ingredients');
SELECT add_business_id_to_table('categories');
SELECT add_business_id_to_table('employees');
SELECT add_business_id_to_table('shifts');
SELECT add_business_id_to_table('transactions');
SELECT add_business_id_to_table('inventory_items');
SELECT add_business_id_to_table('customers');
SELECT add_business_id_to_table('suppliers');
SELECT add_business_id_to_table('supplier_orders');
SELECT add_business_id_to_table('supplier_order_items');
SELECT add_business_id_to_table('orders');
SELECT add_business_id_to_table('order_items');
SELECT add_business_id_to_table('expenses');
SELECT add_business_id_to_table('expense_categories');
SELECT add_business_id_to_table('financial_goals');
SELECT add_business_id_to_table('financial_projections');

-- Create indexes for performance (only if table exists)
CREATE OR REPLACE FUNCTION create_business_id_index(table_name TEXT)
RETURNS VOID AS $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = create_business_id_index.table_name
  ) THEN
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_business_id ON %I(business_id)', table_name, table_name);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_businesses_user_id ON user_businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_businesses_business_id ON user_businesses(business_id);
CREATE INDEX IF NOT EXISTS idx_business_invitations_email ON business_invitations(email);
CREATE INDEX IF NOT EXISTS idx_business_invitations_token ON business_invitations(token);

-- Create indexes for all business_id columns
SELECT create_business_id_index('ingredients');
SELECT create_business_id_index('menu_items');
SELECT create_business_id_index('menu_item_ingredients');
SELECT create_business_id_index('categories');
SELECT create_business_id_index('employees');
SELECT create_business_id_index('shifts');
SELECT create_business_id_index('transactions');
SELECT create_business_id_index('inventory_items');
SELECT create_business_id_index('customers');
SELECT create_business_id_index('suppliers');
SELECT create_business_id_index('supplier_orders');
SELECT create_business_id_index('orders');
SELECT create_business_id_index('expenses');
SELECT create_business_id_index('expense_categories');
SELECT create_business_id_index('financial_goals');
SELECT create_business_id_index('financial_projections');

-- Enable RLS on new tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop existing permissive policies (safely)
DO $$ 
BEGIN
  -- Drop policies only if they exist
  DROP POLICY IF EXISTS "Allow all operations" ON ingredients;
  DROP POLICY IF EXISTS "Allow all operations" ON menu_items;
  DROP POLICY IF EXISTS "Allow all operations" ON menu_item_ingredients;
  DROP POLICY IF EXISTS "Allow all operations" ON categories;
  DROP POLICY IF EXISTS "Allow all operations" ON employees;
  DROP POLICY IF EXISTS "Allow all operations" ON shifts;
  DROP POLICY IF EXISTS "Allow all operations" ON transactions;
  DROP POLICY IF EXISTS "Allow all operations" ON inventory_items;
  DROP POLICY IF EXISTS "Allow all operations" ON customers;
  DROP POLICY IF EXISTS "Allow all operations" ON suppliers;
  DROP POLICY IF EXISTS "Allow all operations" ON supplier_orders;
  DROP POLICY IF EXISTS "Allow all operations" ON supplier_order_items;
  DROP POLICY IF EXISTS "Allow all operations" ON orders;
  DROP POLICY IF EXISTS "Allow all operations" ON order_items;
  DROP POLICY IF EXISTS "Allow all operations" ON expenses;
  DROP POLICY IF EXISTS "Allow all operations" ON expense_categories;
  DROP POLICY IF EXISTS "Allow all operations" ON financial_goals;
  DROP POLICY IF EXISTS "Allow all operations" ON financial_projections;
EXCEPTION
  WHEN undefined_table THEN
    NULL; -- Ignore if table doesn't exist
END $$;

-- Create function to check if user has access to business
CREATE OR REPLACE FUNCTION user_has_business_access(business_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_businesses
    WHERE user_businesses.user_id = auth.uid()
    AND user_businesses.business_id = user_has_business_access.business_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's role in business
CREATE OR REPLACE FUNCTION get_user_business_role(business_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM user_businesses
    WHERE user_businesses.user_id = auth.uid()
    AND user_businesses.business_id = get_user_business_role.business_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for businesses table
CREATE POLICY "Users can view businesses they belong to" ON businesses
  FOR SELECT USING (user_has_business_access(id));

CREATE POLICY "Users can update their own businesses if admin or owner" ON businesses
  FOR UPDATE USING (
    user_has_business_access(id) AND 
    get_user_business_role(id) IN ('owner', 'admin')
  );

CREATE POLICY "Users can insert businesses" ON businesses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Only owners can delete businesses" ON businesses
  FOR DELETE USING (
    user_has_business_access(id) AND 
    get_user_business_role(id) = 'owner'
  );

-- RLS Policies for user_businesses table
CREATE POLICY "Users can view their own business associations" ON user_businesses
  FOR SELECT USING (user_id = auth.uid() OR user_has_business_access(business_id));

CREATE POLICY "Admins and owners can manage user_businesses" ON user_businesses
  FOR ALL USING (
    user_has_business_access(business_id) AND 
    get_user_business_role(business_id) IN ('owner', 'admin')
  );

-- RLS Policies for business_invitations
CREATE POLICY "Users can view invitations for their email or businesses they admin" ON business_invitations
  FOR SELECT USING (
    email = auth.jwt() ->> 'email' OR
    (user_has_business_access(business_id) AND get_user_business_role(business_id) IN ('owner', 'admin'))
  );

CREATE POLICY "Admins and owners can create invitations" ON business_invitations
  FOR INSERT WITH CHECK (
    user_has_business_access(business_id) AND 
    get_user_business_role(business_id) IN ('owner', 'admin') AND
    invited_by = auth.uid()
  );

CREATE POLICY "Admins and owners can delete invitations" ON business_invitations
  FOR DELETE USING (
    user_has_business_access(business_id) AND 
    get_user_business_role(business_id) IN ('owner', 'admin')
  );

-- Function to create RLS policies for a table (only if table exists)
CREATE OR REPLACE FUNCTION create_business_rls_policies(table_name TEXT)
RETURNS VOID AS $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = create_business_rls_policies.table_name
  ) THEN
    -- Enable RLS
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    
    -- Create policies
    EXECUTE format('CREATE POLICY "Users can only see data from their businesses" ON %I FOR SELECT USING (user_has_business_access(business_id))', table_name);
    EXECUTE format('CREATE POLICY "Users can insert data to their businesses" ON %I FOR INSERT WITH CHECK (user_has_business_access(business_id))', table_name);
    EXECUTE format('CREATE POLICY "Users can update data in their businesses" ON %I FOR UPDATE USING (user_has_business_access(business_id))', table_name);
    EXECUTE format('CREATE POLICY "Users can delete data from their businesses" ON %I FOR DELETE USING (user_has_business_access(business_id))', table_name);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Ignore if policies already exist
END;
$$ LANGUAGE plpgsql;

-- Apply RLS policies to all tables
SELECT create_business_rls_policies('ingredients');
SELECT create_business_rls_policies('menu_items');
SELECT create_business_rls_policies('menu_item_ingredients');
SELECT create_business_rls_policies('categories');
SELECT create_business_rls_policies('employees');
SELECT create_business_rls_policies('shifts');
SELECT create_business_rls_policies('transactions');
SELECT create_business_rls_policies('inventory_items');
SELECT create_business_rls_policies('customers');
SELECT create_business_rls_policies('suppliers');
SELECT create_business_rls_policies('supplier_orders');
SELECT create_business_rls_policies('supplier_order_items');
SELECT create_business_rls_policies('orders');
SELECT create_business_rls_policies('order_items');
SELECT create_business_rls_policies('expenses');
SELECT create_business_rls_policies('expense_categories');
SELECT create_business_rls_policies('financial_goals');
SELECT create_business_rls_policies('financial_projections');

-- Create trigger to automatically add user to business when they create it
CREATE OR REPLACE FUNCTION add_owner_to_business()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_businesses (user_id, business_id, role)
  VALUES (auth.uid(), NEW.id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS add_owner_to_business_trigger ON businesses;
CREATE TRIGGER add_owner_to_business_trigger
  AFTER INSERT ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION add_owner_to_business();

-- Create function to handle invitation acceptance
CREATE OR REPLACE FUNCTION accept_business_invitation(invitation_token VARCHAR)
RETURNS UUID AS $$
DECLARE
  invitation_record RECORD;
  new_user_business_id UUID;
BEGIN
  -- Find valid invitation
  SELECT * INTO invitation_record
  FROM business_invitations
  WHERE token = invitation_token
    AND expires_at > NOW()
    AND accepted_at IS NULL
    AND email = auth.jwt() ->> 'email';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;

  -- Add user to business
  INSERT INTO user_businesses (user_id, business_id, role)
  VALUES (auth.uid(), invitation_record.business_id, invitation_record.role)
  RETURNING id INTO new_user_business_id;

  -- Mark invitation as accepted
  UPDATE business_invitations
  SET accepted_at = NOW()
  WHERE id = invitation_record.id;

  RETURN invitation_record.business_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to migrate existing data to a default business (run once)
CREATE OR REPLACE FUNCTION migrate_existing_data_to_business()
RETURNS VOID AS $$
DECLARE
  default_business_id UUID;
  existing_user_id UUID;
BEGIN
  -- Get the first user as the owner (or you can specify a specific user)
  SELECT id INTO existing_user_id FROM auth.users LIMIT 1;
  
  IF existing_user_id IS NOT NULL THEN
    -- Create a default business
    INSERT INTO businesses (name, settings)
    VALUES ('Default Business', '{"migrated": true}')
    RETURNING id INTO default_business_id;

    -- Update all existing data to belong to this business (only if table exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ingredients') THEN
      UPDATE ingredients SET business_id = default_business_id WHERE business_id IS NULL;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'menu_items') THEN
      UPDATE menu_items SET business_id = default_business_id WHERE business_id IS NULL;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'menu_item_ingredients') THEN
      UPDATE menu_item_ingredients SET business_id = default_business_id WHERE business_id IS NULL;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
      UPDATE categories SET business_id = default_business_id WHERE business_id IS NULL;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
      UPDATE employees SET business_id = default_business_id WHERE business_id IS NULL;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shifts') THEN
      UPDATE shifts SET business_id = default_business_id WHERE business_id IS NULL;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
      UPDATE transactions SET business_id = default_business_id WHERE business_id IS NULL;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_items') THEN
      UPDATE inventory_items SET business_id = default_business_id WHERE business_id IS NULL;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
      UPDATE customers SET business_id = default_business_id WHERE business_id IS NULL;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'suppliers') THEN
      UPDATE suppliers SET business_id = default_business_id WHERE business_id IS NULL;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'supplier_orders') THEN
      UPDATE supplier_orders SET business_id = default_business_id WHERE business_id IS NULL;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'supplier_order_items') THEN
      UPDATE supplier_order_items SET business_id = default_business_id WHERE business_id IS NULL;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
      UPDATE orders SET business_id = default_business_id WHERE business_id IS NULL;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
      UPDATE order_items SET business_id = default_business_id WHERE business_id IS NULL;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') THEN
      UPDATE expenses SET business_id = default_business_id WHERE business_id IS NULL;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expense_categories') THEN
      UPDATE expense_categories SET business_id = default_business_id WHERE business_id IS NULL;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'financial_goals') THEN
      UPDATE financial_goals SET business_id = default_business_id WHERE business_id IS NULL;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'financial_projections') THEN
      UPDATE financial_projections SET business_id = default_business_id WHERE business_id IS NULL;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Uncomment to run migration (should be run manually after reviewing)
-- SELECT migrate_existing_data_to_business();