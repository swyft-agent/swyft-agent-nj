-- Clean slate setup for new accounts (FIXED)
-- This ensures each new company starts with zero data

-- Drop existing seed data that might interfere
DELETE FROM public.inquiries WHERE user_id = '00000000-0000-0000-0000-000000000000';
DELETE FROM public.notices WHERE user_id = '00000000-0000-0000-0000-000000000000';
DELETE FROM public.tenants WHERE user_id = '00000000-0000-0000-0000-000000000000';
DELETE FROM public.transactions WHERE user_id = '00000000-0000-0000-0000-000000000000';
DELETE FROM public.listings WHERE user_id = '00000000-0000-0000-0000-000000000000';
DELETE FROM public.users WHERE id = '00000000-0000-0000-0000-000000000000';

-- Update the create_user_profile function with correct parameter order
DROP FUNCTION IF EXISTS create_user_profile(UUID, UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN);

CREATE OR REPLACE FUNCTION create_user_profile(
  p_user_id UUID,
  p_company_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_role TEXT DEFAULT 'admin',
  p_is_owner BOOLEAN DEFAULT false
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_profile JSON;
BEGIN
  -- Insert user profile (this will be the only user for this company initially)
  INSERT INTO public.users (
    id,
    company_account_id,
    email,
    full_name,
    phone,
    role,
    is_company_owner,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_company_id,
    p_email,
    p_full_name,
    p_phone,
    p_role,
    p_is_owner,
    NOW(),
    NOW()
  );

  -- Return the created profile as JSON
  SELECT json_build_object(
    'id', p_user_id,
    'company_account_id', p_company_id,
    'email', p_email,
    'full_name', p_full_name,
    'phone', p_phone,
    'role', p_role,
    'is_company_owner', p_is_owner
  ) INTO result_profile;

  RETURN result_profile;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
END;
$$;

-- Update the create_company_account function with correct parameter order
DROP FUNCTION IF EXISTS create_company_account(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID);

CREATE OR REPLACE FUNCTION create_company_account(
  p_company_name TEXT,
  p_contact_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_owner_id UUID,
  p_company_size TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_company JSON;
  company_id UUID;
BEGIN
  -- Generate a new UUID for the company
  company_id := gen_random_uuid();

  -- Insert company account (starts with clean slate - no existing data)
  INSERT INTO public.company_accounts (
    id,
    company_name,
    contact_name,
    email,
    phone,
    company_size,
    address,
    description,
    subscription_plan,
    owner_id,
    created_at,
    updated_at
  ) VALUES (
    company_id,
    p_company_name,
    p_contact_name,
    p_email,
    p_phone,
    p_company_size,
    p_address,
    p_description,
    'free',
    p_owner_id,
    NOW(),
    NOW()
  );

  -- Return the created company as JSON
  SELECT json_build_object(
    'id', company_id,
    'company_name', p_company_name,
    'contact_name', p_contact_name,
    'email', p_email,
    'phone', p_phone,
    'company_size', p_company_size,
    'address', p_address,
    'description', p_description,
    'subscription_plan', 'free',
    'owner_id', p_owner_id
  ) INTO result_company;

  RETURN result_company;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create company account: %', SQLERRM;
END;
$$;

-- Create buildings table if it doesn't exist (for the buildings page)
CREATE TABLE IF NOT EXISTS public.buildings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_account_id UUID REFERENCES public.company_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  building_type TEXT DEFAULT 'apartment',
  total_units INTEGER DEFAULT 0,
  floors INTEGER,
  images TEXT[],
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on buildings table
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage their company buildings" ON public.buildings;

-- Create policy for buildings
CREATE POLICY "Users can manage their company buildings" ON public.buildings
  FOR ALL USING (
    company_account_id IN (
      SELECT company_account_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Grant permissions
GRANT ALL ON public.buildings TO authenticated;
GRANT ALL ON public.buildings TO anon;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_buildings_company_account_id ON public.buildings(company_account_id);
CREATE INDEX IF NOT EXISTS idx_buildings_status ON public.buildings(status);
