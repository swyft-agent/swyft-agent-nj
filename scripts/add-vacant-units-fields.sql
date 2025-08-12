-- Add the new required fields to vacant_units table
DO $$ 
BEGIN
    -- Add house_number field if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'vacant_units' AND column_name = 'house_number') THEN
        ALTER TABLE vacant_units ADD COLUMN house_number VARCHAR(50);
    END IF;

    -- Add viewing_fee field if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'vacant_units' AND column_name = 'viewing_fee') THEN
        ALTER TABLE vacant_units ADD COLUMN viewing_fee DECIMAL(10,2);
    END IF;
END $$;

-- Create index for house_number for faster duplicate checking
CREATE INDEX IF NOT EXISTS idx_vacant_units_house_number ON vacant_units(house_number);

-- Create composite index for building_id + house_number for duplicate prevention
CREATE INDEX IF NOT EXISTS idx_vacant_units_building_house ON vacant_units(building_id, house_number);

-- Add comment to explain the fields
COMMENT ON COLUMN vacant_units.house_number IS 'Unit identifier within the building (e.g., A-101, B-205)';
COMMENT ON COLUMN vacant_units.viewing_fee IS 'Fee charged for viewing the unit in KSH';
