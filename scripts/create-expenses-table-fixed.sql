-- Create expenses table (fixed version)
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_account_id UUID NOT NULL REFERENCES company_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL,
  vendor TEXT,
  receipt_url TEXT,
  payment_method TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view expenses from their company" ON expenses
  FOR SELECT USING (company_account_id = (
    SELECT company_account_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert expenses for their company" ON expenses
  FOR INSERT WITH CHECK (company_account_id = (
    SELECT company_account_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update expenses from their company" ON expenses
  FOR UPDATE USING (company_account_id = (
    SELECT company_account_id FROM users WHERE id = auth.uid()
  ));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_expenses_company_account_id ON expenses(company_account_id);
CREATE INDEX IF NOT EXISTS idx_expenses_building_id ON expenses(building_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);

-- Create trigger for updated_at
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
