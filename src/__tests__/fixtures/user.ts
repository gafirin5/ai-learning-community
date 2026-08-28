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
  avatarUrl: null,
  role: 'learner' as const, // guest | learner | mentor | admin
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
};

export const mockGuestUser: User = {
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
    uuid: `${i.toString().padStart(8, '0')}-uuid-${i}`,
    email: `user${i}@example.com`,
    name: `Test User ${i + 1}`,
    avatarUrl: null,
    role: (['guest', 'learner', 'mentor', 'admin'] as const)[Math.floor(Math.random() * 4)],
  }));
};
