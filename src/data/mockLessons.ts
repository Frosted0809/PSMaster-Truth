import { Lesson } from '../types';

const generateLessons = (tier: 'Beginner' | 'Intermediate' | 'Advanced', count: number, startId: number): Lesson[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `${startId + i}`,
    title: `${tier} Lesson ${i + 1}: ${getLessonName(tier, i)}`,
    description: `A comprehensive deep dive into ${getLessonName(tier, i).toLowerCase()}. Master the workflows used by industry professionals in this structured tutorial.`,
    videoUrl: 'https://vimeo.com/76979871', // Placeholder video
    materialsUrl: '#',
    tier,
    duration: `${10 + (i * 2)}m`,
    thumbnail: `https://images.unsplash.com/photo-${1550000000000 + (startId + i)}?auto=format&fit=crop&w=800&q=80`
  }));
};

const getLessonName = (tier: string, index: number): string => {
  const beginnerNames = ['UI Overview', 'Layers Basics', 'Selection Tools', 'Cropping & Resizing', 'Brush Settings', 'Color Correction', 'Healing Brush', 'Text Tool', 'Shapes & Paths', 'Basic Filters', 'Saving for Web', 'Document Setup', 'Transforming Objects', 'History Panel', 'Interface Customization'];
  const intermediateNames = ['Layer Masks', 'Adjustment Layers', 'Retouching Skin', 'Smart Objects', 'Pen Tool Mastery', 'Blending Modes', 'Vector Masks', 'Layer Styles', 'Content-Aware Fill', 'Liquify Filter', 'Gradient Maps', 'Color Grading Basics', 'Focus Stacking', 'Sky Replacement', 'Portrait Retouching'];
  const advancedNames = ['Complex Compositing', 'Matte Painting', 'High-End Color Grading', 'Automation & Actions', '3D in Photoshop', 'Advanced Frequency Separation', 'Texture Painting', 'Digital Illustration', 'Editorial Retouching', 'Visual Effects', 'CGI Integration', 'Lighting Effects', 'Advanced Masking Techniques', 'Workflow Optimization', 'Commercial Post-Production'];

  if (tier === 'Beginner') return beginnerNames[index] || `Topic ${index + 1}`;
  if (tier === 'Intermediate') return intermediateNames[index] || `Topic ${index + 1}`;
  return advancedNames[index] || `Topic ${index + 1}`;
};

export const mockLessons: Lesson[] = [
  ...generateLessons('Beginner', 15, 1),
  ...generateLessons('Intermediate', 15, 101),
  ...generateLessons('Advanced', 15, 201),
];
