-- Create persons table
CREATE TABLE IF NOT EXISTS persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  budget DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create person_gifts table
CREATE TABLE IF NOT EXISTS person_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Idée', 'Commandé', 'Livré')),
  image_url TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_person_gifts_person_id ON person_gifts(person_id);
CREATE INDEX IF NOT EXISTS idx_persons_created_at ON persons(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_person_gifts_created_at ON person_gifts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_person_gifts_status ON person_gifts(status);

-- Enable Row Level Security (RLS)
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_gifts ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (consistent with existing tables)
CREATE POLICY "Allow public read access to persons" ON persons
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert to persons" ON persons
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to persons" ON persons
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete to persons" ON persons
  FOR DELETE USING (true);

CREATE POLICY "Allow public read access to person_gifts" ON person_gifts
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert to person_gifts" ON person_gifts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to person_gifts" ON person_gifts
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete to person_gifts" ON person_gifts
  FOR DELETE USING (true);

-- Trigger to automatically update updated_at for persons
CREATE TRIGGER update_persons_updated_at
  BEFORE UPDATE ON persons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at for person_gifts
CREATE TRIGGER update_person_gifts_updated_at
  BEFORE UPDATE ON person_gifts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();