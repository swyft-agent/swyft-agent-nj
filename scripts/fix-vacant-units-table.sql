-- Ensure vacant_units table exists with correct structure
CREATE TABLE IF NOT EXISTS vacant_units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_account_id UUID NOT NULL REFERENCES company_accounts(id) ON DELETE CASCADE,
  building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
  unit_number VARCHAR(50),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  bedrooms INTEGER NOT NULL,
  bathrooms DECIMAL(3,1) NOT NULL,
  square_feet INTEGER,
  rent_amount INTEGER NOT NULL,
  security_deposit INTEGER,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  zip_code VARCHAR(20) NOT NULL,
  available_date DATE NOT NULL,
  images TEXT[],
  amenities TEXT[],
  utilities_included TEXT[],
  pet_policy VARCHAR(50),
  parking VARCHAR(50),
  lease_terms TEXT,
  virtual_tour_url TEXT,
  contact_info TEXT,
  status VARCHAR(20) DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE vacant_units ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view vacant units from their company" ON vacant_units;
CREATE POLICY "Users can view vacant units from their company" ON vacant_units
  FOR SELECT USING (company_account_id = (
    SELECT company_account_id FROM users WHERE id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can insert vacant units for their company" ON vacant_units;
CREATE POLICY "Users can insert vacant units for their company" ON vacant_units
  FOR INSERT WITH CHECK (company_account_id = (
    SELECT company_account_id FROM users WHERE id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can update vacant units from their company" ON vacant_units;
CREATE POLICY "Users can update vacant units from their company" ON vacant_units
  FOR UPDATE USING (company_account_id = (
    SELECT company_account_id FROM users WHERE id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can delete vacant units from their company" ON vacant_units;
CREATE POLICY "Users can delete vacant units from their company" ON vacant_units
  FOR DELETE USING (company_account_id = (
    SELECT company_account_id FROM users WHERE id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vacant_units_company ON vacant_units(company_account_id);
CREATE INDEX IF NOT EXISTS idx_vacant_units_status ON vacant_units(status);
CREATE INDEX IF NOT EXISTS idx_vacant_units_available_date ON vacant_units(available_date);
