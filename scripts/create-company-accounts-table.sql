-- Create company_accounts table first
CREATE TABLE IF NOT EXISTS company_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  description TEXT,
  subscription_plan TEXT DEFAULT 'basic',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE company_accounts ENABLE ROW LEVEL SECURITY;

-- Add company_account_id to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'company_account_id') THEN
        ALTER TABLE users ADD COLUMN company_account_id UUID REFERENCES company_accounts(id);
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_company_accounts_email ON company_accounts(email);
CREATE INDEX IF NOT EXISTS idx_users_company_account_id ON users(company_account_id);

-- Create RLS policies for company_accounts
CREATE POLICY "Users can view their company account" ON company_accounts
  FOR SELECT USING (id = (
    SELECT company_account_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update their company account" ON company_accounts
  FOR UPDATE USING (id = (
    SELECT company_account_id FROM users WHERE id = auth.uid()
  ));
