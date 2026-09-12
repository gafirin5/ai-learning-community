import { StoreContextValue } from '@/lib/store/context';

/**
 * Mock Store context untuk testing components yang membutuhkan useStore()
 */

export const mockStore: StoreContextValue = {
  state: {
    currentUserId: 1,
    users: [],
    courses: [],
    lessons: [],
    quizzes: [],
    seeded: false,
    progress: [],
    chat: [],
    chatQuota: { date: '2024-01-01', used: 0 },
    threads: [],
    comments: [],
    savedThreadIds: [],
    reports: [],
    projects: [],
    projectComments: [],
    votes: { threads: {}, comments: {}, projects: {} },
    reactions: { threads: {}, comments: {} },
    myReactions: { threads: {}, comments: {} },
    interests: [],
    recentlyViewed: [],
    bookmarks: [],
    activity: { streak: 0, lastActiveDate: '' },
    notifications: [],
    certificates: [],
    points: 0,
    badges: [],
    mentoringSessions: [],
    mentorReviews: [],
    mentorAvailability: [],
  },
  currentUser: null,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  setInterests: vi.fn(),
  markLessonDone: vi.fn(),
  saveQuizScore: vi.fn(),
  getLessonProgress: vi.fn(),
  courseProgressPercent: vi.fn(),
  touchLesson: vi.fn(),
  toggleBookmark: vi.fn(),
  nextLesson: vi.fn(),
  sendChat: vi.fn(),
  getChat: vi.fn(),
  clearChat: vi.fn(),
  addThread: vi.fn(),
  addComment: vi.fn(),
  voteThread: vi.fn(),
  voteComment: vi.fn(),
  viewThread: vi.fn(),
  toggleSaveThread: vi.fn(),
  markAccepted: vi.fn(),
  editThread: vi.fn(),
  deleteThread: vi.fn(),
  editComment: vi.fn(),
  deleteComment: vi.fn(),
  pinThread: vi.fn(),
  reactTo: vi.fn(),
  reportThread: vi.fn(),
  reportComment: vi.fn(),
  resolveReport: vi.fn(),
  hideThread: vi.fn(),
  hideComment: vi.fn(),
  deleteReport: vi.fn(),
  addProject: vi.fn(),
  addProjectComment: vi.fn(),
  voteProject: vi.fn(),
  addUser: vi.fn(),
  setUserRole: vi.fn(),
  deleteUser: vi.fn(),
  addCourse: vi.fn(),
  editCourse: vi.fn(),
  deleteCourse: vi.fn(),
  addLesson: vi.fn(),
  editLesson: vi.fn(),
  deleteLesson: vi.fn(),
  saveQuiz: vi.fn(),
  deleteQuiz: vi.fn(),
  editProject: vi.fn(),
  deleteProject: vi.fn(),
  deleteProjectComment: vi.fn(),
  addNotification: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllRead: vi.fn(),
  deleteNotification: vi.fn(),
  clearRead: vi.fn(),
  awardPoints: vi.fn(),
  issueCertificate: vi.fn(),
  syncBadges: vi.fn(),
  createBooking: vi.fn(),
  updateBookingStatus: vi.fn(),
  submitReview: vi.fn(),
  saveAvailability: vi.fn(),
  refreshMentorSessions: vi.fn(),
  getAvailableSlots: vi.fn(),
};

// Mock provider component
import { RenderOptions, RenderResult, render } from '@testing-library/react';
import { ReactElement } from 'react';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  store?: StoreContextValue;
}

function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  // Note: Full StoreProvider mock would need more setup, using simplified version for now
  return render(ui, options);
}

export * from '@testing-library/react';
export { customRender as render };
