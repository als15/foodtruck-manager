-- Add payment details fields to suppliers table
-- Run this in your Supabase SQL Editor

ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS account_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS bank_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS branch_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS account_number VARCHAR(100);

-- Add a comment to document the purpose of these fields
COMMENT ON COLUMN suppliers.account_name IS 'Name on the bank account for payments';
COMMENT ON COLUMN suppliers.bank_name IS 'Name of the bank';
COMMENT ON COLUMN suppliers.bank_code IS 'Bank identification code';
COMMENT ON COLUMN suppliers.branch_number IS 'Branch number where account is held';
COMMENT ON COLUMN suppliers.account_number IS 'Account number for wire transfers/payments';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'suppliers'
  AND column_name IN ('account_name', 'bank_name', 'bank_code', 'branch_number', 'account_number')
ORDER BY column_name;
