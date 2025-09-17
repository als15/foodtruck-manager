-- This script will restore/migrate existing data to a business

DO $$
DECLARE
  v_business_id UUID;
  v_user_id UUID;
BEGIN
  -- Get the first user (or you can specify your user ID)
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'No users found. Please specify a user ID.';
    RETURN;
  END IF;

  -- Check if a default business already exists
  SELECT id INTO v_business_id 
  FROM businesses 
  WHERE settings->>'migrated' = 'true' 
  LIMIT 1;

  -- If not, create one
  IF v_business_id IS NULL THEN
    INSERT INTO businesses (name, settings)
    VALUES ('Restored Business', '{"migrated": true, "restored_date": "' || NOW() || '"}')
    RETURNING id INTO v_business_id;
    
    RAISE NOTICE 'Created new business with ID: %', v_business_id;
  ELSE
    RAISE NOTICE 'Using existing business with ID: %', v_business_id;
  END IF;

  -- Make sure the user is owner of this business
  INSERT INTO user_businesses (user_id, business_id, role)
  VALUES (v_user_id, v_business_id, 'owner')
  ON CONFLICT (user_id, business_id) DO NOTHING;

  -- Migrate all data with NULL business_id to this business
  UPDATE ingredients SET business_id = v_business_id WHERE business_id IS NULL;
  UPDATE menu_items SET business_id = v_business_id WHERE business_id IS NULL;
  UPDATE menu_item_ingredients SET business_id = v_business_id WHERE business_id IS NULL;
  UPDATE categories SET business_id = v_business_id WHERE business_id IS NULL;
  UPDATE employees SET business_id = v_business_id WHERE business_id IS NULL;
  UPDATE shifts SET business_id = v_business_id WHERE business_id IS NULL;
  UPDATE transactions SET business_id = v_business_id WHERE business_id IS NULL;
  UPDATE inventory_items SET business_id = v_business_id WHERE business_id IS NULL;
  UPDATE customers SET business_id = v_business_id WHERE business_id IS NULL;
  UPDATE suppliers SET business_id = v_business_id WHERE business_id IS NULL;
  UPDATE supplier_orders SET business_id = v_business_id WHERE business_id IS NULL;
  UPDATE supplier_order_items SET business_id = v_business_id WHERE business_id IS NULL;
  UPDATE orders SET business_id = v_business_id WHERE business_id IS NULL;
  UPDATE order_items SET business_id = v_business_id WHERE business_id IS NULL;
  UPDATE expenses SET business_id = v_business_id WHERE business_id IS NULL;
  UPDATE expense_categories SET business_id = v_business_id WHERE business_id IS NULL;
  UPDATE financial_goals SET business_id = v_business_id WHERE business_id IS NULL;
  UPDATE financial_projections SET business_id = v_business_id WHERE business_id IS NULL;

  RAISE NOTICE 'Data migration completed for business ID: %', v_business_id;
END $$;