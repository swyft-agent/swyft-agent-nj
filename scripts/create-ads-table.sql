-- Create ads table
CREATE TABLE IF NOT EXISTS ads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_account_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    property_id UUID REFERENCES vacant_units(id) ON DELETE CASCADE,
    budget DECIMAL(10,2) DEFAULT 0,
    target_audience TEXT DEFAULT 'all',
    ad_type TEXT DEFAULT 'promotion',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wallet tables
CREATE TABLE IF NOT EXISTS wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_account_id UUID NOT NULL UNIQUE,
    balance DECIMAL(10,2) DEFAULT 0,
    pending_balance DECIMAL(10,2) DEFAULT 0,
    total_received DECIMAL(10,2) DEFAULT 0,
    total_sent DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_account_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'payment_received', 'payment_sent')),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    reference TEXT,
    phone_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics table
CREATE TABLE IF NOT EXISTS unit_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_id UUID REFERENCES vacant_units(id) ON DELETE CASCADE,
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    inquiries INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their company ads" ON ads
    FOR ALL USING (
        company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their company wallet" ON wallets
    FOR ALL USING (
        company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their company wallet transactions" ON wallet_transactions
    FOR ALL USING (
        company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can view their company analytics" ON unit_analytics
    FOR ALL USING (
        unit_id IN (
            SELECT id FROM vacant_units WHERE company_account_id IN (
                SELECT company_account_id FROM users WHERE id = auth.uid()
            )
        )
    );
