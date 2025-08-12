-- Essential setup script - Run this in Supabase SQL Editor

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

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
  subscription_plan TEXT DEFAULT 'basic',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  company_account_id UUID REFERENCES public.company_accounts(id) ON DELETE CASCADE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'agent' CHECK (role IN ('admin', 'agent', 'manager')),
  is_company_owner BOOLEAN DEFAULT false,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.company_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own company" ON public.company_accounts
  FOR SELECT USING (
    id IN (
      SELECT company_account_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Create SECURITY DEFINER functions for signup
CREATE OR REPLACE FUNCTION create_company_account(
  p_company_name TEXT,
  p_contact_name TEXT,
  p_email TEXT,
  p_phone TEXT,
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
  new_company_id UUID;
  result JSON;
BEGIN
  INSERT INTO public.company_accounts (
    company_name, contact_name, email, phone, 
    company_size, address, description
  ) VALUES (
    p_company_name, p_contact_name, p_email, p_phone,
    p_company_size, p_address, p_description
  ) RETURNING id INTO new_company_id;
  
  SELECT json_build_object(
    'id', new_company_id,
    'company_name', p_company_name,
    'contact_name', p_contact_name,
    'email', p_email,
    'phone', p_phone,
    'company_size', p_company_size,
    'address', p_address,
    'description', p_description,
    'subscription_plan', 'basic'
  ) INTO result;
  
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION create_user_profile(
  p_user_id UUID,
  p_company_account_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_role TEXT DEFAULT 'agent',
  p_is_company_owner BOOLEAN DEFAULT false
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  INSERT INTO public.users (
    id, company_account_id, email, full_name, 
    phone, role, is_company_owner
  ) VALUES (
    p_user_id, p_company_account_id, p_email, p_full_name,
    p_phone, p_role, p_is_company_owner
  );
  
  SELECT json_build_object(
    'id', p_user_id,
    'company_account_id', p_company_account_id,
    'email', p_email,
    'full_name', p_full_name,
    'phone', p_phone,
    'role', p_role,
    'is_company_owner', p_is_company_owner
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_company_account TO authenticated, anon;
GRANT EXECUTE ON FUNCTION create_user_profile TO authenticated, anon;
