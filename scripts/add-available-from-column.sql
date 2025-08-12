-- Add missing available_from column to vacant_units table
-- This script adds the available_from column if it doesn't exist

DO $$ 
BEGIN
    -- Check if available_from column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'vacant_units' 
        AND column_name = 'available_from'
    ) THEN
        ALTER TABLE vacant_units ADD COLUMN available_from DATE;
        RAISE NOTICE 'Added available_from column to vacant_units table';
    ELSE
        RAISE NOTICE 'available_from column already exists in vacant_units table';
    END IF;
    
    -- Check if property_type column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'vacant_units' 
        AND column_name = 'property_type'
    ) THEN
        ALTER TABLE vacant_units ADD COLUMN property_type VARCHAR(50);
        RAISE NOTICE 'Added property_type column to vacant_units table';
    ELSE
        RAISE NOTICE 'property_type column already exists in vacant_units table';
    END IF;
    
    -- Check if square_feet column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'vacant_units' 
        AND column_name = 'square_feet'
    ) THEN
        ALTER TABLE vacant_units ADD COLUMN square_feet INTEGER;
        RAISE NOTICE 'Added square_feet column to vacant_units table';
    ELSE
        RAISE NOTICE 'square_feet column already exists in vacant_units table';
    END IF;
    
    -- Check if pet_policy column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'vacant_units' 
        AND column_name = 'pet_policy'
    ) THEN
        ALTER TABLE vacant_units ADD COLUMN pet_policy VARCHAR(100);
        RAISE NOTICE 'Added pet_policy column to vacant_units table';
    ELSE
        RAISE NOTICE 'pet_policy column already exists in vacant_units table';
    END IF;
    
    -- Check if parking_available column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'vacant_units' 
        AND column_name = 'parking_available'
    ) THEN
        ALTER TABLE vacant_units ADD COLUMN parking_available BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added parking_available column to vacant_units table';
    ELSE
        RAISE NOTICE 'parking_available column already exists in vacant_units table';
    END IF;
    
    -- Check if featured column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'vacant_units' 
        AND column_name = 'featured'
    ) THEN
        ALTER TABLE vacant_units ADD COLUMN featured BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added featured column to vacant_units table';
    ELSE
        RAISE NOTICE 'featured column already exists in vacant_units table';
    END IF;
    
    -- Check if frequency column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'vacant_units' 
        AND column_name = 'frequency'
    ) THEN
        ALTER TABLE vacant_units ADD COLUMN frequency INTEGER DEFAULT 1;
        RAISE NOTICE 'Added frequency column to vacant_units table';
    ELSE
        RAISE NOTICE 'frequency column already exists in vacant_units table';
    END IF;

END $$;

-- Update any existing records to have default values for new columns
UPDATE vacant_units 
SET 
    property_type = COALESCE(property_type, 'apartment'),
    parking_available = COALESCE(parking_available, false),
    featured = COALESCE(featured, false),
    frequency = COALESCE(frequency, 1)
WHERE property_type IS NULL 
   OR parking_available IS NULL 
   OR featured IS NULL 
   OR frequency IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vacant_units_property_type ON vacant_units(property_type);
CREATE INDEX IF NOT EXISTS idx_vacant_units_available_from ON vacant_units(available_from);
CREATE INDEX IF NOT EXISTS idx_vacant_units_featured ON vacant_units(featured);

COMMIT;
