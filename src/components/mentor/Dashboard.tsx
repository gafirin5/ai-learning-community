"use client";

import { useMentorStore } from "@/app/mentor/mentor-store";
import { CourseBuilder } from "./CourseBuilder";
import { LiveMentoring } from "./LiveMentoring";

export function MentorDashboard() {
  const { courses, addCourse, quizzes, addQuiz, sessions, addSession } = useMentorStore();

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-surface p-6 rounded-xl border border-border">
        <div>
          <h1 className="text-2xl font-bold text-content">Mentor Hub</h1>
          <p className="text-muted">Manage your courses, quizzes, and live mentoring sessions.</p>
        </div>
        <div className="flex gap-4 text-center">
          <div className="bg-surface-hover px-4 py-2 rounded-lg">
            <span className="block text-2xl font-bold text-brand">{courses.length}</span>
            <span className="text-xs text-muted">Courses</span>
          </div>
          <div className="bg-surface-hover px-4 py-2 rounded-lg">
            <span className="block text-2xl font-bold text-brand">{quizzes.length}</span>
            <span className="text-xs text-muted">Quizzes</span>
          </div>
          <div className="bg-surface-hover px-4 py-2 rounded-lg">
            <span className="block text-2xl font-bold text-brand">{sessions.length}</span>
            <span className="text-xs text-muted">Sessions</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-8">
          <CourseBuilder onAddCourse={addCourse} onAddQuiz={addQuiz} courses={courses} />
        </div>
        <div className="space-y-8">
          <LiveMentoring onAddSession={addSession} sessions={sessions} />
        </div>
      </div>
    </div>
  );
}
