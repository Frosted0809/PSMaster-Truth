export type LessonTier = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Lesson {
  id: string;
  title: string;
  description: string;
  video_url: string;
  materials_link: string;
  tier: LessonTier;
  order_index?: number;
  created_at?: string;
  thumbnail?: string; // Derived or optional
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'student' | 'admin';
  is_approved: boolean;
  created_at: string;
}
