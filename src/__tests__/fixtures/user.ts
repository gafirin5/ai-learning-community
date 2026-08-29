import { User } from '@/lib/types/user';

/**
 * Mock user data untuk testing
 * Sesuai dengan struktur User type dari src/lib/types/user.ts
 */
export const mockUser: User = {
  id: 1,
  uuid: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: '',
  role: 'learner' as const, // learner | mentor | admin (User.role tidak menerima guest)
  joinedAt: '2026-01-01',
  expertise: [],
  bio: '',
  maxSessionsPerWeek: 10,
};

export const mockAdminUser: User = {
  ...mockUser,
  id: 2,
  uuid: '660e8400-e29b-41d4-a716-446655440001',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin' as const,
};

export const mockMentorUser: User = {
  ...mockUser,
  id: 3,
  uuid: '770e8400-e29b-41d4-a716-446655440002',
  email: 'mentor@example.com',
  name: 'Dr. Mentor AI',
  role: 'mentor' as const,
  expertise: ['Machine Learning'],
  bio: 'Mentor AI untuk testing.',
};

// Role 'guest' ada pada Role global tapi dikecualikan dari User.role,
// jadi mock guest memakai tipe yang sedikit dilonggarkan untuk kebutuhan test.
export type MockGuestUser = Omit<User, 'role'> & { role: 'guest' };

export const mockGuestUser: MockGuestUser = {
  ...mockUser,
  id: 4,
  uuid: '880e8400-e29b-41d4-a716-446655440003',
  email: 'guest@example.com',
  name: 'Guest User',
  role: 'guest' as const,
};

/**
 * Generate array of mock users untuk testing lists
 */
export const generateMockUsers = (count: number): User[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    uuid: `880e8400-e29b-41d4-a716-4466${i.toString().padStart(8, '0')}`,
    email: `user${i}@example.com`,
    name: `Test User ${i + 1}`,
    avatarUrl: '',
    role: (['learner', 'mentor', 'admin'] as const)[i % 3],
    joinedAt: '2026-01-01',
    expertise: [],
    bio: '',
    maxSessionsPerWeek: 10,
  }));
};
