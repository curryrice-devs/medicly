-- Add BioDigital model columns to sessions table
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS affected_model TEXT,
ADD COLUMN IF NOT EXISTS exercise_models TEXT;

-- Add comments to document the columns
COMMENT ON COLUMN sessions.affected_model IS 'URL to BioDigital model for AI analysis preview';
COMMENT ON COLUMN sessions.exercise_models IS 'Comma-separated URLs to BioDigital models for recommended exercises';
