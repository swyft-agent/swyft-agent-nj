-- Drop existing wallet policies if they exist
DROP POLICY IF EXISTS "Users can view their own wallet" ON public.wallet;
DROP POLICY IF EXISTS "Users can insert their own wallet" ON public.wallet;
DROP POLICY IF EXISTS "Users can update their own wallet" ON public.wallet;
DROP POLICY IF EXISTS "Users can delete their own wallet" ON public.wallet;

-- Create updated RLS policies for wallet table
CREATE POLICY "Users can view their own wallet" ON public.wallet
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (company_account_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.company_account_id = wallet.company_account_id
        ))
    );

CREATE POLICY "Users can insert their own wallet" ON public.wallet
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        (company_account_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.company_account_id = wallet.company_account_id
        ))
    );

CREATE POLICY "Users can update their own wallet" ON public.wallet
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        (company_account_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.company_account_id = wallet.company_account_id
        ))
    ) WITH CHECK (
        auth.uid() = user_id OR 
        (company_account_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.company_account_id = wallet.company_account_id
        ))
    );

CREATE POLICY "Users can delete their own wallet" ON public.wallet
    FOR DELETE USING (
        auth.uid() = user_id OR 
        (company_account_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.company_account_id = wallet.company_account_id
        ))
    );

-- Ensure wallet table has proper structure
ALTER TABLE public.wallet 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing wallet records to have user_id
UPDATE public.wallet 
SET user_id = (
    SELECT users.id 
    FROM public.users 
    WHERE users.company_account_id = wallet.company_account_id 
    LIMIT 1
)
WHERE user_id IS NULL AND company_account_id IS NOT NULL;
