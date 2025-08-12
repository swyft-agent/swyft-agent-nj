-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS wallet_transactions CASCADE;
DROP TABLE IF EXISTS wallet CASCADE;

-- Create wallet table with user_id foreign key
CREATE TABLE wallet (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_account_id UUID REFERENCES company_accounts(id) ON DELETE CASCADE,
    balance DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
    pending_balance DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
    total_deposits DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
    total_withdrawals DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
    total_spent_on_ads DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
    currency VARCHAR(3) DEFAULT 'KES' NOT NULL,
    status VARCHAR(20) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'suspended', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id)
);

-- Create wallet_transactions table
CREATE TABLE wallet_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_account_id UUID REFERENCES company_accounts(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES wallet(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'ad_spend', 'refund', 'bonus')),
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    reference_id VARCHAR(100),
    external_reference VARCHAR(100),
    payment_method VARCHAR(50),
    phone_number VARCHAR(20),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_wallet_user_id ON wallet(user_id);
CREATE INDEX idx_wallet_company_account_id ON wallet(company_account_id);
CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);
CREATE INDEX idx_wallet_transactions_status ON wallet_transactions(status);

-- Enable RLS
ALTER TABLE wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wallet
CREATE POLICY "Users can view their own wallet" ON wallet
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet" ON wallet
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" ON wallet
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for wallet_transactions
CREATE POLICY "Users can view their own transactions" ON wallet_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON wallet_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON wallet_transactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wallet_updated_at BEFORE UPDATE ON wallet
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_transactions_updated_at BEFORE UPDATE ON wallet_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON wallet TO authenticated;
GRANT ALL ON wallet_transactions TO authenticated;
