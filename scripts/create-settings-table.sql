-- Create settings table for user and system preferences
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_account_id UUID REFERENCES public.company_accounts(id) ON DELETE CASCADE,
    setting_key VARCHAR(255) NOT NULL,
    setting_value JSONB,
    setting_type VARCHAR(50) DEFAULT 'user', -- 'user', 'company', 'system'
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, company_account_id, setting_key)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON public.settings(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_company_account_id ON public.settings(company_account_id);
CREATE INDEX IF NOT EXISTS idx_settings_key ON public.settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_settings_type ON public.settings(setting_type);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for settings
CREATE POLICY "Users can view their own settings" ON public.settings
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (company_account_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.company_account_id = settings.company_account_id
        ))
    );

CREATE POLICY "Users can insert their own settings" ON public.settings
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        (company_account_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.company_account_id = settings.company_account_id
        ))
    );

CREATE POLICY "Users can update their own settings" ON public.settings
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        (company_account_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.company_account_id = settings.company_account_id
        ))
    );

CREATE POLICY "Users can delete their own settings" ON public.settings
    FOR DELETE USING (
        auth.uid() = user_id OR 
        (company_account_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.company_account_id = settings.company_account_id
        ))
    );

-- Insert default settings
INSERT INTO public.settings (setting_key, setting_value, setting_type, description) VALUES
('theme', '"light"', 'system', 'Default theme preference'),
('notifications_enabled', 'true', 'system', 'Enable notifications by default'),
('currency', '"KSh"', 'system', 'Default currency'),
('date_format', '"DD/MM/YYYY"', 'system', 'Default date format'),
('timezone', '"Africa/Nairobi"', 'system', 'Default timezone')
ON CONFLICT (user_id, company_account_id, setting_key) DO NOTHING;
