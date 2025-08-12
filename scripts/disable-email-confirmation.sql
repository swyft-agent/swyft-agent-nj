-- Optional: Disable email confirmation for development
-- Run this in Supabase SQL Editor if you want to skip email confirmation during development

-- This will allow users to sign up without email confirmation
-- WARNING: Only use this for development/testing environments

UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- To disable email confirmation for new signups, you need to:
-- 1. Go to Supabase Dashboard > Authentication > Settings
-- 2. Turn OFF "Enable email confirmations"
-- 3. Save the settings

SELECT 'Email confirmation disabled for existing users. Please also disable it in Auth Settings.' as message;
