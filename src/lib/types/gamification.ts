export interface Badge {
  id: string;
  label: string;
  emoji: string;
  description: string;
}

export interface Certificate {
  id: string;
  userId: number;
  courseId: number;
  issuedAt: string;
  courseTitle: string;
}
