-- Create gifts table
CREATE TABLE IF NOT EXISTS gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  purchase_link TEXT NOT NULL,
  image_url TEXT,
  price DECIMAL(10, 2) NOT NULL,
  categories TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  hex_key TEXT UNIQUE NOT NULL,
  view_only BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create interests table (junction table for gifts and users)
CREATE TABLE IF NOT EXISTS interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_id UUID NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(gift_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gifts_created_at ON gifts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_hex_key ON users(hex_key);
CREATE INDEX IF NOT EXISTS idx_interests_gift_id ON interests(gift_id);
CREATE INDEX IF NOT EXISTS idx_interests_user_id ON interests(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to gifts" ON gifts
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to interests" ON interests
  FOR SELECT USING (true);

-- Create policies for public write access (you may want to restrict this later)
CREATE POLICY "Allow public insert to gifts" ON gifts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to gifts" ON gifts
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete to gifts" ON gifts
  FOR DELETE USING (true);

CREATE POLICY "Allow public insert to users" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert to interests" ON interests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete to interests" ON interests
  FOR DELETE USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_gifts_updated_at
  BEFORE UPDATE ON gifts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();