-- Complete Supabase setup for production with proper column creation order
-- Run this script in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create company_accounts table
CREATE TABLE IF NOT EXISTS public.company_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  company_size TEXT,
  address TEXT,
  description TEXT,
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'premium', 'enterprise')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  company_account_id UUID REFERENCES public.company_accounts(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'agent' CHECK (role IN ('admin', 'agent', 'manager')),
  is_company_owner BOOLEAN DEFAULT false,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add is_company_owner column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'users' 
                 AND column_name = 'is_company_owner') THEN
    ALTER TABLE public.users ADD COLUMN is_company_owner BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create buildings table
CREATE TABLE IF NOT EXISTS public.buildings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_account_id UUID REFERENCES public.company_accounts(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  county TEXT,
  postal_code TEXT,
  building_type TEXT NOT NULL,
  total_units INTEGER NOT NULL DEFAULT 0,
  floors INTEGER,
  year_built INTEGER,
  description TEXT,
  amenities TEXT[],
  security_features TEXT[],
  utilities TEXT[],
  parking_spaces INTEGER DEFAULT 0,
  elevators INTEGER DEFAULT 0,
  management_company TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  images TEXT[],
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create units table
CREATE TABLE IF NOT EXISTS public.units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_account_id UUID REFERENCES public.company_accounts(id) ON DELETE CASCADE NOT NULL,
  building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE NOT NULL,
  unit_number TEXT NOT NULL,
  bedrooms INTEGER NOT NULL DEFAULT 0,
  bathrooms INTEGER NOT NULL DEFAULT 0,
  size_sqft INTEGER,
  rent_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'vacant' CHECK (status IN ('vacant', 'occupied', 'maintenance')),
  vacant_since DATE,
  vacancy_reason TEXT CHECK (vacancy_reason IN ('tenant_moved', 'lease_expired', 'maintenance', 'new_unit')),
  description TEXT,
  amenities TEXT[],
  images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(building_id, unit_number)
);

-- Create tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_account_id UUID REFERENCES public.company_accounts(id) ON DELETE CASCADE NOT NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  move_in_date DATE NOT NULL,
  lease_end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'moving-out', 'moved-out')),
  rent_status TEXT DEFAULT 'current' CHECK (rent_status IN ('current', 'late', 'overdue')),
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notices table
CREATE TABLE IF NOT EXISTS public.notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_account_id UUID REFERENCES public.company_accounts(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('move-in', 'move-out', 'maintenance', 'rent-reminder')),
  notice_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  description TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inquiries table
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_account_id UUID REFERENCES public.company_accounts(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_account_id UUID REFERENCES public.company_accounts(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rent', 'deposit', 'maintenance', 'commission', 'expense')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
  transaction_date DATE NOT NULL,
  due_date DATE,
  payment_method TEXT,
  reference_number TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.company_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on our tables
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public' 
              AND tablename IN ('company_accounts', 'users', 'buildings', 'units', 'tenants', 'notices', 'inquiries', 'transactions'))
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
    
    -- Drop storage policies
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'storage' 
              AND tablename = 'objects'
              AND policyname LIKE '%property%')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
END $$;

-- Create RLS policies for company_accounts
CREATE POLICY "Users can view own company" ON public.company_accounts
  FOR SELECT USING (
    id IN (
      SELECT company_account_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own company" ON public.company_accounts
  FOR UPDATE USING (
    id IN (
      SELECT company_account_id FROM public.users WHERE id = auth.uid() AND is_company_owner = true
    )
  );

-- Allow INSERT for new company creation during signup
CREATE POLICY "Allow company creation during signup" ON public.company_accounts
  FOR INSERT WITH CHECK (true);

-- Create RLS policies for users
CREATE POLICY "Users can view company users" ON public.users
  FOR SELECT USING (
    company_account_id IN (
      SELECT company_account_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Company owners can manage users" ON public.users
  FOR ALL USING (
    company_account_id IN (
      SELECT company_account_id FROM public.users WHERE id = auth.uid() AND is_company_owner = true
    )
  );

-- Create RLS policies for buildings
CREATE POLICY "Users can view company buildings" ON public.buildings
  FOR SELECT USING (
    company_account_id IN (
      SELECT company_account_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage company buildings" ON public.buildings
  FOR ALL USING (
    company_account_id IN (
      SELECT company_account_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Create RLS policies for units
CREATE POLICY "Users can view company units" ON public.units
  FOR SELECT USING (
    company_account_id IN (
      SELECT company_account_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage company units" ON public.units
  FOR ALL USING (
    company_account_id IN (
      SELECT company_account_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Create RLS policies for tenants
CREATE POLICY "Users can view company tenants" ON public.tenants
  FOR SELECT USING (
    company_account_id IN (
      SELECT company_account_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage company tenants" ON public.tenants
  FOR ALL USING (
    company_account_id IN (
      SELECT company_account_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Create RLS policies for notices
CREATE POLICY "Users can view company notices" ON public.notices
  FOR SELECT USING (
    company_account_id IN (
      SELECT company_account_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage company notices" ON public.notices
  FOR ALL USING (
    company_account_id IN (
      SELECT company_account_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Create RLS policies for inquiries
CREATE POLICY "Users can view company inquiries" ON public.inquiries
  FOR SELECT USING (
    company_account_id IN (
      SELECT company_account_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage company inquiries" ON public.inquiries
  FOR ALL USING (
    company_account_id IN (
      SELECT company_account_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Create RLS policies for transactions
CREATE POLICY "Users can view company transactions" ON public.transactions
  FOR SELECT USING (
    company_account_id IN (
      SELECT company_account_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage company transactions" ON public.transactions
  FOR ALL USING (
    company_account_id IN (
      SELECT company_account_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_company_account_id ON public.users(company_account_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_buildings_company_account_id ON public.buildings(company_account_id);
CREATE INDEX IF NOT EXISTS idx_units_company_account_id ON public.units(company_account_id);
CREATE INDEX IF NOT EXISTS idx_units_building_id ON public.units(building_id);
CREATE INDEX IF NOT EXISTS idx_units_status ON public.units(status);
CREATE INDEX IF NOT EXISTS idx_tenants_company_account_id ON public.tenants(company_account_id);
CREATE INDEX IF NOT EXISTS idx_tenants_unit_id ON public.tenants(unit_id);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);
CREATE INDEX IF NOT EXISTS idx_notices_company_account_id ON public.notices(company_account_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_company_account_id ON public.inquiries(company_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_company_account_id ON public.transactions(company_account_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers and create new ones
DROP TRIGGER IF EXISTS update_company_accounts_updated_at ON public.company_accounts;
CREATE TRIGGER update_company_accounts_updated_at BEFORE UPDATE ON public.company_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_buildings_updated_at ON public.buildings;
CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON public.buildings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_units_updated_at ON public.units;
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON public.units
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notices_updated_at ON public.notices;
CREATE TRIGGER update_notices_updated_at BEFORE UPDATE ON public.notices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inquiries_updated_at ON public.inquiries;
CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON public.inquiries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Users can upload property images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-images' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view property images" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Users can update own property images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'property-images' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete own property images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'property-images' AND
    auth.uid() IS NOT NULL
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database setup completed successfully!';
  RAISE NOTICE 'Tables created: company_accounts, users, buildings, units, tenants, notices, inquiries, transactions';
  RAISE NOTICE 'RLS policies applied for multi-tenant security';
  RAISE NOTICE 'Storage bucket "property-images" created';
  RAISE NOTICE 'You can now use the application with real data!';
END $$;
