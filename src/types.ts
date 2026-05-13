export type LessonTier = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Lesson {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  materialsUrl: string;
  tier: LessonTier;
  duration: string;
  thumbnail: string;
}

export interface User {
  id: string;
  email: string;
  role: 'Student' | 'Admin';
}
