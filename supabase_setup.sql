-- 1. FRESH START (This deletes everything first so we can start clean)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.lessons CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Create Profiles table
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('student', 'admin')) DEFAULT 'student',
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create Lessons table
CREATE TABLE public.lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    materials_link TEXT,
    tier TEXT CHECK (tier IN ('Beginner', 'Intermediate', 'Advanced')) NOT NULL,
    order_index SERIAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable RLS on Lessons
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_approved = true)
);
CREATE POLICY "Admins can update profiles" ON public.profiles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_approved = true)
);

-- Lessons Policies
CREATE POLICY "Public can view lessons" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "Admins can manage lessons" ON public.lessons FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_approved = true)
);

-- 7. Trigger Function for Profile Creation (AUTO-ADMIN LOGIC)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, is_approved)
    VALUES (
        NEW.id, 
        NEW.email,
        CASE 
            WHEN NEW.email LIKE '%@admin.com' OR NEW.email = 'hanselluis0809@gmail.com' THEN 'admin'
            ELSE 'student'
        END,
        CASE 
            WHEN NEW.email LIKE '%@admin.com' OR NEW.email = 'hanselluis0809@gmail.com' THEN TRUE -- Auto approve
            ELSE FALSE
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create the Trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Seed Data
INSERT INTO public.lessons (title, description, video_url, materials_link, tier)
VALUES 
('Introduction to Photoshop UI', 'Getting familiar with the workspace.', 'https://vimeo.com/76979871', '#', 'Beginner'),
('Mastering Layers', 'Layer management and non-destructive workflows.', 'https://vimeo.com/76979871', '#', 'Beginner');

-- 10. RE-LINK EXISTING USER (Just in case you signed up already)
UPDATE public.profiles 
SET role = 'admin', is_approved = true 
WHERE email = 'hanselluis0809@gmail.com';
