import { describe, it, expect } from 'vitest';
import { todayKey } from '@/lib/utils/date';

describe('todayKey utility', () => {
  it('should return current date in YYYY-MM-DD format', () => {
    const result = todayKey();
    
    // Verify format (must be 10 characters with separators)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    
    // Verify it's the current date by checking components
    const now = new Date();
    const [year, month, day] = result.split('-').map(Number);
    
    expect(year).toBe(now.getFullYear());
    expect(month).toBe(now.getMonth() + 1); // getMonth() returns 0-based
    expect(day).toBe(now.getDate());
  });
  
  it('should be consistent within same day', () => {
    const key1 = todayKey();
    const key2 = todayKey();
    const key3 = todayKey();
    
    expect(key1).toBe(key2);
    expect(key2).toBe(key3);
  });
});
