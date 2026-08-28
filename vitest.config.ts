import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/app/',
        '**/layout.tsx',
        '**/page.tsx',
        '**/not-found.tsx',
        '**/error.tsx',
        '**/loading.tsx',
      ],
      reportsDirectory: './coverage',
    },
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['src/app/**', 'src/components/ui/**'],
    testTimeout: 10000,
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
