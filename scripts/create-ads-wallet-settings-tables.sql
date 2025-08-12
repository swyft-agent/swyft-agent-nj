-- Create ads table
CREATE TABLE IF NOT EXISTS ads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_account_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    property_id UUID NOT NULL REFERENCES vacant_units(id) ON DELETE CASCADE,
    budget DECIMAL(10,2) DEFAULT 0,
    target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'students', 'professionals', 'families', 'executives')),
    ad_type TEXT DEFAULT 'promotion' CHECK (ad_type IN ('promotion', 'featured', 'urgent')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'expired')),
    clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wallet table
CREATE TABLE IF NOT EXISTS wallet (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_account_id UUID NOT NULL UNIQUE,
    balance DECIMAL(12,2) DEFAULT 0.00,
    pending_balance DECIMAL(12,2) DEFAULT 0.00,
    total_deposits DECIMAL(12,2) DEFAULT 0.00,
    total_withdrawals DECIMAL(12,2) DEFAULT 0.00,
    total_spent_on_ads DECIMAL(12,2) DEFAULT 0.00,
    currency TEXT DEFAULT 'KES',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    company_account_id UUID NOT NULL,
    
    -- Notification settings
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    inquiry_notifications BOOLEAN DEFAULT true,
    payment_notifications BOOLEAN DEFAULT true,
    
    -- Auto-response settings
    auto_respond_inquiries BOOLEAN DEFAULT false,
    auto_response_message TEXT,
    
    -- Display settings
    currency TEXT DEFAULT 'KES',
    timezone TEXT DEFAULT 'Africa/Nairobi',
    language TEXT DEFAULT 'en',
    
    -- Privacy settings
    profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private')),
    show_contact_info BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create click_tracking table
CREATE TABLE IF NOT EXISTS click_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES vacant_units(id) ON DELETE CASCADE,
    company_account_id UUID NOT NULL,
    
    -- Click details
    click_source TEXT, -- 'ad', 'organic', 'social', etc.
    ad_id UUID REFERENCES ads(id) ON DELETE SET NULL,
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    
    -- Location data
    country TEXT,
    city TEXT,
    
    -- Tracking data
    session_id TEXT,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create wallet transactions table for transaction history
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_id UUID NOT NULL REFERENCES wallet(id) ON DELETE CASCADE,
    company_account_id UUID NOT NULL,
    
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'ad_spend', 'refund', 'bonus')),
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'KES',
    
    -- Transaction details
    description TEXT,
    reference_id TEXT UNIQUE,
    external_reference TEXT, -- M-Pesa transaction ID, etc.
    
    -- Status tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    
    -- Related records
    ad_id UUID REFERENCES ads(id) ON DELETE SET NULL,
    
    -- Payment method info
    payment_method TEXT, -- 'mpesa', 'bank', 'card', etc.
    phone_number TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Ads policies
CREATE POLICY "Users can manage their company ads" ON ads
    FOR ALL USING (
        company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        )
    );

-- Wallet policies
CREATE POLICY "Users can manage their company wallet" ON wallet
    FOR ALL USING (
        company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        )
    );

-- Settings policies
CREATE POLICY "Users can manage their own settings" ON settings
    FOR ALL USING (user_id = auth.uid());

-- Click tracking policies (read-only for users, write access for external API)
CREATE POLICY "Users can view their property click tracking" ON click_tracking
    FOR SELECT USING (
        company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        )
    );

-- Allow external API to insert click tracking (this would be handled by API keys in production)
CREATE POLICY "External API can insert click tracking" ON click_tracking
    FOR INSERT WITH CHECK (true);

-- Wallet transactions policies
CREATE POLICY "Users can manage their wallet transactions" ON wallet_transactions
    FOR ALL USING (
        company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ads_company_account_id ON ads(company_account_id);
CREATE INDEX IF NOT EXISTS idx_ads_property_id ON ads(property_id);
CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_expires_at ON ads(expires_at);

CREATE INDEX IF NOT EXISTS idx_wallet_company_account_id ON wallet(company_account_id);

CREATE INDEX IF NOT EXISTS idx_settings_user_id ON settings(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_company_account_id ON settings(company_account_id);

CREATE INDEX IF NOT EXISTS idx_click_tracking_property_id ON click_tracking(property_id);
CREATE INDEX IF NOT EXISTS idx_click_tracking_company_account_id ON click_tracking(company_account_id);
CREATE INDEX IF NOT EXISTS idx_click_tracking_clicked_at ON click_tracking(clicked_at);
CREATE INDEX IF NOT EXISTS idx_click_tracking_ad_id ON click_tracking(ad_id);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_company_account_id ON wallet_transactions(company_account_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON wallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at);

-- Create triggers to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON ads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_updated_at BEFORE UPDATE ON wallet
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_transactions_updated_at BEFORE UPDATE ON wallet_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
