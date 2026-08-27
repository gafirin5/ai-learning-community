export type NotificationType = "forum_reply" | "achievement" | "certificate" | "system";

export interface AppNotification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: string;
}
