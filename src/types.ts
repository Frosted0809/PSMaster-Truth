export type LessonTier = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  tier: LessonTier;
  order_index?: number;
  created_at?: string;
  thumbnail_url?: string;
  steps?: string[];
}

export interface UserProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  role: 'student' | 'admin';
  is_approved: boolean;
  created_at: string;
}
