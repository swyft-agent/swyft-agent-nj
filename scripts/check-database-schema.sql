-- Check the structure of all our main tables
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'company_accounts', 'buildings', 'vacant_units')
ORDER BY table_name, ordinal_position;

-- Check what's actually in the users table
SELECT 
    id,
    email,
    company_account_id,
    company_name,
    contact_name,
    role,
    created_at
FROM users 
LIMIT 5;

-- Check what's in company_accounts table
SELECT 
    id,
    company_name,
    contact_name,
    email,
    created_at
FROM company_accounts 
LIMIT 5;

-- Check what's in buildings table
SELECT 
    building_id,
    company_account_id,
    name,
    address,
    city,
    created_at
FROM buildings 
LIMIT 5;

-- Check the relationship between users and buildings
SELECT 
    u.email,
    u.company_account_id as user_company_id,
    b.building_id,
    b.name as building_name,
    b.company_account_id as building_company_id
FROM users u
LEFT JOIN buildings b ON u.company_account_id = b.company_account_id
LIMIT 10;
