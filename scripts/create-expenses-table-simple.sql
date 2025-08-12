-- Create expenses table with minimal dependencies
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_account_id UUID NOT NULL,
  user_id UUID NOT NULL,
  building_id UUID,
  unit_id UUID,
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

-- Add foreign key constraints after table creation (safer approach)
DO $$ 
BEGIN
    -- Add foreign key to company_accounts if the table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company_accounts') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                      WHERE table_name = 'expenses' AND constraint_name = 'expenses_company_account_id_fkey') THEN
            ALTER TABLE expenses ADD CONSTRAINT expenses_company_account_id_fkey 
            FOREIGN KEY (company_account_id) REFERENCES company_accounts(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Add foreign key to users if the table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                      WHERE table_name = 'expenses' AND constraint_name = 'expenses_user_id_fkey') THEN
            ALTER TABLE expenses ADD CONSTRAINT expenses_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Add foreign key to buildings if the table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'buildings') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                      WHERE table_name = 'expenses' AND constraint_name = 'expenses_building_id_fkey') THEN
            ALTER TABLE expenses ADD CONSTRAINT expenses_building_id_fkey 
            FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE SET NULL;
        END IF;
    END IF;

    -- Add foreign key to units if the table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'units') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                      WHERE table_name = 'expenses' AND constraint_name = 'expenses_unit_id_fkey') THEN
            ALTER TABLE expenses ADD CONSTRAINT expenses_unit_id_fkey 
            FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users can view expenses from their company') THEN
        CREATE POLICY "Users can view expenses from their company" ON expenses
          FOR SELECT USING (company_account_id = (
            SELECT company_account_id FROM users WHERE id = auth.uid()
          ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users can insert expenses for their company') THEN
        CREATE POLICY "Users can insert expenses for their company" ON expenses
          FOR INSERT WITH CHECK (company_account_id = (
            SELECT company_account_id FROM users WHERE id = auth.uid()
          ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users can update expenses from their company') THEN
        CREATE POLICY "Users can update expenses from their company" ON expenses
          FOR UPDATE USING (company_account_id = (
            SELECT company_account_id FROM users WHERE id = auth.uid()
          ));
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_expenses_company_account_id ON expenses(company_account_id);
CREATE INDEX IF NOT EXISTS idx_expenses_building_id ON expenses(building_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
