-- Create inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_account_id UUID NOT NULL REFERENCES company_accounts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'in-progress', 'resolved', 'archived')),
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    property_interest VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inquiries_company_account_id ON inquiries(company_account_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_priority ON inquiries(priority);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);

-- Enable RLS
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view inquiries from their company" ON inquiries
    FOR SELECT USING (
        company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert inquiries for their company" ON inquiries
    FOR INSERT WITH CHECK (
        company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update inquiries from their company" ON inquiries
    FOR UPDATE USING (
        company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete inquiries from their company" ON inquiries
    FOR DELETE USING (
        company_account_id IN (
            SELECT company_account_id FROM users WHERE id = auth.uid()
        )
    );

-- Insert sample data
INSERT INTO inquiries (company_account_id, name, email, phone, subject, message, status, priority, property_interest, created_at) VALUES
    (
        (SELECT id FROM company_accounts LIMIT 1),
        'John Smith',
        'john.smith@email.com',
        '+254712345678',
        'Inquiry about 2BR apartment',
        'Hi, I am interested in renting a 2-bedroom apartment in Westlands. Could you please provide more details about availability and pricing?',
        'new',
        'high',
        '2BR Apartment in Westlands',
        NOW() - INTERVAL '2 hours'
    ),
    (
        (SELECT id FROM company_accounts LIMIT 1),
        'Mary Johnson',
        'mary.johnson@email.com',
        '+254723456789',
        'Property viewing request',
        'I would like to schedule a viewing for the 3-bedroom house in Karen. When would be a good time?',
        'in-progress',
        'medium',
        '3BR House in Karen',
        NOW() - INTERVAL '1 day'
    ),
    (
        (SELECT id FROM company_accounts LIMIT 1),
        'David Wilson',
        'david.wilson@email.com',
        NULL,
        'Commercial space inquiry',
        'Looking for office space in the CBD area. What options do you have available?',
        'new',
        'medium',
        'Office Space in CBD',
        NOW() - INTERVAL '3 hours'
    ),
    (
        (SELECT id FROM company_accounts LIMIT 1),
        'Sarah Brown',
        'sarah.brown@email.com',
        '+254734567890',
        'Maintenance request',
        'The air conditioning in my apartment is not working properly. Could someone come and check it?',
        'resolved',
        'high',
        NULL,
        NOW() - INTERVAL '2 days'
    ),
    (
        (SELECT id FROM company_accounts LIMIT 1),
        'Michael Davis',
        'michael.davis@email.com',
        '+254745678901',
        'Lease renewal inquiry',
        'My lease is expiring next month. I would like to discuss renewal options.',
        'in-progress',
        'low',
        NULL,
        NOW() - INTERVAL '5 hours'
    );
