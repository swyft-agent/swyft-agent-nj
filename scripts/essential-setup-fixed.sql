-- Essential setup script - Run this in Supabase SQL Editor
-- Fixed version without database parameter setting

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
  subscription_plan TEXT DEFAULT 'free',
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'agent', 'manager')),
  is_company_owner BOOLEAN DEFAULT false,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.company_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create permissive RLS policies for signup
CREATE POLICY "Allow authenticated users to view companies" 
ON public.company_accounts FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to insert companies" 
ON public.company_accounts FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow users to update their own company" 
ON public.company_accounts FOR UPDATE 
TO authenticated 
USING (owner_id = auth.uid());

CREATE POLICY "Allow authenticated users to view users" 
ON public.users FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to insert users" 
ON public.users FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow users to update their own profile" 
ON public.users FOR UPDATE 
TO authenticated 
USING (id = auth.uid());

-- Create SECURITY DEFINER function for company creation
CREATE OR REPLACE FUNCTION public.create_company_account(
  p_company_name TEXT,
  p_contact_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_company_size TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_owner_id UUID DEFAULT NULL
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
  -- Insert the new company account
  INSERT INTO public.company_accounts (
    company_name,
    contact_name,
    email,
    phone,
    company_size,
    address,
    description,
    subscription_plan,
    owner_id
  ) VALUES (
    p_company_name,
    p_contact_name,
    p_email,
    p_phone,
    p_company_size,
    p_address,
    p_description,
    'free',
    p_owner_id
  ) RETURNING id INTO new_company_id;

  -- Build JSON result
  SELECT json_build_object(
    'id', ca.id,
    'company_name', ca.company_name,
    'contact_name', ca.contact_name,
    'email', ca.email,
    'phone', ca.phone,
    'company_size', ca.company_size,
    'address', ca.address,
    'description', ca.description,
    'subscription_plan', ca.subscription_plan,
    'owner_id', ca.owner_id,
    'created_at', ca.created_at
  ) INTO result
  FROM public.company_accounts ca
  WHERE ca.id = new_company_id;

  RETURN result;
END;
$$;

-- Create SECURITY DEFINER function for user profile creation
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_user_id UUID,
  p_company_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_phone TEXT,
  p_role TEXT DEFAULT 'admin',
  p_is_owner BOOLEAN DEFAULT true
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Insert the new user profile
  INSERT INTO public.users (
    id,
    company_account_id,
    email,
    full_name,
    phone,
    role,
    is_company_owner
  ) VALUES (
    p_user_id,
    p_company_id,
    p_email,
    p_full_name,
    p_phone,
    p_role,
    p_is_owner
  );

  -- Build JSON result
  SELECT json_build_object(
    'id', u.id,
    'company_account_id', u.company_account_id,
    'email', u.email,
    'full_name', u.full_name,
    'phone', u.phone,
    'role', u.role,
    'is_company_owner', u.is_company_owner,
    'created_at', u.created_at
  ) INTO result
  FROM public.users u
  WHERE u.id = p_user_id;

  RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_company_account TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_company_account TO anon;
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile TO anon;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Success message
SELECT 'Database setup completed successfully!' as status;
