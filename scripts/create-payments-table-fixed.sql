-- Create payments table (fixed version)
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_account_id UUID NOT NULL REFERENCES company_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('rent', 'deposit', 'maintenance', 'utility', 'late_fee', 'other')),
  payment_method TEXT,
  payment_date DATE NOT NULL,
  due_date DATE,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  reference_number TEXT,
  description TEXT,
  late_fee DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payments from their company" ON payments
  FOR SELECT USING (company_account_id = (
    SELECT company_account_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert payments for their company" ON payments
  FOR INSERT WITH CHECK (company_account_id = (
    SELECT company_account_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update payments from their company" ON payments
  FOR UPDATE USING (company_account_id = (
    SELECT company_account_id FROM users WHERE id = auth.uid()
  ));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payments_company_account_id ON payments(company_account_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON payments(payment_type);

-- Create trigger for updated_at
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
