-- Create payments table with minimal dependencies
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_account_id UUID NOT NULL,
  user_id UUID NOT NULL,
  tenant_id UUID,
  building_id UUID,
  unit_id UUID,
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

-- Add foreign key constraints after table creation (safer approach)
DO $$ 
BEGIN
    -- Add foreign key to company_accounts if the table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company_accounts') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                      WHERE table_name = 'payments' AND constraint_name = 'payments_company_account_id_fkey') THEN
            ALTER TABLE payments ADD CONSTRAINT payments_company_account_id_fkey 
            FOREIGN KEY (company_account_id) REFERENCES company_accounts(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Add foreign key to users if the table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                      WHERE table_name = 'payments' AND constraint_name = 'payments_user_id_fkey') THEN
            ALTER TABLE payments ADD CONSTRAINT payments_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Add foreign key to tenants if the table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                      WHERE table_name = 'payments' AND constraint_name = 'payments_tenant_id_fkey') THEN
            ALTER TABLE payments ADD CONSTRAINT payments_tenant_id_fkey 
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Add foreign key to buildings if the table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'buildings') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                      WHERE table_name = 'payments' AND constraint_name = 'payments_building_id_fkey') THEN
            ALTER TABLE payments ADD CONSTRAINT payments_building_id_fkey 
            FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE SET NULL;
        END IF;
    END IF;

    -- Add foreign key to units if the table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'units') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                      WHERE table_name = 'payments' AND constraint_name = 'payments_unit_id_fkey') THEN
            ALTER TABLE payments ADD CONSTRAINT payments_unit_id_fkey 
            FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can view payments from their company') THEN
        CREATE POLICY "Users can view payments from their company" ON payments
          FOR SELECT USING (company_account_id = (
            SELECT company_account_id FROM users WHERE id = auth.uid()
          ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can insert payments for their company') THEN
        CREATE POLICY "Users can insert payments for their company" ON payments
          FOR INSERT WITH CHECK (company_account_id = (
            SELECT company_account_id FROM users WHERE id = auth.uid()
          ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can update payments from their company') THEN
        CREATE POLICY "Users can update payments from their company" ON payments
          FOR UPDATE USING (company_account_id = (
            SELECT company_account_id FROM users WHERE id = auth.uid()
          ));
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payments_company_account_id ON payments(company_account_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON payments(payment_type);
