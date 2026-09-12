import { Course, Lesson, Question, Quiz } from '@/lib/types/course';

/**
 * Mock course data untuk testing.
 * Bentuknya disamakan persis dengan `src/lib/types/course.ts` — jangan
 * tambah field yang tidak ada di tipe aslinya (fixture ini sebelumnya drift
 * dari skema nyata dan tidak pernah type-check sampai audit 2026-09-10).
 */
export const mockLesson: Lesson = {
  id: 1,
  courseId: 1,
  title: 'Pengantar Machine Learning',
  summary: 'Pengenalan konsep dasar machine learning untuk pemula.',
  content: '# Pengantar ML\n\nMachine learning adalah...',
  order: 1,
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
  correctIndex: 0,
  explanation: 'ML adalah singkatan dari Machine Learning.',
};

export const mockQuiz: Quiz = {
  id: 1,
  lessonId: 1,
  title: 'Kuis Pengantar ML',
  questions: [mockQuestion],
};

export const mockCourse: Course = {
  id: 1,
  mentorId: 3,
  title: 'Kursus Dasar Machine Learning',
  slug: 'machine-learning-basics',
  description: 'Belajar machine learning dari nol hingga mahir',
  level: 'pemula',
  topics: ['machine learning', 'python', 'data science'],
  lessonIds: [mockLesson.id],
  createdAt: '2024-01-01',
};

/**
 * Generate array of mock courses untuk testing lists.
 */
export const generateMockCourses = (count: number): Course[] => {
  return Array.from({ length: count }, (_, i) => ({
    ...mockCourse,
    id: i + 1,
    title: `Kursus Machine Learning ${i + 1}`,
    slug: `ml-${i + 1}`,
    createdAt: new Date(2024, 0, i + 1).toISOString(),
  }));
};
