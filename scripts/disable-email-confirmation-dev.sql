-- Disable email confirmation for development
-- This should only be used in development environments

-- Update auth settings to disable email confirmation
UPDATE auth.config 
SET 
  enable_signup = true,
  enable_email_confirmations = false
WHERE 
  id = 1;

-- If the above doesn't work, try this alternative approach:
-- You can also disable email confirmation in your Supabase dashboard:
-- 1. Go to Authentication > Settings
-- 2. Under "User Signups" turn off "Enable email confirmations"

-- For existing users who haven't confirmed their email, you can confirm them manually:
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  confirmed_at = NOW()
WHERE 
  email_confirmed_at IS NULL;

-- Create a function to auto-confirm new users (development only)
CREATE OR REPLACE FUNCTION auto_confirm_users()
RETURNS TRIGGER AS $$
BEGIN
  -- Only for development - auto-confirm all new users
  NEW.email_confirmed_at = NOW();
  NEW.confirmed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-confirm users on signup (development only)
DROP TRIGGER IF EXISTS auto_confirm_users_trigger ON auth.users;
CREATE TRIGGER auto_confirm_users_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_confirm_users();

-- Note: Remember to remove this trigger and function in production!
