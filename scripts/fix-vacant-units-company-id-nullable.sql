-- Make company_account_id nullable in vacant_units table for individual users
-- This allows agents and landlords without companies to create vacant units

-- First, drop the existing NOT NULL constraint if it exists
ALTER TABLE vacant_units ALTER COLUMN company_account_id DROP NOT NULL;

-- Update RLS policies to handle both individual and company users
DROP POLICY IF EXISTS "Users can view their own vacant units" ON vacant_units;
DROP POLICY IF EXISTS "Users can insert their own vacant units" ON vacant_units;
DROP POLICY IF EXISTS "Users can update their own vacant units" ON vacant_units;
DROP POLICY IF EXISTS "Users can delete their own vacant units" ON vacant_units;

-- Create new RLS policies that handle both user_id and company_account_id
CREATE POLICY "Users can view their vacant units" ON vacant_units
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (company_account_id IS NOT NULL AND company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        ))
    );

CREATE POLICY "Users can insert their vacant units" ON vacant_units
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        (company_account_id IS NOT NULL AND company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        ))
    );

CREATE POLICY "Users can update their vacant units" ON vacant_units
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        (company_account_id IS NOT NULL AND company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        ))
    );

CREATE POLICY "Users can delete their vacant units" ON vacant_units
    FOR DELETE USING (
        auth.uid() = user_id OR 
        (company_account_id IS NOT NULL AND company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        ))
    );

-- Add check constraint to ensure either user_id or company_account_id is provided
ALTER TABLE vacant_units ADD CONSTRAINT vacant_units_owner_check 
    CHECK (user_id IS NOT NULL OR company_account_id IS NOT NULL);

-- Update other tables to have the same nullable company_account_id pattern
ALTER TABLE buildings ALTER COLUMN company_account_id DROP NOT NULL;
ALTER TABLE tenants ALTER COLUMN company_account_id DROP NOT NULL;
ALTER TABLE inquiries ALTER COLUMN company_account_id DROP NOT NULL;
ALTER TABLE notices ALTER COLUMN company_account_id DROP NOT NULL;
ALTER TABLE ads ALTER COLUMN company_account_id DROP NOT NULL;
ALTER TABLE wallet ALTER COLUMN company_account_id DROP NOT NULL;

-- Add similar check constraints to other tables
ALTER TABLE buildings ADD CONSTRAINT buildings_owner_check 
    CHECK (user_id IS NOT NULL OR company_account_id IS NOT NULL);

ALTER TABLE tenants ADD CONSTRAINT tenants_owner_check 
    CHECK (user_id IS NOT NULL OR company_account_id IS NOT NULL);

ALTER TABLE inquiries ADD CONSTRAINT inquiries_owner_check 
    CHECK (user_id IS NOT NULL OR company_account_id IS NOT NULL);

ALTER TABLE notices ADD CONSTRAINT notices_owner_check 
    CHECK (user_id IS NOT NULL OR company_account_id IS NOT NULL);

ALTER TABLE ads ADD CONSTRAINT ads_owner_check 
    CHECK (user_id IS NOT NULL OR company_account_id IS NOT NULL);

ALTER TABLE wallet ADD CONSTRAINT wallet_owner_check 
    CHECK (user_id IS NOT NULL OR company_account_id IS NOT NULL);
