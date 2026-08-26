import { Metadata } from "next";
import { MentorDashboard } from "@/components/mentor/Dashboard";

export const metadata: Metadata = {
  title: "Mentor Hub | AI Learning Community",
  description: "Dashboard for mentors to create courses, quizzes, and manage live sessions.",
};

export default function MentorPage() {
  return (
    <div className="container-app py-8">
      <MentorDashboard />
    </div>
  );
}
