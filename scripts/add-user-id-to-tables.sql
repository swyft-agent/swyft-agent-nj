-- Add user_id columns to tables that need individual user access
ALTER TABLE vacant_units ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE notices ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE ads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE wallet ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update existing data to set user_id for records that don't have it
-- This will need to be done manually based on your data

-- Update RLS policies to support both company-based and user-based access

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their company's vacant units" ON vacant_units;
DROP POLICY IF EXISTS "Users can insert vacant units for their company" ON vacant_units;
DROP POLICY IF EXISTS "Users can update their company's vacant units" ON vacant_units;
DROP POLICY IF EXISTS "Users can delete their company's vacant units" ON vacant_units;

-- Create new policies for vacant_units
CREATE POLICY "Users can view their vacant units" ON vacant_units
    FOR SELECT USING (
        user_id = auth.uid() OR 
        (company_account_id IS NOT NULL AND company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        ))
    );

CREATE POLICY "Users can insert their vacant units" ON vacant_units
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR 
        (company_account_id IS NOT NULL AND company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        ))
    );

CREATE POLICY "Users can update their vacant units" ON vacant_units
    FOR UPDATE USING (
        user_id = auth.uid() OR 
        (company_account_id IS NOT NULL AND company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        ))
    );

CREATE POLICY "Users can delete their vacant units" ON vacant_units
    FOR DELETE USING (
        user_id = auth.uid() OR 
        (company_account_id IS NOT NULL AND company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        ))
    );

-- Similar policies for other tables
-- Buildings
DROP POLICY IF EXISTS "Users can view their company's buildings" ON buildings;
DROP POLICY IF EXISTS "Users can insert buildings for their company" ON buildings;
DROP POLICY IF EXISTS "Users can update their company's buildings" ON buildings;
DROP POLICY IF EXISTS "Users can delete their company's buildings" ON buildings;

CREATE POLICY "Users can view their buildings" ON buildings
    FOR SELECT USING (
        user_id = auth.uid() OR 
        (company_account_id IS NOT NULL AND company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        ))
    );

CREATE POLICY "Users can insert their buildings" ON buildings
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR 
        (company_account_id IS NOT NULL AND company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        ))
    );

CREATE POLICY "Users can update their buildings" ON buildings
    FOR UPDATE USING (
        user_id = auth.uid() OR 
        (company_account_id IS NOT NULL AND company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        ))
    );

CREATE POLICY "Users can delete their buildings" ON buildings
    FOR DELETE USING (
        user_id = auth.uid() OR 
        (company_account_id IS NOT NULL AND company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        ))
    );

-- Wallet policies
DROP POLICY IF EXISTS "Users can view their company's wallet" ON wallet;
DROP POLICY IF EXISTS "Users can update their company's wallet" ON wallet;

CREATE POLICY "Users can view their wallet" ON wallet
    FOR SELECT USING (
        user_id = auth.uid() OR 
        (company_account_id IS NOT NULL AND company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        ))
    );

CREATE POLICY "Users can update their wallet" ON wallet
    FOR ALL USING (
        user_id = auth.uid() OR 
        (company_account_id IS NOT NULL AND company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        ))
    );

-- Transactions policies
DROP POLICY IF EXISTS "Users can view their company's transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert transactions for their company" ON transactions;

CREATE POLICY "Users can view their transactions" ON transactions
    FOR SELECT USING (
        user_id = auth.uid() OR 
        (company_account_id IS NOT NULL AND company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        ))
    );

CREATE POLICY "Users can insert their transactions" ON transactions
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR 
        (company_account_id IS NOT NULL AND company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        ))
    );
