-- Check the current schema of vacant_units table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'vacant_units' 
ORDER BY ordinal_position;

-- Check if viewing_fee and house_number columns exist
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'vacant_units' 
    AND column_name = 'viewing_fee'
) as viewing_fee_exists,
EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'vacant_units' 
    AND column_name = 'house_number'
) as house_number_exists;

-- Sample data check
SELECT id, title, house_number, viewing_fee, building_id, property_type, status
FROM vacant_units 
LIMIT 3;
