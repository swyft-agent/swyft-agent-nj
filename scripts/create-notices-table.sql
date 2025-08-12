-- Create notices table
CREATE TABLE IF NOT EXISTS notices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_account_id UUID NOT NULL REFERENCES company_accounts(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general' CHECK (type IN ('general', 'maintenance', 'emergency', 'event')),
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    target_audience VARCHAR(50) DEFAULT 'all' CHECK (target_audience IN ('all', 'tenants', 'owners', 'staff')),
    building_id UUID REFERENCES buildings(building_id) ON DELETE SET NULL,
    building_name VARCHAR(255),
    published_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notices_company_account_id ON notices(company_account_id);
CREATE INDEX IF NOT EXISTS idx_notices_type ON notices(type);
CREATE INDEX IF NOT EXISTS idx_notices_status ON notices(status);
CREATE INDEX IF NOT EXISTS idx_notices_priority ON notices(priority);
CREATE INDEX IF NOT EXISTS idx_notices_created_at ON notices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notices_published_at ON notices(published_at DESC);

-- Enable RLS
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view notices from their company" ON notices
    FOR SELECT USING (
        company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert notices for their company" ON notices
    FOR INSERT WITH CHECK (
        company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update notices from their company" ON notices
    FOR UPDATE USING (
        company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete notices from their company" ON notices
    FOR DELETE USING (
        company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        )
    );

-- Insert sample data
INSERT INTO notices (company_account_id, title, content, type, priority, status, target_audience, published_at, created_at) VALUES
    (
        (SELECT id FROM company_accounts LIMIT 1),
        'Building Maintenance Schedule',
        'Dear residents, we will be conducting routine maintenance on the elevators this weekend from 9 AM to 5 PM. Please use the stairs during this time. We apologize for any inconvenience.',
        'maintenance',
        'high',
        'published',
        'tenants',
        NOW() - INTERVAL '1 day',
        NOW() - INTERVAL '2 days'
    ),
    (
        (SELECT id FROM company_accounts LIMIT 1),
        'Community BBQ Event',
        'Join us for our monthly community BBQ this Saturday at 6 PM in the courtyard. Food and drinks will be provided. Please RSVP by Thursday.',
        'event',
        'medium',
        'published',
        'all',
        NOW() - INTERVAL '3 days',
        NOW() - INTERVAL '5 days'
    ),
    (
        (SELECT id FROM company_accounts LIMIT 1),
        'Water Supply Interruption',
        'Due to emergency repairs, water supply will be interrupted tomorrow from 10 AM to 2 PM. Please store water in advance. Emergency contact: +254700000000',
        'emergency',
        'high',
        'published',
        'tenants',
        NOW() - INTERVAL '6 hours',
        NOW() - INTERVAL '8 hours'
    ),
    (
        (SELECT id FROM company_accounts LIMIT 1),
        'New Parking Regulations',
        'Starting next month, new parking regulations will be in effect. All vehicles must display valid parking permits. Permits can be obtained from the management office.',
        'general',
        'medium',
        'draft',
        'all',
        NULL,
        NOW() - INTERVAL '1 hour'
    ),
    (
        (SELECT id FROM company_accounts LIMIT 1),
        'Holiday Office Hours',
        'Please note that the management office will have reduced hours during the holiday season. We will be open from 9 AM to 3 PM on weekdays only.',
        'general',
        'low',
        'published',
        'all',
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '3 days'
    );
