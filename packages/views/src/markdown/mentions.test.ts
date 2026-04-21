import { describe, it, expect } from 'vitest';
import { preprocessMentionShortcodes } from '@openzoo/ui/components/markdown/mentions';

describe('preprocessMentionShortcodes', () => {
  it('returns text unchanged when no shortcodes present', () => {
    const text = 'Hello world, this is a normal comment.';
    expect(preprocessMentionShortcodes(text)).toBe(text);
  });

  it('converts legacy mention shortcode to markdown link', () => {
    const input = '[@ id="user-123" label="John"] assigned this issue';
    const result = preprocessMentionShortcodes(input);
    expect(result).toBe('[@John](mention://member/user-123) assigned this issue');
  });

  it('handles multiple shortcodes', () => {
    const input = '[@ id="u1" label="Alice"] and [@ id="u2" label="Bob"]';
    const result = preprocessMentionShortcodes(input);
    expect(result).toBe('[@Alice](mention://member/u1) and [@Bob](mention://member/u2)');
  });

  it('returns unchanged if id or label missing', () => {
    const input = '[@ label="NoId"] and [@ id="no-label"]';
    const result = preprocessMentionShortcodes(input);
    expect(result).toBe(input);
  });
});
