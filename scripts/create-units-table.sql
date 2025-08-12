-- Create units table if it doesn't exist
CREATE TABLE IF NOT EXISTS units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
  company_account_id UUID REFERENCES company_accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  unit_type TEXT,
  bedrooms INTEGER,
  bathrooms DECIMAL(2,1),
  square_feet INTEGER,
  monthly_rent DECIMAL(10,2),
  deposit DECIMAL(10,2),
  status TEXT DEFAULT 'vacant' CHECK (status IN ('vacant', 'occupied', 'maintenance')),
  description TEXT,
  amenities TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view units from their company" ON units
  FOR SELECT USING (company_account_id = (
    SELECT company_account_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert units for their company" ON units
  FOR INSERT WITH CHECK (company_account_id = (
    SELECT company_account_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update units from their company" ON units
  FOR UPDATE USING (company_account_id = (
    SELECT company_account_id FROM users WHERE id = auth.uid()
  ));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_units_building_id ON units(building_id);
CREATE INDEX IF NOT EXISTS idx_units_company_account_id ON units(company_account_id);
CREATE INDEX IF NOT EXISTS idx_units_status ON units(status);
