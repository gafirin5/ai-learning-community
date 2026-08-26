"use client";

import { useState } from "react";
import type { MentoringSession } from "@/app/mentor/mentor-store";

interface LiveMentoringProps {
  onAddSession: (session: Omit<MentoringSession, "id">) => void;
  sessions: MentoringSession[];
}

export function LiveMentoring({ onAddSession, sessions }: LiveMentoringProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [link, setLink] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time || !link) return;

    onAddSession({
      title,
      date,
      time,
      link,
    });

    setTitle("");
    setDate("");
    setTime("");
    setLink("");
    alert("Session scheduled successfully!");
  };

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold mb-6 text-content">Live Mentoring Schedule</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-content">Schedule a Session</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-content mb-1">Session Title</label>
              <input
                type="text"
                className="input w-full"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Intro to Next.js"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-content mb-1">Date</label>
                <input
                  type="date"
                  className="input w-full"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-content mb-1">Time</label>
                <input
                  type="time"
                  className="input w-full"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-content mb-1">Meeting Link</label>
              <input
                type="url"
                className="input w-full"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://meet.google.com/..."
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full">
              Schedule Session
            </button>
          </form>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 text-content">Upcoming Sessions</h3>
          {sessions.length === 0 ? (
            <div className="p-4 border border-dashed border-border rounded-lg text-center text-muted">
              No sessions scheduled yet.
            </div>
          ) : (
            <ul className="space-y-3">
              {sessions.map((session) => (
                <li key={session.id} className="p-4 border border-border rounded-lg bg-surface">
                  <h4 className="font-semibold text-content">{session.title}</h4>
                  <div className="text-sm text-muted mt-1 flex flex-col gap-1">
                    <span>📅 {session.date} at {session.time}</span>
                    <a href={session.link} target="_blank" rel="noreferrer" className="text-brand hover:underline truncate">
                      🔗 {session.link}
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
