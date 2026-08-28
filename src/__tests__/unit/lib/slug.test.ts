import { describe, it, expect } from 'vitest';
import { slugify } from '@/lib/utils/slug';

describe('slugify utility', () => {
  it('should convert title to URL-friendly slug', () => {
    expect(slugify('Machine Learning Basics')).toBe('machine-learning-basics');
    expect(slugify('Deep Learning Fundamentals')).toBe('deep-learning-fundamentals');
  });
  
  it('should handle unicode characters by removing them', () => {
    expect(slugify('Belajar AI & ML')).toBe('belajar-ai-ml');
    expect(slugify('Coding Python 💻')).toBe('coding-python');
  });
  
  it('should convert multiple spaces to single dash', () => {
    expect(slugify('ML   Deep    Learning')).toBe('ml-deep-learning');
  });
  
  it('should trim leading/trailing dashes', () => {
    expect(slugify('- Machine - Learning - ')).toBe('machine-learning');
  });
  
  it('should lowercase all characters', () => {
    expect(slugify('MACHINE LEARNING')).toBe('machine-learning');
    expect(slugify('MiXeD CaSe')).toBe('mixed-case');
  });
  
  it('should truncate to 60 characters maximum', () => {
    const longTitle = 'A'.repeat(100);
    const result = slugify(longTitle);
    expect(result.length).toBeLessThanOrEqual(60);
    expect(result.endsWith('a')); // Ends with 'a' character not dash
  });
  
  it('should return default "kursus" for empty strings', () => {
    expect(slugify('')).toBe('kursus');
    expect(slugify('   ')).toBe('kursus');
    expect(slugify('-_-')).toBe('kursus');
  });
  
  it('should handle special characters properly', () => {
    expect(slugify('AI/ML & Data Science!')).toBe('ai-ml-data-science');
    expect(slugify('Python (with Examples)')).toBe('python-with-examples');
    expect(slugify('Cost: $100 & Time: 2 weeks')).toBe('cost-100-time-2-weeks');
  });
});
