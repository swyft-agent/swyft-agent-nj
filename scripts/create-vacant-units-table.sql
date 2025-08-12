-- Create vacant_units table for property listings
CREATE TABLE IF NOT EXISTS public.vacant_units (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_account_id UUID NOT NULL REFERENCES public.company_accounts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    property_type VARCHAR(100) NOT NULL, -- apartment, house, condo, etc.
    bedrooms INTEGER NOT NULL DEFAULT 0,
    bathrooms DECIMAL(2,1) NOT NULL DEFAULT 0,
    square_feet INTEGER,
    rent_amount DECIMAL(10,2) NOT NULL,
    deposit_amount DECIMAL(10,2),
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Property details
    amenities TEXT[], -- Array of amenities
    pet_policy VARCHAR(100), -- allowed, not_allowed, cats_only, dogs_only, etc.
    parking_available BOOLEAN DEFAULT false,
    laundry_type VARCHAR(50), -- in_unit, shared, none
    utilities_included TEXT[], -- Array of included utilities
    
    -- Lease terms
    lease_term_months INTEGER DEFAULT 12,
    available_date DATE,
    
    -- Media
    images TEXT[], -- Array of image URLs
    virtual_tour_url TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'available', -- available, pending, rented, maintenance
    featured BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vacant_units_company ON public.vacant_units(company_account_id);
CREATE INDEX IF NOT EXISTS idx_vacant_units_status ON public.vacant_units(status);
CREATE INDEX IF NOT EXISTS idx_vacant_units_available_date ON public.vacant_units(available_date);
CREATE INDEX IF NOT EXISTS idx_vacant_units_rent_amount ON public.vacant_units(rent_amount);
CREATE INDEX IF NOT EXISTS idx_vacant_units_location ON public.vacant_units(city, state);

-- Enable RLS
ALTER TABLE public.vacant_units ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view vacant units from their company" ON public.vacant_units
    FOR SELECT USING (
        company_account_id IN (
            SELECT company_account_id FROM public.users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert vacant units for their company" ON public.vacant_units
    FOR INSERT WITH CHECK (
        company_account_id IN (
            SELECT company_account_id FROM public.users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update vacant units from their company" ON public.vacant_units
    FOR UPDATE USING (
        company_account_id IN (
            SELECT company_account_id FROM public.users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete vacant units from their company" ON public.vacant_units
    FOR DELETE USING (
        company_account_id IN (
            SELECT company_account_id FROM public.users WHERE user_id = auth.uid()
        )
    );

-- Public access policy for API (allows external sites to read)
CREATE POLICY "Public can view available vacant units" ON public.vacant_units
    FOR SELECT USING (status = 'available');

-- Grant permissions
GRANT SELECT ON public.vacant_units TO authenticated;
GRANT SELECT ON public.vacant_units TO anon; -- For public API access
GRANT ALL ON public.vacant_units TO authenticated;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vacant_units_updated_at 
    BEFORE UPDATE ON public.vacant_units 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data structure (commented out for production)
/*
INSERT INTO public.vacant_units (
    company_account_id, title, description, property_type, bedrooms, bathrooms, 
    square_feet, rent_amount, deposit_amount, address, city, state, zip_code,
    amenities, pet_policy, parking_available, laundry_type, utilities_included,
    lease_term_months, available_date, images, status
) VALUES (
    (SELECT id FROM public.company_accounts LIMIT 1),
    'Modern 2BR Apartment',
    'Beautiful modern apartment with city views',
    'apartment',
    2,
    2.0,
    1200,
    2500.00,
    2500.00,
    '123 Main St',
    'New York',
    'NY',
    '10001',
    ARRAY['gym', 'pool', 'parking', 'laundry'],
    'cats_allowed',
    true,
    'in_unit',
    ARRAY['water', 'heat'],
    12,
    CURRENT_DATE + INTERVAL '30 days',
    ARRAY['/images/apt1.jpg', '/images/apt2.jpg'],
    'available'
);
*/
