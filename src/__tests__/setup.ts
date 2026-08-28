import '@testing-library/jest-dom';

// Extend Jest/DOM matchers for better test assertions
// See: https://testing-library.com/docs/react-testing-library/setup/#custom-matchers

// Optional: Set up test timeout globally (Vitest API)
beforeAll(() => {
  // Increase timeout for slow tests if needed
  // Vitest uses different timeout mechanism than Jest
});

// Mock console.error for cleaner test output (optional)
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = (...args: any[]) => {
    // Filter out React warnings that are expected in tests
    const message = args.join(' ');
    if (!message.includes('Warning:') || !message.includes('Strict mode')) {
      originalConsoleError(...args);
    }
  };
});

afterEach(() => {
  console.error = originalConsoleError;
});
