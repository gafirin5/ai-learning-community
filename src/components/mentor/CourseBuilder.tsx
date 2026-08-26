"use client";

import { useState } from "react";
import type { CourseData, QuizData } from "@/app/mentor/mentor-store";

interface CourseBuilderProps {
  onAddCourse: (course: Omit<CourseData, "id">) => void;
  onAddQuiz: (quiz: Omit<QuizData, "id">) => void;
  courses: CourseData[];
}

export function CourseBuilder({ onAddCourse, onAddQuiz, courses }: CourseBuilderProps) {
  const [activeTab, setActiveTab] = useState<"course" | "quiz">("course");

  // Course Form State
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [courseContent, setCourseContent] = useState("");

  // Quiz Form State
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [quizQuestion, setQuizQuestion] = useState("");
  const [quizOptions, setQuizOptions] = useState(["", "", "", ""]);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle || !courseContent) return;
    onAddCourse({
      title: courseTitle,
      description: courseDescription,
      content: courseContent,
    });
    setCourseTitle("");
    setCourseDescription("");
    setCourseContent("");
    alert("Course added successfully!");
  };

  const handleAddQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !quizQuestion || quizOptions.some((opt) => !opt)) return;
    onAddQuiz({
      courseId: selectedCourseId,
      question: quizQuestion,
      options: quizOptions,
      correctOptionIndex,
    });
    setQuizQuestion("");
    setQuizOptions(["", "", "", ""]);
    setCorrectOptionIndex(0);
    alert("Quiz added successfully!");
  };

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold mb-4 text-content">Course & Quiz Builder</h2>

      <div className="flex gap-4 border-b border-border mb-6">
        <button
          className={`pb-2 px-1 ${activeTab === "course" ? "border-b-2 border-brand font-semibold text-brand" : "text-muted hover:text-content"}`}
          onClick={() => setActiveTab("course")}
        >
          Create Course
        </button>
        <button
          className={`pb-2 px-1 ${activeTab === "quiz" ? "border-b-2 border-brand font-semibold text-brand" : "text-muted hover:text-content"}`}
          onClick={() => setActiveTab("quiz")}
        >
          Create Quiz
        </button>
      </div>

      {activeTab === "course" && (
        <form onSubmit={handleAddCourse} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-content mb-1">Course Title</label>
            <input
              type="text"
              className="input w-full"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-content mb-1">Short Description</label>
            <input
              type="text"
              className="input w-full"
              value={courseDescription}
              onChange={(e) => setCourseDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-content mb-1">Markdown Content</label>
            <textarea
              className="input w-full h-48 font-mono text-sm"
              value={courseContent}
              onChange={(e) => setCourseContent(e.target.value)}
              placeholder="# Course Heading&#10;&#10;Write content here..."
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Save Course
          </button>
        </form>
      )}

      {activeTab === "quiz" && (
        <form onSubmit={handleAddQuiz} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-content mb-1">Select Course</label>
            <select
              className="input w-full"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              required
            >
              <option value="" disabled>Select a course...</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-content mb-1">Question</label>
            <input
              type="text"
              className="input w-full"
              value={quizQuestion}
              onChange={(e) => setQuizQuestion(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-content mb-1">Options</label>
            {quizOptions.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correctOption"
                  checked={correctOptionIndex === idx}
                  onChange={() => setCorrectOptionIndex(idx)}
                />
                <input
                  type="text"
                  className="input flex-1"
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...quizOptions];
                    newOpts[idx] = e.target.value;
                    setQuizOptions(newOpts);
                  }}
                  placeholder={`Option ${idx + 1}`}
                  required
                />
              </div>
            ))}
          </div>
          <button type="submit" className="btn btn-primary" disabled={courses.length === 0}>
            Save Quiz
          </button>
          {courses.length === 0 && (
            <p className="text-sm text-error mt-2">Please create a course first.</p>
          )}
        </form>
      )}
    </div>
  );
}
