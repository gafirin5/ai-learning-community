import type { Level } from "./common";

export interface Lesson {
  id: number;
  courseId: number;
  title: string;
  summary: string;
  content: string;
  order: number;
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Quiz {
  id: number;
  lessonId: number;
  title: string;
  questions: Question[];
}

export interface Course {
  id: number;
  mentorId: number;
  title: string;
  slug: string;
  description: string;
  level: Level;
  topics: string[];
  lessonIds: number[];
  createdAt: string;
}
