-- Make category_id nullable in expenses table
-- This allows expenses to be created without requiring a category

ALTER TABLE expenses 
ALTER COLUMN category_id DROP NOT NULL;