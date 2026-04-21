import { describe, it, expect } from 'vitest';
import { preprocessLinks, hasLinks } from '@openzoo/ui/components/markdown/linkify';

describe('preprocessLinks', () => {
  it('returns text unchanged when no links present', () => {
    const text = 'Hello world, no links here.';
    expect(preprocessLinks(text)).toBe(text);
  });

  it('converts bare URLs to markdown links', () => {
    const text = 'Visit https://example.com for details.';
    const result = preprocessLinks(text);
    expect(result).toBe('Visit [https://example.com](https://example.com) for details.');
  });

  it('skips URLs inside code blocks', () => {
    const text = '```\nhttps://example.com\n```';
    const result = preprocessLinks(text);
    expect(result).toBe(text);
  });

  it('skips URLs inside inline code', () => {
    const text = 'Use `https://example.com` in code.';
    const result = preprocessLinks(text);
    expect(result).toBe(text);
  });

  it('skips already linked URLs', () => {
    const text = '[click here](https://example.com)';
    const result = preprocessLinks(text);
    expect(result).toBe(text);
  });

  it('handles multiple URLs', () => {
    const text = 'See https://a.com and https://b.com';
    const result = preprocessLinks(text);
    expect(result).toContain('[https://a.com](https://a.com)');
    expect(result).toContain('[https://b.com](https://b.com)');
  });
});

describe('hasLinks', () => {
  it('returns true for text with URLs', () => {
    expect(hasLinks('Visit https://example.com')).toBe(true);
  });

  it('returns false for plain text', () => {
    expect(hasLinks('Just plain text')).toBe(false);
  });
});
