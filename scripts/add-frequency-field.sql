-- Add frequency field to vacant_units table for multiple similar units tracking
-- This allows one listing to represent multiple identical vacant units

-- Add the frequency column with default value of 1
ALTER TABLE vacant_units 
ADD COLUMN IF NOT EXISTS frequency INTEGER DEFAULT 1;

-- Add constraint to ensure frequency is always positive
ALTER TABLE vacant_units 
ADD CONSTRAINT IF NOT EXISTS frequency_positive CHECK (frequency > 0);

-- Add comment to document the field
COMMENT ON COLUMN vacant_units.frequency IS 'Number of identical vacant units this listing represents. Decrements when units are reserved.';

-- Update existing records to have frequency = 1 if they are NULL
UPDATE vacant_units 
SET frequency = 1 
WHERE frequency IS NULL;

-- Create index for better query performance on frequency filtering
CREATE INDEX IF NOT EXISTS idx_vacant_units_frequency_status 
ON vacant_units(frequency, status) 
WHERE status = 'available' AND frequency > 0;

-- Add role column to users table if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'agent';

-- Update role column to use enum-like values
UPDATE users 
SET role = CASE 
  WHEN role IS NULL OR role = '' THEN 'agent'
  WHEN LOWER(role) IN ('admin', 'owner', 'manager') THEN 'manager'
  WHEN LOWER(role) IN ('agent', 'broker') THEN 'agent'
  WHEN LOWER(role) IN ('tenant', 'renter') THEN 'tenant'
  ELSE 'agent'
END;

-- Add constraint for role values
ALTER TABLE users 
ADD CONSTRAINT IF NOT EXISTS users_role_check 
CHECK (role IN ('agent', 'manager', 'tenant', 'admin'));

-- Add comment to document the role field
COMMENT ON COLUMN users.role IS 'User role: agent (broker/agent), manager (landlord/property manager), tenant (current tenant), admin (system admin)';
