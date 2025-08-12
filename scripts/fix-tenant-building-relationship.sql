-- Fix the relationship between tenants and buildings tables
-- This script ensures proper foreign key relationships and indexes

-- First, let's check if the tables exist and their current structure
DO $$
BEGIN
    -- Add building_id column to tenants if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'building_id'
    ) THEN
        ALTER TABLE tenants ADD COLUMN building_id UUID;
    END IF;

    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tenants_building_id_fkey'
    ) THEN
        ALTER TABLE tenants 
        ADD CONSTRAINT tenants_building_id_fkey 
        FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE SET NULL;
    END IF;

    -- Create index for better query performance
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'tenants' AND indexname = 'idx_tenants_building_id'
    ) THEN
        CREATE INDEX idx_tenants_building_id ON tenants(building_id);
    END IF;

    -- Create index for company_account_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'tenants' AND indexname = 'idx_tenants_company_account_id'
    ) THEN
        CREATE INDEX idx_tenants_company_account_id ON tenants(company_account_id);
    END IF;

    -- Create index for buildings company_account_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'buildings' AND indexname = 'idx_buildings_company_account_id'
    ) THEN
        CREATE INDEX idx_buildings_company_account_id ON buildings(company_account_id);
    END IF;

END $$;

-- Update RLS policies for tenants table
DROP POLICY IF EXISTS "Users can view tenants from their company" ON tenants;
CREATE POLICY "Users can view tenants from their company" ON tenants
    FOR SELECT USING (
        company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert tenants for their company" ON tenants;
CREATE POLICY "Users can insert tenants for their company" ON tenants
    FOR INSERT WITH CHECK (
        company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update tenants from their company" ON tenants;
CREATE POLICY "Users can update tenants from their company" ON tenants
    FOR UPDATE USING (
        company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete tenants from their company" ON tenants;
CREATE POLICY "Users can delete tenants from their company" ON tenants
    FOR DELETE USING (
        company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        )
    );

-- Ensure RLS is enabled
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON tenants TO authenticated;
GRANT SELECT ON buildings TO authenticated;
