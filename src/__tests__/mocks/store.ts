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
    chatQuota: 20,
    threads: [],
    comments: [],
    savedThreadIds: [],
    reports: [],
    projects: [],
    projectComments: [],
    votes: { threads: new Map(), comments: new Map(), projects: new Map() },
    reactions: { threads: new Map(), comments: new Map() },
    myReactions: { threads: new Map(), comments: new Map() },
    interests: [],
    recentlyViewed: [],
    bookmarks: [],
    activity: { streak: 0, lastActiveDate: null },
    notifications: [],
    certificates: [],
    points: 0,
    badges: [],
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
};

// Mock provider component
import { RenderResult, render } from '@testing-library/react';
import { ReactElement, ReactRendererOptions } from '@testing-library/react/lib/pure';

interface CustomRenderOptions extends Omit<ReactRendererOptions, 'wrapper'> {
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
