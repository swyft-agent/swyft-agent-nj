-- Fix ads and vacant_units relationship
-- This script ensures proper foreign key relationships and indexes

-- First, check if ads table exists and create/update it
DO $$
BEGIN
    -- Create ads table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ads') THEN
        CREATE TABLE ads (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            company_account_id UUID NOT NULL REFERENCES company_accounts(id) ON DELETE CASCADE,
            property_id UUID REFERENCES vacant_units(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            budget DECIMAL(10,2) DEFAULT 0,
            target_audience TEXT,
            ad_type VARCHAR(50) DEFAULT 'listing',
            status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'expired')),
            clicks INTEGER DEFAULT 0,
            impressions INTEGER DEFAULT 0,
            conversions INTEGER DEFAULT 0,
            start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            expires_at TIMESTAMP WITH TIME ZONE,
            created_by UUID REFERENCES auth.users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'property_id') THEN
        ALTER TABLE ads ADD COLUMN property_id UUID REFERENCES vacant_units(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'target_audience') THEN
        ALTER TABLE ads ADD COLUMN target_audience TEXT;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'ad_type') THEN
        ALTER TABLE ads ADD COLUMN ad_type VARCHAR(50) DEFAULT 'listing';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'clicks') THEN
        ALTER TABLE ads ADD COLUMN clicks INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'impressions') THEN
        ALTER TABLE ads ADD COLUMN impressions INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'conversions') THEN
        ALTER TABLE ads ADD COLUMN conversions INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'start_date') THEN
        ALTER TABLE ads ADD COLUMN start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'expires_at') THEN
        ALTER TABLE ads ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ads' AND column_name = 'created_by') THEN
        ALTER TABLE ads ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ads_company_account_id ON ads(company_account_id);
CREATE INDEX IF NOT EXISTS idx_ads_property_id ON ads(property_id);
CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_created_at ON ads(created_at);

-- Enable RLS
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view ads from their company" ON ads;
DROP POLICY IF EXISTS "Users can insert ads for their company" ON ads;
DROP POLICY IF EXISTS "Users can update ads from their company" ON ads;
DROP POLICY IF EXISTS "Users can delete ads from their company" ON ads;

-- Create RLS policies
CREATE POLICY "Users can view ads from their company" ON ads
    FOR SELECT USING (
        company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert ads for their company" ON ads
    FOR INSERT WITH CHECK (
        company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update ads from their company" ON ads
    FOR UPDATE USING (
        company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete ads from their company" ON ads
    FOR DELETE USING (
        company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        )
    );

-- Insert some sample data for testing (optional)
INSERT INTO ads (
    company_account_id,
    property_id,
    title,
    description,
    budget,
    target_audience,
    ad_type,
    status,
    clicks,
    impressions,
    conversions
) 
SELECT 
    ca.id as company_account_id,
    vu.id as property_id,
    'Spacious ' || vu.bedrooms || ' Bedroom Apartment' as title,
    'Beautiful apartment in ' || vu.city || ' with modern amenities' as description,
    15000.00 as budget,
    'Young professionals, families' as target_audience,
    'listing' as ad_type,
    'active' as status,
    FLOOR(RANDOM() * 100) as clicks,
    FLOOR(RANDOM() * 1000) as impressions,
    FLOOR(RANDOM() * 10) as conversions
FROM company_accounts ca
CROSS JOIN vacant_units vu
WHERE ca.id = vu.company_account_id
LIMIT 5
ON CONFLICT DO NOTHING;

-- Verify the relationship
SELECT 
    'ads' as table_name,
    COUNT(*) as record_count
FROM ads
UNION ALL
SELECT 
    'vacant_units' as table_name,
    COUNT(*) as record_count
FROM vacant_units;
