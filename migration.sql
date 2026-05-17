-- 1. Add the username column if not already there
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE profiles ALTER COLUMN is_approved SET DEFAULT true;

-- 2. ENABLE RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. DROP OLD POLICIES TO PREVENT CONFLICTS
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Everyone can view usernames" ON profiles;
DROP POLICY IF EXISTS "Super admin access" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 4. SAFE POLICIES (Recursion-Free)
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Super admin access" 
ON profiles FOR ALL 
USING (auth.jwt() ->> 'email' = 'hanselluis0809@gmail.com');

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- 5. UPDATE LESSONS TABLE FOR TEXT CONTENT
-- Using text instead of varchar for content to allow long Markdown blocks
ALTER TABLE lessons DROP COLUMN IF EXISTS video_url;
ALTER TABLE lessons DROP COLUMN IF EXISTS materials_link;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS content TEXT DEFAULT '';
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS steps JSONB DEFAULT '[]'::jsonb;

-- 7. STORAGE (Manual Setup Required in Supabase Dashboard)
-- Go to Storage -> Create New Bucket -> Name it "thumbnails" -> Make it PUBLIC.
-- This is necessary for the local file upload feature to work.
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, lesson_id)
);

-- Enable RLS on user_progress
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Policies for user_progress
DROP POLICY IF EXISTS "Users can view their own progress" ON user_progress;
CREATE POLICY "Users can view their own progress" 
ON user_progress FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can record their own progress" ON user_progress;
CREATE POLICY "Users can record their own progress" 
ON user_progress FOR INSERT 
WITH CHECK (auth.uid() = user_id);

