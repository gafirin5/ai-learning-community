import { useState } from "react";

export type CourseData = {
  id: string;
  title: string;
  description: string;
  content: string; // Markdown content
};

export type QuizData = {
  id: string;
  courseId: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
};

export type MentoringSession = {
  id: string;
  title: string;
  date: string; // ISO string or simple date string
  time: string; // Time string like "10:00 AM"
  link: string;
};

export function useMentorStore() {
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [quizzes, setQuizzes] = useState<QuizData[]>([]);
  const [sessions, setSessions] = useState<MentoringSession[]>([]);

  const addCourse = (course: Omit<CourseData, "id">) => {
    const newCourse = { ...course, id: Date.now().toString() };
    setCourses((prev) => [...prev, newCourse]);
  };

  const addQuiz = (quiz: Omit<QuizData, "id">) => {
    const newQuiz = { ...quiz, id: Date.now().toString() };
    setQuizzes((prev) => [...prev, newQuiz]);
  };

  const addSession = (session: Omit<MentoringSession, "id">) => {
    const newSession = { ...session, id: Date.now().toString() };
    setSessions((prev) => [...prev, newSession]);
  };

  return {
    courses,
    addCourse,
    quizzes,
    addQuiz,
    sessions,
    addSession,
  };
}
