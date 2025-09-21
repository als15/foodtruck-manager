# Database Migration Instructions

## Current Migrations Needed

### 1. Suppliers Delivery Methods
The application expects a `delivery_methods` column in the `suppliers` table. Run `add-delivery-methods-migration.sql` if you see:
```
"Could not find the 'delivery_methods' column of 'suppliers' in the schema cache"
```

### 2. Menu Categories Management
The application now supports dynamic menu categories stored in the database. Run `create-menu-categories-table.sql` to enable category management features.

### 3. Menu Items Tables
If you see "new row violates row-level security policy for table 'menu_item_ingredients'" or "relation 'menu_item_ingredients' does not exist", run `create-menu-item-ingredients-table.sql` to create the missing tables with proper RLS policies.

## Solutions

## Steps to Fix

### Option 1: Using Supabase Dashboard (Recommended)

1. **Login to your Supabase Dashboard**
   - Go to [https://supabase.com](https://supabase.com)
   - Login to your account
   - Select your foodtruck-manager project

2. **Open the SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Migration Scripts**
   
   **For Suppliers Delivery Methods:**
   - Copy the entire contents of `add-delivery-methods-migration.sql` 
   - Paste it into the SQL editor
   - Click "Run" to execute the migration
   
   **For Menu Categories Management:**
   - Copy the entire contents of `create-menu-categories-table.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute the migration
   
   **For Menu Items Tables:**
   - Copy the entire contents of `create-menu-item-ingredients-table.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute the migration

### Option 2: Using Supabase CLI (Advanced)

If you have the Supabase CLI configured:

```bash
# Make sure you're in the project directory
cd /Users/alsade/Projects/foodtruck-manager

# Run the migration
supabase db push --db-url "your-database-connection-string"
```

## Migration Script Contents

**Suppliers Delivery Methods Migration will:**
1. ✅ Add `delivery_methods` column as TEXT array to suppliers table
2. ✅ Set default values for existing suppliers (both pickup and delivery)
3. ✅ Add validation constraints to ensure only valid delivery methods
4. ✅ Create database index for performance
5. ✅ Verify the migration completed successfully

**Menu Categories Management Migration will:**
1. ✅ Create `menu_categories` table with business_id relationship
2. ✅ Set up proper RLS policies for multi-tenant security
3. ✅ Create indexes for optimal performance
4. ✅ Insert default categories for existing businesses
5. ✅ Enable proper foreign key constraints and cascading

**Menu Items Tables Migration will:**
1. ✅ Create `menu_items` and `menu_item_ingredients` tables with proper structure
2. ✅ Set up Row Level Security (RLS) policies for multi-tenant security
3. ✅ Create performance indexes for foreign keys and queries
4. ✅ Add update triggers for automatic timestamp management
5. ✅ Verify tables and policies are created correctly

## After Running the Migration

Once you've successfully run the migrations:

1. **Refresh your application** - Both supplier editing and menu category management should work properly
2. **Test supplier functionality** - Try editing a supplier to confirm the delivery methods field works
3. **Test category functionality** - Try adding/editing/deleting menu categories through the "Manage Categories" button
4. **Test menu items functionality** - Try creating/editing menu items with ingredients
5. **Verify data integrity** - All existing suppliers should have default delivery methods, and default categories should be available

## Rollback (if needed)

If you need to undo this migration for any reason:

```sql
-- Remove the delivery_methods column
ALTER TABLE suppliers DROP COLUMN IF EXISTS delivery_methods;

-- Remove the index
DROP INDEX IF EXISTS idx_suppliers_delivery_methods;
```

## Verification

After running the migration, you can verify it worked by running:

```sql
-- Check if column exists and has data
SELECT 
    name, 
    delivery_methods,
    array_length(delivery_methods, 1) as method_count
FROM suppliers 
LIMIT 5;
```

You should see all suppliers now have delivery_methods populated with values like `['pickup', 'delivery']`.