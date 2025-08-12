-- Simplify Functions to Return Simple JSON Objects
-- This fixes the "structure of query does not match function result type" error

-- Drop existing functions
DROP FUNCTION IF EXISTS public.create_company_account(text,text,text,text,text,text,text,uuid);
DROP FUNCTION IF EXISTS public.create_user_profile(uuid,uuid,text,text,text,text,boolean);

-- Create simplified create_company_account function that returns JSON
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

-- Create simplified create_user_profile function that returns JSON
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_company_account TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_company_account TO anon;
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile TO anon;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Functions simplified successfully!';
    RAISE NOTICE 'Functions now return JSON objects instead of table structures.';
END $$;
