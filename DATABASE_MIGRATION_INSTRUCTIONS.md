# Database Migration Instructions

## Issue
The application expects a `delivery_methods` column in the `suppliers` table, but this column doesn't exist in your current database schema. This is causing the error:

```
"Could not find the 'delivery_methods' column of 'suppliers' in the schema cache"
```

## Solution
You need to run a database migration to add the `delivery_methods` column to your suppliers table.

## Steps to Fix

### Option 1: Using Supabase Dashboard (Recommended)

1. **Login to your Supabase Dashboard**
   - Go to [https://supabase.com](https://supabase.com)
   - Login to your account
   - Select your foodtruck-manager project

2. **Open the SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Migration Script**
   - Copy the entire contents of `add-delivery-methods-migration.sql` 
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

The migration will:

1. ✅ Add `delivery_methods` column as TEXT array to suppliers table
2. ✅ Set default values for existing suppliers (both pickup and delivery)
3. ✅ Add validation constraints to ensure only valid delivery methods
4. ✅ Create database index for performance
5. ✅ Verify the migration completed successfully

## After Running the Migration

Once you've successfully run the migration:

1. **Refresh your application** - The supplier editing should now work properly
2. **Test the functionality** - Try editing a supplier to confirm the delivery methods field works
3. **Verify data integrity** - All existing suppliers should now have default delivery methods

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