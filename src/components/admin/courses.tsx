"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { EmptyState, LevelBadge } from "@/components/ui";
import { useToast } from "@/components/toast";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { QuizEditor } from "@/components/admin/quiz-editor";
import type { Level } from "@/lib/types";

const LEVELS: Array<{ value: Level; label: string }> = [
  { value: "pemula", label: "Pemula" },
  { value: "menengah", label: "Menengah" },
  { value: "lanjutan", label: "Lanjutan" },
];

interface CourseForm {
  title: string;
  description: string;
  level: Level;
  topics: string;
  mentorId: number;
}

const emptyCourse: CourseForm = { title: "", description: "", level: "pemula", topics: "", mentorId: 1 };

function parseTags(input: string): string[] {
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function Courses() {
  const { state, addCourse, editCourse, deleteCourse } = useStore();
  const { toast } = useToast();
  const [form, setForm] = useState<CourseForm>(emptyCourse);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  function resetForm() {
    setForm(emptyCourse);
    setEditingId(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast("Judul wajib diisi", "error");
      return;
    }
    const data = {
      title: form.title,
      description: form.description,
      level: form.level,
      topics: parseTags(form.topics),
      mentorId: form.mentorId,
    };
    if (editingId != null) {
      editCourse(editingId, data);
      toast("Kursus diperbarui");
    } else {
      addCourse(data);
      toast("Kursus ditambahkan");
    }
    resetForm();
  }

  function startEdit(courseId: number) {
    const c = state.courses.find((x) => x.id === courseId);
    if (!c) return;
    setForm({
      title: c.title,
      description: c.description,
      level: c.level,
      topics: c.topics.join(", "),
      mentorId: c.mentorId,
    });
    setEditingId(courseId);
    setExpandedId(null);
  }

  function handleDeleteCourse(courseId: number, title: string) {
    if (!window.confirm(`Hapus kursus "${title}" beserta pelajaran dan kuisnya?`)) return;
    deleteCourse(courseId);
    if (expandedId === courseId) setExpandedId(null);
    if (editingId === courseId) resetForm();
    toast("Kursus dihapus");
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="card p-5">
        <h2 className="mb-4 font-semibold text-content">
          {editingId != null ? "Edit Kursus" : "Tambah Kursus"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Judul</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Judul kursus" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Deskripsi</label>
            <MarkdownEditor rows={3} value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Deskripsi singkat" />
          </div>
          <div>
            <label className="label">Level</label>
            <select className="input" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as Level })}>
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Mentor</label>
            <select className="input" value={form.mentorId} onChange={(e) => setForm({ ...form, mentorId: Number(e.target.value) })}>
              {state.users
                .filter((u) => u.role === "mentor" || u.role === "admin")
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Topik (pisahkan dengan koma)</label>
            <input className="input" value={form.topics} onChange={(e) => setForm({ ...form, topics: e.target.value })} placeholder="machine-learning, dasar" />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button type="submit" className="btn-primary">
            {editingId != null ? "Simpan" : "Tambah"}
          </button>
          {editingId != null && (
            <button type="button" onClick={resetForm} className="btn-secondary">
              Batal
            </button>
          )}
        </div>
      </form>

      {state.courses.length === 0 ? (
        <EmptyState icon="📚" title="Tidak ada kursus" />
      ) : (
        <div className="space-y-3">
          {state.courses.map((course) => (
            <div key={course.id} className="card overflow-hidden">
              <div className="flex items-center gap-3 p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-content">{course.title}</h3>
                    <LevelBadge level={course.level} />
                  </div>
                  <p className="mt-1 truncate text-sm text-muted">{course.description}</p>
                  <p className="mt-1 text-xs text-subtle">
                    {course.lessonIds.length} pelajaran · {course.topics.join(", ")}
                  </p>
                </div>
                <button onClick={() => setExpandedId(expandedId === course.id ? null : course.id)} className="btn-secondary">
                  {expandedId === course.id ? "Tutup" : "Kelola"}
                </button>
                <button onClick={() => startEdit(course.id)} className="btn-secondary">
                  Edit
                </button>
                <button onClick={() => handleDeleteCourse(course.id, course.title)} className="btn-danger">
                  Hapus
                </button>
              </div>

              {expandedId === course.id && (
                <div className="border-t border-border bg-surface/50 p-5">
                  <CourseLessons courseId={course.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const emptyLesson = { title: "", summary: "", content: "" };

function CourseLessons({ courseId }: { courseId: number }) {
  const { state, addLesson, editLesson, deleteLesson } = useStore();
  const { toast } = useToast();
  const lessons = state.lessons.filter((l) => l.courseId === courseId);
  const [lessonForm, setLessonForm] = useState(emptyLesson);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [quizLessonId, setQuizLessonId] = useState<number | null>(null);

  function submitLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!lessonForm.title.trim()) {
      toast("Judul pelajaran wajib diisi", "error");
      return;
    }
    if (editingLessonId != null) {
      editLesson(editingLessonId, lessonForm);
      toast("Pelajaran diperbarui");
    } else {
      addLesson(courseId, lessonForm);
      toast("Pelajaran ditambahkan");
    }
    setLessonForm(emptyLesson);
    setEditingLessonId(null);
  }

  function startEditLesson(lessonId: number) {
    const l = state.lessons.find((x) => x.id === lessonId);
    if (!l) return;
    setLessonForm({ title: l.title, summary: l.summary, content: l.content });
    setEditingLessonId(lessonId);
  }

  function handleDeleteLesson(lessonId: number, title: string) {
    if (!window.confirm(`Hapus pelajaran "${title}" beserta kuisnya?`)) return;
    deleteLesson(lessonId);
    toast("Pelajaran dihapus");
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submitLesson} className="space-y-3 rounded-lg border border-border p-4">
        <h4 className="font-semibold text-content">
          {editingLessonId != null ? "Edit Pelajaran" : "Tambah Pelajaran"}
        </h4>
        <input className="input" value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} placeholder="Judul pelajaran" />
        <input className="input" value={lessonForm.summary} onChange={(e) => setLessonForm({ ...lessonForm, summary: e.target.value })} placeholder="Ringkasan singkat" />
        <MarkdownEditor rows={12} value={lessonForm.content} onChange={(v) => setLessonForm({ ...lessonForm, content: v })} placeholder="Isi materi (Markdown)" />
        <div className="flex gap-2">
          <button type="submit" className="btn-primary">
            {editingLessonId != null ? "Simpan" : "Tambah"}
          </button>
          {editingLessonId != null && (
            <button
              type="button"
              onClick={() => {
                setLessonForm(emptyLesson);
                setEditingLessonId(null);
              }}
              className="btn-secondary"
            >
              Batal
            </button>
          )}
        </div>
      </form>

      <div className="space-y-2">
        {lessons.map((lesson) => (
          <div key={lesson.id} className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-content">{lesson.title}</span>
              <span className="text-xs text-subtle">({lesson.order})</span>
              <div className="ml-auto flex gap-1">
                <button onClick={() => setQuizLessonId(quizLessonId === lesson.id ? null : lesson.id)} className="btn-ghost px-2 py-1 text-xs">
                  Kuis
                </button>
                <button onClick={() => startEditLesson(lesson.id)} className="btn-ghost px-2 py-1 text-xs">
                  Edit
                </button>
                <button onClick={() => handleDeleteLesson(lesson.id, lesson.title)} className="btn-ghost px-2 py-1 text-xs text-danger hover:bg-danger-soft">
                  Hapus
                </button>
              </div>
            </div>
            {quizLessonId === lesson.id && <LessonQuizPanel lessonId={lesson.id} onClose={() => setQuizLessonId(null)} />}
          </div>
        ))}
        {lessons.length === 0 && <p className="text-sm text-muted">Belum ada pelajaran.</p>}
      </div>
    </div>
  );
}

function LessonQuizPanel({ lessonId, onClose }: { lessonId: number; onClose: () => void }) {
  const { state, saveQuiz, deleteQuiz } = useStore();
  const { toast } = useToast();
  const existing = state.quizzes.find((q) => q.lessonId === lessonId);
  return (
    <QuizEditor
      lessonId={lessonId}
      initialTitle={existing?.title ?? ""}
      initialQuestions={existing?.questions ?? []}
      hasExisting={existing != null}
      onSave={async (data) => {
        await saveQuiz(lessonId, data);
        toast("Kuis disimpan");
      }}
      onDelete={async () => {
        await deleteQuiz(lessonId);
        toast("Kuis dihapus");
      }}
      onClose={onClose}
    />
  );
}
