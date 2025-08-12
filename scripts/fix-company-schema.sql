-- Fix company_accounts table schema and helper functions

-- First, let's check what columns exist and add missing ones
DO $$
BEGIN
    -- Add owner_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'company_accounts' 
        AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE public.company_accounts ADD COLUMN owner_id UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Added owner_id column to company_accounts';
    END IF;

    -- Add other potentially missing columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'company_accounts' 
        AND column_name = 'contact_name'
    ) THEN
        ALTER TABLE public.company_accounts ADD COLUMN contact_name TEXT;
        RAISE NOTICE 'Added contact_name column to company_accounts';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'company_accounts' 
        AND column_name = 'company_size'
    ) THEN
        ALTER TABLE public.company_accounts ADD COLUMN company_size TEXT;
        RAISE NOTICE 'Added company_size column to company_accounts';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'company_accounts' 
        AND column_name = 'address'
    ) THEN
        ALTER TABLE public.company_accounts ADD COLUMN address TEXT;
        RAISE NOTICE 'Added address column to company_accounts';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'company_accounts' 
        AND column_name = 'subscription_plan'
    ) THEN
        ALTER TABLE public.company_accounts ADD COLUMN subscription_plan TEXT DEFAULT 'free';
        RAISE NOTICE 'Added subscription_plan column to company_accounts';
    END IF;
END $$;

-- Update the create_company_account function to use correct column names
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
RETURNS TABLE(
  id UUID,
  company_name TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  company_size TEXT,
  address TEXT,
  description TEXT,
  owner_id UUID,
  subscription_plan TEXT,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  new_company_id UUID;
BEGIN
  -- Insert the company account
  INSERT INTO public.company_accounts (
    company_name,
    contact_name,
    email,
    phone,
    company_size,
    address,
    description,
    owner_id,
    subscription_plan,
    created_at
  ) VALUES (
    p_company_name,
    p_contact_name,
    p_email,
    p_phone,
    p_company_size,
    p_address,
    p_description,
    COALESCE(p_owner_id, auth.uid()),
    'free',
    NOW()
  ) RETURNING company_accounts.id INTO new_company_id;

  -- Return the created company
  RETURN QUERY
  SELECT 
    ca.id,
    ca.company_name,
    ca.contact_name,
    ca.email,
    ca.phone,
    ca.company_size,
    ca.address,
    ca.description,
    ca.owner_id,
    ca.subscription_plan,
    ca.created_at
  FROM public.company_accounts ca
  WHERE ca.id = new_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_company_account TO authenticated, anon;

-- Update the create_user_profile function to handle missing columns
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_user_id UUID,
  p_company_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_role TEXT DEFAULT 'admin',
  p_is_owner BOOLEAN DEFAULT false
)
RETURNS TABLE(
  id UUID,
  company_account_id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  role TEXT,
  is_company_owner BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Insert the user profile
  INSERT INTO public.users (
    id,
    company_account_id,
    email,
    full_name,
    phone,
    role,
    is_company_owner,
    is_active,
    created_at
  ) VALUES (
    p_user_id,
    p_company_id,
    p_email,
    p_full_name,
    p_phone,
    p_role,
    p_is_owner,
    true,
    NOW()
  );

  -- Return the created user profile
  RETURN QUERY
  SELECT 
    u.id,
    u.company_account_id,
    u.email,
    u.full_name,
    u.phone,
    u.role,
    u.is_company_owner,
    u.created_at
  FROM public.users u
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated, anon;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '=== COMPANY SCHEMA FIXED! ===';
  RAISE NOTICE 'Added missing columns to company_accounts table';
  RAISE NOTICE 'Updated helper functions to use correct column names';
  RAISE NOTICE 'You can now test the signup process again';
END $$;
