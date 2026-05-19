-- 1. Add the username column if not already there
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE profiles ALTER COLUMN is_approved SET DEFAULT true;

-- Ensure profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'username', 
    COALESCE(new.raw_user_meta_data->>'auth_type', 'student')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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

DROP POLICY IF EXISTS "Everyone can view profiles" ON profiles;
CREATE POLICY "Everyone can view profiles" 
ON profiles FOR SELECT 
USING (true);

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

-- Ensure column exists if table was created previously without it
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_progress' AND column_name='completed_at') THEN
    ALTER TABLE user_progress ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
  END IF;
END $$;

-- Enable RLS on user_progress
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Policies for user_progress
DROP POLICY IF EXISTS "Users can view their own progress" ON user_progress;
DROP POLICY IF EXISTS "Admins can view all progress" ON user_progress;
DROP POLICY IF EXISTS "Public can view progress" ON user_progress;
DROP POLICY IF EXISTS "Super admin view progress" ON user_progress;

CREATE POLICY "Super admin view progress" 
ON user_progress FOR SELECT 
USING (auth.jwt() ->> 'email' = 'hanselluis0809@gmail.com');

CREATE POLICY "Admins can view all progress" 
ON user_progress FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can view their own progress" 
ON user_progress FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can record their own progress" ON user_progress;
CREATE POLICY "Users can record their own progress" 
ON user_progress FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own progress" ON user_progress;
CREATE POLICY "Users can update their own progress" 
ON user_progress FOR UPDATE 
USING (auth.uid() = user_id);

-- 8. REPLACE LESSONS WITH REQUESTED BEGINNER SET
DELETE FROM lessons;

INSERT INTO lessons (title, description, content, tier, order_index, steps)
VALUES 
(
  'How to Set Up a Professional Workspace', 
  'Customize your Photoshop environment for maximum efficiency and speed.', 
  '### The Professional Workspace\n\nA professional workspace is the foundation of a fast workflow. Photoshop allows you to save custom arrangements of panels and tools so you can focus on creativity instead of hunting for menus.\n\n**Key Areas**:\n1. **Tool Bar**: Located on the left.\n2. **Options Bar**: Dynamic bar at the top that changes based on your tool.\n3. **Panels**: The modules on the right (Layers, Channels, History).\n\n**Recommendation**:\nAlways keep your **Layers panel** visible. It is the most important part of any design project.', 
  'Beginner', 
  1, 
  '["Go to Window > Workspace > Essentials (Default)","Reset Essentials to ensure you have a clean slate","Drag panels you do not use into the center to close them","Go to Window > Workspace > New Workspace to save your layout"]'::jsonb
),
(
  'How to Use Layers to Organize Your Design', 
  'Learn the backbone of non-destructive editing and keep your projects manageable.', 
  '### The Power of Layers\n\nLayers are like sheets of stacked acetate. You can see through transparent areas of a layer to the layers below. They allow you to move, edit, and work with content on one layer without affecting the rest of the image.\n\n**Best Practices**:\n- **Name your layers**: Never leave them as "Layer 1", "Layer 2".\n- **Use Groups**: Organize related layers into folders.\n- **Color Code**: Right-click the eye icon to add a color tag.', 
  'Beginner', 
  2, 
  '["Create a new blank layer using the plus icon in the Layers panel","Double-click the layer name to rename it (e.g., Background, Logo)","Select multiple layers and press Ctrl/Cmd + G to group them","Adjust opacity to blend layers together"]'::jsonb
),
(
  'How to Navigate Your Canvas Like a Pro', 
  'Master the art of zooming, panning, and rotating your view without breaking your flow.', 
  '### Fluid Navigation\n\nSpeed in Photoshop comes from never having to touch a scroll bar. Using keyboard shortcuts for navigation allows you to keep your focus on the design.\n\n**Pro Shortcuts**:\n- **Spacebar**: Hold this down anytime to pan (Hand Tool).\n- **Ctrl/Cmd + + / -**: Zoom in and out.\n- **Z + Drag**: Scrubby zoom for granular control.\n- **R**: Rotate view (great for digital painting).', 
  'Beginner', 
  3, 
  '["Hold Spacebar and drag to move around your canvas","Hold Ctrl/Cmd and press + or - to jump zoom levels","Press Z and drag your mouse left or right to zoom smoothly","Press Ctrl/Cmd + 0 to instantly fit your design to the screen"]'::jsonb
),
(
  'How to Make Your First Selection with the Lasso Tool', 
  'Freehand selections are essential for organic shapes and quick edits.', 
  '### The Lasso Tool Set\n\nThe Lasso tools allow you to draw freeform, straight-edged, or "magnetic" selection borders. This is the first step in cutting out objects or applying localized adjustments.\n\n**Variations**:\n- **Lasso Tool**: Purely freehand.\n- **Polygonal Lasso**: Click point-to-point for straight lines.\n- **Magnetic Lasso**: "Snaps" to high-contrast edges.', 
  'Beginner', 
  4, 
  '["Select the Lasso Tool (L) from the toolbar","Draw a closed loop around the object you want to select","Hold Shift to add a second area to your current selection","Hold Alt/Opt to subtract a portion of your selection"]'::jsonb
),
(
  'How to Remove Backgrounds Using Quick Select', 
  'The fastest modern way to cut out subjects and create clean cutouts.', 
  '### Automatic Selections\n\nPhotoshop uses advanced AI to detect subjects. The Quick Selection Tool is the most efficient way to grab complex subjects like people or products.\n\n**The "Select Subject" Secret**:\nAt the top of the interface when any selection tool is active, you will see a button labeled **"Select Subject"**. This uses Adobe Sensei (AI) to automatically identify the most likely subject in your image.', 
  'Beginner', 
  5, 
  '["Select the Quick Selection Tool (W)","Paint over the area you want to select; it will automatically snap to edges","Click ''Select Subject'' in the top options bar for an AI-powered cutout","Click the Layer Mask icon to hide the background non-destructively"]'::jsonb
);

-- Enable RLS on lessons
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view lessons" ON lessons;
CREATE POLICY "Anyone can view lessons" 
ON lessons FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admins can manage lessons" ON lessons;
CREATE POLICY "Admins can manage lessons" 
ON lessons FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 9. CREATE FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT NOT NULL,
  admin_reply TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on feedback
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Policies for feedback
DROP POLICY IF EXISTS "Anyone can view feedback" ON feedback;
CREATE POLICY "Anyone can view feedback" 
ON feedback FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Students can insert feedback" ON feedback;
CREATE POLICY "Students can insert feedback" 
ON feedback FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update feedback" ON feedback;
CREATE POLICY "Admins can update feedback" 
ON feedback FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

