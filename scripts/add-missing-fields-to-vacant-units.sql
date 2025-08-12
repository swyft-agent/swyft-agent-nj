-- Add viewing_fee column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vacant_units' AND column_name = 'viewing_fee'
    ) THEN
        ALTER TABLE vacant_units ADD COLUMN viewing_fee DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- Add house_number column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vacant_units' AND column_name = 'house_number'
    ) THEN
        ALTER TABLE vacant_units ADD COLUMN house_number VARCHAR(50);
    END IF;
END $$;

-- Add other potentially missing fields
DO $$ 
BEGIN
    -- property_type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vacant_units' AND column_name = 'property_type'
    ) THEN
        ALTER TABLE vacant_units ADD COLUMN property_type VARCHAR(50) DEFAULT 'apartment';
    END IF;
    
    -- security_deposit
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vacant_units' AND column_name = 'security_deposit'
    ) THEN
        ALTER TABLE vacant_units ADD COLUMN security_deposit DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    -- deposit_amount
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vacant_units' AND column_name = 'deposit_amount'
    ) THEN
        ALTER TABLE vacant_units ADD COLUMN deposit_amount DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    -- latitude
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vacant_units' AND column_name = 'latitude'
    ) THEN
        ALTER TABLE vacant_units ADD COLUMN latitude DECIMAL(10,8);
    END IF;
    
    -- longitude
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vacant_units' AND column_name = 'longitude'
    ) THEN
        ALTER TABLE vacant_units ADD COLUMN longitude DECIMAL(11,8);
    END IF;
    
    -- parking_available
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vacant_units' AND column_name = 'parking_available'
    ) THEN
        ALTER TABLE vacant_units ADD COLUMN parking_available BOOLEAN DEFAULT false;
    END IF;
    
    -- laundry
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vacant_units' AND column_name = 'laundry'
    ) THEN
        ALTER TABLE vacant_units ADD COLUMN laundry VARCHAR(50);
    END IF;
    
    -- lease_terms
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vacant_units' AND column_name = 'lease_terms'
    ) THEN
        ALTER TABLE vacant_units ADD COLUMN lease_terms TEXT;
    END IF;
    
    -- available_date
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vacant_units' AND column_name = 'available_date'
    ) THEN
        ALTER TABLE vacant_units ADD COLUMN available_date DATE;
    END IF;
    
    -- status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vacant_units' AND column_name = 'status'
    ) THEN
        ALTER TABLE vacant_units ADD COLUMN status VARCHAR(20) DEFAULT 'available';
    END IF;
    
    -- featured
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vacant_units' AND column_name = 'featured'
    ) THEN
        ALTER TABLE vacant_units ADD COLUMN featured BOOLEAN DEFAULT false;
    END IF;
    
    -- building_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vacant_units' AND column_name = 'building_id'
    ) THEN
        ALTER TABLE vacant_units ADD COLUMN building_id UUID REFERENCES buildings(id);
    END IF;
    
    -- created_by
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vacant_units' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE vacant_units ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Update existing records to have default values where needed
UPDATE vacant_units 
SET 
    viewing_fee = COALESCE(viewing_fee, 0),
    status = COALESCE(status, 'available'),
    featured = COALESCE(featured, false),
    property_type = COALESCE(property_type, 'apartment'),
    security_deposit = COALESCE(security_deposit, 0),
    deposit_amount = COALESCE(deposit_amount, 0),
    parking_available = COALESCE(parking_available, false)
WHERE viewing_fee IS NULL 
   OR status IS NULL 
   OR featured IS NULL 
   OR property_type IS NULL 
   OR security_deposit IS NULL 
   OR deposit_amount IS NULL 
   OR parking_available IS NULL;
