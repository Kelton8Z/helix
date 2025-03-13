-- Create tables for Helix application

-- Messages table to store chat history
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('user', 'assistant', 'status')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Sequences table to store generated outreach sequences
CREATE TABLE IF NOT EXISTS sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    context JSONB DEFAULT '{}'::jsonb,
    steps JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_sequences_user_id ON sequences(user_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_sequences_updated_at
BEFORE UPDATE ON sequences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create RLS (Row Level Security) policies
-- Enable RLS on tables
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view their own messages" ON messages
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own messages" ON messages
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own sequences" ON sequences
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own sequences" ON sequences
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own sequences" ON sequences
    FOR UPDATE USING (auth.uid()::text = user_id);
