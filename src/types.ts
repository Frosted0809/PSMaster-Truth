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

export interface Feedback {
  id: string;
  user_id: string;
  lesson_id?: string;
  rating: number;
  comment: string;
  admin_reply?: string;
  created_at: string;
  user_profile?: UserProfile;
  profiles?: {
    username?: string;
    email: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  role: 'student' | 'admin';
  is_approved: boolean;
  created_at: string;
  last_lesson_id?: string;
}
