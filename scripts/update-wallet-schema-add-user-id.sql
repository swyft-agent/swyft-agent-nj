-- Update wallet table schema to ensure proper columns exist
-- This script adds missing columns and ensures proper structure

-- First, check if columns exist and add them if missing
DO $$
BEGIN
    -- Add pending_balance column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wallet' AND column_name = 'pending_balance') THEN
        ALTER TABLE wallet ADD COLUMN pending_balance DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Add total_deposits column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wallet' AND column_name = 'total_deposits') THEN
        ALTER TABLE wallet ADD COLUMN total_deposits DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Add total_withdrawals column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wallet' AND column_name = 'total_withdrawals') THEN
        ALTER TABLE wallet ADD COLUMN total_withdrawals DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Add total_spent_on_ads column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wallet' AND column_name = 'total_spent_on_ads') THEN
        ALTER TABLE wallet ADD COLUMN total_spent_on_ads DECIMAL(10,2) DEFAULT 0;
    END IF;

    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wallet' AND column_name = 'user_id') THEN
        ALTER TABLE wallet ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;

    -- Add company_account_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wallet' AND column_name = 'company_account_id') THEN
        ALTER TABLE wallet ADD COLUMN company_account_id UUID REFERENCES company_accounts(id);
    END IF;
END $$;

-- Remove the problematic 'amount' column if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'wallet' AND column_name = 'amount') THEN
        ALTER TABLE wallet DROP COLUMN amount;
    END IF;
END $$;

-- Update RLS policies for wallet table
DROP POLICY IF EXISTS "Users can view their own wallet" ON wallet;
DROP POLICY IF EXISTS "Users can update their own wallet" ON wallet;
DROP POLICY IF EXISTS "Users can insert their own wallet" ON wallet;

-- Create new RLS policies
CREATE POLICY "Users can view their own wallet" ON wallet
    FOR SELECT USING (
        auth.uid() = user_id OR 
        company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own wallet" ON wallet
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own wallet" ON wallet
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        )
    );

-- Ensure wallet_transactions table has proper structure
DO $$
BEGIN
    -- Create wallet_transactions table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_transactions') THEN
        CREATE TABLE wallet_transactions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            wallet_id UUID REFERENCES wallet(id) ON DELETE CASCADE,
            user_id UUID REFERENCES auth.users(id),
            company_account_id UUID REFERENCES company_accounts(id),
            amount DECIMAL(10,2) NOT NULL,
            transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'ad_spend', 'refund')),
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
            description TEXT,
            reference_id VARCHAR(100),
            payment_method VARCHAR(50),
            ad_id UUID REFERENCES ads(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies for wallet_transactions
        CREATE POLICY "Users can view their own wallet transactions" ON wallet_transactions
            FOR SELECT USING (
                auth.uid() = user_id OR 
                company_account_id IN (
                    SELECT company_account_id FROM users WHERE id = auth.uid()
                )
            );

        CREATE POLICY "Users can insert their own wallet transactions" ON wallet_transactions
            FOR INSERT WITH CHECK (
                auth.uid() = user_id OR 
                company_account_id IN (
                    SELECT company_account_id FROM users WHERE id = auth.uid()
                )
            );

        -- Create indexes for better performance
        CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id);
        CREATE INDEX idx_wallet_transactions_company_id ON wallet_transactions(company_account_id);
        CREATE INDEX idx_wallet_transactions_created_at ON wallet_transactions(created_at);
        CREATE INDEX idx_wallet_transactions_status ON wallet_transactions(status);
    END IF;
END $$;

-- Create or update function to handle wallet balance updates
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update wallet totals when a transaction is completed
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        UPDATE wallet 
        SET 
            total_deposits = CASE 
                WHEN NEW.transaction_type = 'deposit' THEN total_deposits + NEW.amount
                ELSE total_deposits
            END,
            total_withdrawals = CASE 
                WHEN NEW.transaction_type = 'withdrawal' THEN total_withdrawals + NEW.amount
                ELSE total_withdrawals
            END,
            total_spent_on_ads = CASE 
                WHEN NEW.transaction_type = 'ad_spend' THEN total_spent_on_ads + NEW.amount
                ELSE total_spent_on_ads
            END,
            balance = CASE 
                WHEN NEW.transaction_type IN ('deposit', 'refund') THEN balance + NEW.amount
                WHEN NEW.transaction_type IN ('withdrawal', 'ad_spend') THEN balance - NEW.amount
                ELSE balance
            END,
            updated_at = NOW()
        WHERE id = NEW.wallet_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for wallet balance updates
DROP TRIGGER IF EXISTS trigger_update_wallet_balance ON wallet_transactions;
CREATE TRIGGER trigger_update_wallet_balance
    AFTER INSERT OR UPDATE ON wallet_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_balance();

-- Insert some sample wallet transactions for testing (optional)
-- This will only run if the wallet_transactions table is empty
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM wallet_transactions LIMIT 1) THEN
        -- Insert sample transactions only if there are existing wallets
        INSERT INTO wallet_transactions (wallet_id, user_id, amount, transaction_type, status, description, reference_id)
        SELECT 
            w.id,
            w.user_id,
            1000.00,
            'deposit',
            'completed',
            'Initial deposit',
            'DEP-' || EXTRACT(epoch FROM NOW())::text
        FROM wallet w
        WHERE w.user_id IS NOT NULL
        LIMIT 5;
    END IF;
END $$;

COMMIT;
