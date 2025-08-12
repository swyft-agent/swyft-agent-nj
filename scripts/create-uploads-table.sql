-- Create uploads table for tracking file uploads
CREATE TABLE IF NOT EXISTS uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_account_id UUID NOT NULL REFERENCES company_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'analyzing', 'processed', 'failed')),
  detected_type TEXT,
  ai_analysis JSONB,
  processed_rows INTEGER DEFAULT 0,
  total_rows INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view uploads from their company" ON uploads
  FOR SELECT USING (company_account_id = (
    SELECT company_account_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert uploads for their company" ON uploads
  FOR INSERT WITH CHECK (company_account_id = (
    SELECT company_account_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update uploads from their company" ON uploads
  FOR UPDATE USING (company_account_id = (
    SELECT company_account_id FROM users WHERE id = auth.uid()
  ));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_uploads_company_account_id ON uploads(company_account_id);
CREATE INDEX IF NOT EXISTS idx_uploads_user_id ON uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_uploads_status ON uploads(status);
CREATE INDEX IF NOT EXISTS idx_uploads_detected_type ON uploads(detected_type);
