-- Add company_account_id to existing tables if missing
DO $$ 
BEGIN
    -- Add to buildings table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'buildings' AND column_name = 'company_account_id') THEN
        ALTER TABLE buildings ADD COLUMN company_account_id UUID REFERENCES company_accounts(id);
    END IF;

    -- Add to tenants table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tenants' AND column_name = 'company_account_id') THEN
        ALTER TABLE tenants ADD COLUMN company_account_id UUID REFERENCES company_accounts(id);
    END IF;

    -- Add to listings table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'listings' AND column_name = 'company_account_id') THEN
        ALTER TABLE listings ADD COLUMN company_account_id UUID REFERENCES company_accounts(id);
    END IF;

    -- Add to notices table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notices' AND column_name = 'company_account_id') THEN
        ALTER TABLE notices ADD COLUMN company_account_id UUID REFERENCES company_accounts(id);
    END IF;

    -- Add to inquiries table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'inquiries' AND column_name = 'company_account_id') THEN
        ALTER TABLE inquiries ADD COLUMN company_account_id UUID REFERENCES company_accounts(id);
    END IF;

    -- Add to transactions table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'company_account_id') THEN
        ALTER TABLE transactions ADD COLUMN company_account_id UUID REFERENCES company_accounts(id);
    END IF;
END $$;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_buildings_company_account_id ON buildings(company_account_id);
CREATE INDEX IF NOT EXISTS idx_tenants_company_account_id ON tenants(company_account_id);
CREATE INDEX IF NOT EXISTS idx_listings_company_account_id ON listings(company_account_id);
CREATE INDEX IF NOT EXISTS idx_notices_company_account_id ON notices(company_account_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_company_account_id ON inquiries(company_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_company_account_id ON transactions(company_account_id);
