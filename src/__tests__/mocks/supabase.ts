import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Mock Supabase client untuk testing
 * Menghindari panggilan ke server Supabase real saat unit testing
 */

interface MockSupabaseService {
  from: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  neq: ReturnType<typeof vi.fn>;
  gt: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  lt: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  like: ReturnType<typeof vi.fn>;
  ilike: ReturnType<typeof vi.fn>;
  contains: ReturnType<typeof vi.fn>;
  match: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  throwOnError: ReturnType<typeof vi.fn>;
}

/**
 * Create fully mocked Supabase client with method chaining
 * Usage:
 * ```typescript
 * const supabase = createMockSupabase()
 * await supabase.from('users').select().eq('id', 1).single()
 * ```
 */
export const createMockSupabase = (): SupabaseClient => {
  // Helper untuk membuat mocked methods dengan chaining
  const mockMethod = <T extends (...args: any[]) => any>(fn: T): T => {
    return vi.fn(() => {
      // Return mock chain object for further chaining
      return {
        from: mockMethod(() => ({}) as any),
        select: mockMethod(() => ({}) as any),
        insert: mockMethod(() => ({}) as any),
        update: mockMethod(() => ({}) as any),
        delete: mockMethod(() => ({}) as any),
        eq: mockMethod(() => ({}) as any),
        neq: mockMethod(() => ({}) as any),
        gt: mockMethod(() => ({}) as any),
        gte: mockMethod(() => ({}) as any),
        lt: mockMethod(() => ({}) as any),
        lte: mockMethod(() => ({}) as any),
        in: mockMethod(() => ({}) as any),
        like: mockMethod(() => ({}) as any),
        ilike: mockMethod(() => ({}) as any),
        contains: mockMethod(() => ({}) as any),
        match: mockMethod(() => ({}) as any),
        order: mockMethod(() => ({}) as any),
        limit: mockMethod(() => ({}) as any),
        range: mockMethod(() => ({}) as any),
        single: mockMethod(() => Promise.resolve({ data: null, error: null })) as any,
        maybeSingle: mockMethod(() => Promise.resolve({ data: null, error: null })) as any,
        throwOnError: mockMethod(() => ({}) as any),
        then: mockMethod((resolve: any) => resolve(null)) as any,
      };
    }) as T;
  };

  return {
    rpc: mockMethod(() => Promise.resolve({ data: null, error: null })) as any,
    channel: mockMethod(() => ({}) as any),
    removeChannel: mockMethod(() => true) as any,
    function: mockMethod(() => ({}) as any),
    storage: {
      bucket: mockMethod(() => ({}) as any),
      list: mockMethod(() => Promise.resolve({ data: [], error: null })) as any,
      upload: mockMethod(() => Promise.resolve({ data: {}, error: null })) as any,
      download: mockMethod(() => Promise.resolve({ data: null, error: null })) as any,
      remove: mockMethod(() => Promise.resolve({ data: [], error: null })) as any,
      createSignedUrl: mockMethod(() => Promise.resolve({ data: { signedUrl: '' }, error: null })) as any,
      createSignedUrls: mockMethod(() => Promise.resolve({ data: [], error: null })) as any,
      createBackupCopy: mockMethod(() => Promise.resolve({ data: {}, error: null })) as any,
      move: mockMethod(() => Promise.resolve({ data: {}, error: null })) as any,
      copy: mockMethod(() => Promise.resolve({ data: {}, error: null })) as any,
      sign: mockMethod(() => Promise.resolve({ data: {}, error: null })) as any,
      update: mockMethod(() => Promise.resolve({ data: {}, error: null })) as any,
      list_buckets: mockMethod(() => Promise.resolve({ data: [], error: null })) as any,
      create_bucket: mockMethod(() => Promise.resolve({ data: {}, error: null })) as any,
      delete_bucket: mockMethod(() => Promise.resolve({ data: {}, error: null })) as any,
    } as any,
    auth: {
      signUp: mockMethod(() => Promise.resolve({ data: null, error: null })) as any,
      signInWithPassword: mockMethod(() => Promise.resolve({ data: null, error: null })) as any,
      signInWithOAuth: mockMethod(() => Promise.resolve({ data: null, error: null })) as any,
      signInWithMagicLink: mockMethod(() => Promise.resolve({ data: null, error: null })) as any,
      signInAnonymously: mockMethod(() => Promise.resolve({ data: null, error: null })) as any,
      getSession: mockMethod(() => Promise.resolve({ data: null, error: null })) as any,
      refreshSession: mockMethod(() => Promise.resolve({ data: null, error: null })) as any,
      signOut: mockMethod(() => Promise.resolve({ data: null, error: null })) as any,
      resetPasswordForEmail: mockMethod(() => Promise.resolve({ data: null, error: null })) as any,
      resetPasswordByEmail: mockMethod(() => Promise.resolve({ data: null, error: null })) as any,
      changePassword: mockMethod(() => Promise.resolve({ data: null, error: null })) as any,
      cancelSignup: mockMethod(() => Promise.resolve({ data: null, error: null })) as any,
      updateUser: mockMethod(() => Promise.resolve({ data: null, error: null })) as any,
      deleteUser: mockMethod(() => Promise.resolve({ data: null, error: null })) as any,
      retrieveUser: mockMethod(() => Promise.resolve({ data: null, error: null })) as any,
      setCookieRedirect: mockMethod(() => ({}) as any),
      linkIdentity: mockMethod(() => Promise.resolve({ data: null, error: null })) as any,
      oAuthProvider: {
        getCodeChallengeMethod: mockMethod(() => 'S256'),
        getProviderConfig: mockMethod(() => ({})),
      },
    } as any,
    onAuthStateChange: mockMethod(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
      error: null,
    })) as any,
  } as unknown as SupabaseClient;
};

/**
 * Default mock instance yang bisa digunakan langsung
 */
export const mockSupabase = createMockSupabase();

// Auto-mock for import compatibility
vi.mock('@/lib/supabase', () => ({
  getSupabase: () => mockSupabase,
  isSupabaseConfigured: () => false, // Force fallback mode in tests
}));
