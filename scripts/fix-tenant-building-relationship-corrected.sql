-- Fix the relationship between tenants and buildings tables
-- This script ensures proper foreign key relationships and indexes

-- First, let's check the actual structure of both tables
DO $$
DECLARE
    buildings_pk_column text;
BEGIN
    -- Find the primary key column name for buildings table
    SELECT column_name INTO buildings_pk_column
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'buildings' 
        AND tc.constraint_type = 'PRIMARY KEY'
    LIMIT 1;

    -- If no primary key found, assume it's building_id
    IF buildings_pk_column IS NULL THEN
        buildings_pk_column := 'building_id';
    END IF;

    RAISE NOTICE 'Buildings primary key column: %', buildings_pk_column;

    -- Add building_id column to tenants if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'building_id'
    ) THEN
        ALTER TABLE tenants ADD COLUMN building_id UUID;
        RAISE NOTICE 'Added building_id column to tenants table';
    END IF;

    -- Drop existing foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tenants_building_id_fkey'
    ) THEN
        ALTER TABLE tenants DROP CONSTRAINT tenants_building_id_fkey;
        RAISE NOTICE 'Dropped existing foreign key constraint';
    END IF;

    -- Add foreign key constraint with correct column reference
    EXECUTE format('ALTER TABLE tenants 
        ADD CONSTRAINT tenants_building_id_fkey 
        FOREIGN KEY (building_id) REFERENCES buildings(%I) ON DELETE SET NULL', buildings_pk_column);
    
    RAISE NOTICE 'Added foreign key constraint referencing buildings.%', buildings_pk_column;

    -- Create index for better query performance
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'tenants' AND indexname = 'idx_tenants_building_id'
    ) THEN
        CREATE INDEX idx_tenants_building_id ON tenants(building_id);
        RAISE NOTICE 'Created index on tenants.building_id';
    END IF;

    -- Create index for company_account_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'tenants' AND indexname = 'idx_tenants_company_account_id'
    ) THEN
        CREATE INDEX idx_tenants_company_account_id ON tenants(company_account_id);
        RAISE NOTICE 'Created index on tenants.company_account_id';
    END IF;

    -- Create index for buildings company_account_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'buildings' AND indexname = 'idx_buildings_company_account_id'
    ) THEN
        CREATE INDEX idx_buildings_company_account_id ON buildings(company_account_id);
        RAISE NOTICE 'Created index on buildings.company_account_id';
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

-- Show final table structure
SELECT 
    'tenants' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tenants'
ORDER BY ordinal_position;

SELECT 
    'buildings' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'buildings'
ORDER BY ordinal_position;
