-- Fix Functions by Dropping and Recreating Them
-- This script fixes the "cannot change return type of existing function" error

DO $$
BEGIN
    RAISE NOTICE 'Starting function fix process...';
END $$;

-- Step 1: Drop existing functions if they exist
DO $$
BEGIN
    -- Drop create_company_account function with various possible signatures
    DROP FUNCTION IF EXISTS public.create_company_account(text,text,text,text,text,text,text,uuid);
    DROP FUNCTION IF EXISTS public.create_company_account(text,text,text,text,text,text,text,text);
    DROP FUNCTION IF EXISTS create_company_account(text,text,text,text,text,text,text,uuid);
    DROP FUNCTION IF EXISTS create_company_account(text,text,text,text,text,text,text,text);
    
    -- Drop create_user_profile function with various possible signatures
    DROP FUNCTION IF EXISTS public.create_user_profile(uuid,uuid,text,text,text,text,boolean);
    DROP FUNCTION IF EXISTS create_user_profile(uuid,uuid,text,text,text,text,boolean);
    
    RAISE NOTICE 'Existing functions dropped successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error dropping functions (this is OK if they did not exist): %', SQLERRM;
END $$;

-- Step 2: Add missing columns to company_accounts table
DO $$
BEGIN
    -- Add owner_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_accounts' 
        AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE public.company_accounts ADD COLUMN owner_id UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Added owner_id column to company_accounts';
    END IF;

    -- Add contact_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_accounts' 
        AND column_name = 'contact_name'
    ) THEN
        ALTER TABLE public.company_accounts ADD COLUMN contact_name TEXT;
        RAISE NOTICE 'Added contact_name column to company_accounts';
    END IF;

    -- Add company_size column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_accounts' 
        AND column_name = 'company_size'
    ) THEN
        ALTER TABLE public.company_accounts ADD COLUMN company_size TEXT;
        RAISE NOTICE 'Added company_size column to company_accounts';
    END IF;

    -- Add address column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_accounts' 
        AND column_name = 'address'
    ) THEN
        ALTER TABLE public.company_accounts ADD COLUMN address TEXT;
        RAISE NOTICE 'Added address column to company_accounts';
    END IF;

    -- Add description column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_accounts' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE public.company_accounts ADD COLUMN description TEXT;
        RAISE NOTICE 'Added description column to company_accounts';
    END IF;

    -- Add subscription_plan column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_accounts' 
        AND column_name = 'subscription_plan'
    ) THEN
        ALTER TABLE public.company_accounts ADD COLUMN subscription_plan TEXT DEFAULT 'free';
        RAISE NOTICE 'Added subscription_plan column to company_accounts';
    END IF;

    RAISE NOTICE 'Column additions completed';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding columns: %', SQLERRM;
END $$;

-- Step 3: Create the new create_company_account function
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
    subscription_plan TEXT,
    owner_id UUID,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_company_id UUID;
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
    ) RETURNING public.company_accounts.id INTO new_company_id;

    -- Return the created company data
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
        ca.subscription_plan,
        ca.owner_id,
        ca.created_at
    FROM public.company_accounts ca
    WHERE ca.id = new_company_id;
END;
$$;

-- Step 4: Create the new create_user_profile function
CREATE OR REPLACE FUNCTION public.create_user_profile(
    p_user_id UUID,
    p_company_id UUID,
    p_email TEXT,
    p_full_name TEXT,
    p_phone TEXT,
    p_role TEXT DEFAULT 'admin',
    p_is_owner BOOLEAN DEFAULT true
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
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

    -- Return the created user data
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
$$;

-- Step 5: Grant permissions
GRANT EXECUTE ON FUNCTION public.create_company_account TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_company_account TO anon;
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile TO anon;

DO $$
BEGIN
    RAISE NOTICE 'Function fix completed successfully!';
    RAISE NOTICE 'Created functions:';
    RAISE NOTICE '- create_company_account(text,text,text,text,text,text,text,uuid)';
    RAISE NOTICE '- create_user_profile(uuid,uuid,text,text,text,text,boolean)';
    RAISE NOTICE 'All functions have proper return types and permissions.';
END $$;
