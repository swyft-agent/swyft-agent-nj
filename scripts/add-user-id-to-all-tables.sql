-- Add user_id columns to all tables that need them
-- This script ensures all tables have proper user_id columns for individual users

-- Add user_id to vacant_units if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vacant_units' AND column_name = 'user_id') THEN
        ALTER TABLE vacant_units ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Add user_id to buildings if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'buildings' AND column_name = 'user_id') THEN
        ALTER TABLE buildings ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Add user_id to tenants if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'user_id') THEN
        ALTER TABLE tenants ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Add user_id to inquiries if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inquiries' AND column_name = 'user_id') THEN
        ALTER TABLE inquiries ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Add user_id to notices if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notices' AND column_name = 'user_id') THEN
        ALTER TABLE notices ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Add user_id to ads if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'user_id') THEN
        ALTER TABLE ads ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Add user_id to wallet if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallet' AND column_name = 'user_id') THEN
        ALTER TABLE wallet ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Add user_id to settings if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'user_id') THEN
        ALTER TABLE settings ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Update RLS policies to handle both company_account_id and user_id
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own vacant units" ON vacant_units;
DROP POLICY IF EXISTS "Users can insert their own vacant units" ON vacant_units;
DROP POLICY IF EXISTS "Users can update their own vacant units" ON vacant_units;
DROP POLICY IF EXISTS "Users can delete their own vacant units" ON vacant_units;

-- Create new policies for vacant_units
CREATE POLICY "Users can view their vacant units" ON vacant_units
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (company_account_id IS NOT NULL AND company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        ))
    );

CREATE POLICY "Users can insert vacant units" ON vacant_units
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

-- Similar policies for other tables
-- Buildings
DROP POLICY IF EXISTS "Users can view their buildings" ON buildings;
DROP POLICY IF EXISTS "Users can insert buildings" ON buildings;
DROP POLICY IF EXISTS "Users can update their buildings" ON buildings;
DROP POLICY IF EXISTS "Users can delete their buildings" ON buildings;

CREATE POLICY "Users can view their buildings" ON buildings
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (company_account_id IS NOT NULL AND company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        ))
    );

CREATE POLICY "Users can insert buildings" ON buildings
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        (company_account_id IS NOT NULL AND company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        ))
    );

CREATE POLICY "Users can update their buildings" ON buildings
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        (company_account_id IS NOT NULL AND company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        ))
    );

CREATE POLICY "Users can delete their buildings" ON buildings
    FOR DELETE USING (
        auth.uid() = user_id OR 
        (company_account_id IS NOT NULL AND company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        ))
    );

-- Enable RLS on all tables
ALTER TABLE vacant_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
