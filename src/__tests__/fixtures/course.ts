import { Course, Lesson, Question, Quiz } from '@/lib/types/course';

/**
 * Mock course data untuk testing
 * Berdasarkan struktur dari src/lib/data/courses.ts
 */
export const mockLesson: Lesson = {
  id: 1,
  courseId: 1,
  title: 'Pengantar Machine Learning',
  order: 1,
  contentMarkdown: '# Pengantar ML\n\nMachine learning adalah...',
  readingTimeMinutes: 15,
};

export const mockQuestion: Question = {
  id: 1,
  text: 'Apa kepanjangan dari ML?',
  options: [
    'Machine Learning',
    'Math Learning',
    'Model Learning',
    'Manual Learning',
  ],
  correctOptionIndex: 0,
};

export const mockQuiz: Quiz = {
  id: 1,
  lessonId: 1,
  questions: [mockQuestion],
  passingScore: 70,
};

export const mockCourse: Course = {
  id: 1,
  title: 'Kursus Dasar Machine Learning',
  slug: 'machine-learning-basics',
  description: 'Belajar machine learning dari nol hingga mahir',
  image: '/images/ml-course.jpg',
  level: 'pemula' as const, // pemula | menengah | lanjutan
  durationWeeks: 8,
  lessonsCount: 7,
  topics: ['machine learning', 'python', 'data science'],
  mentorId: 3,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15'),
  lessons: [mockLesson],
  quizzes: [mockQuiz],
  quizByLesson: new Map([[1, mockQuiz]]),
  lessonById: new Map([[1, mockLesson]]),
  courseById: new Map([[1, mockCourse]]),
};

/**
 * Generate array of mock courses untuk testing lists
 */
export const generateMockCourses = (count: number): Course[] => {
  return Array.from({ length: count }, (_, i) => ({
    ...mockCourse,
    id: i + 1,
    title: `Kursus Machine Learning ${i + 1}`,
    slug: `ml-${i + 1}`,
    createdAt: new Date(2024, 0, i + 1),
  }));
};
