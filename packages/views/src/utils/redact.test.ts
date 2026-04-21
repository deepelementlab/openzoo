import { describe, it, expect } from 'vitest';

function redactSensitiveInfo(text: string): string {
  const patterns = [
    { re: /\bsk-[A-Za-z0-9_-]{20,}\b/g, replacement: '[REDACTED API KEY]' },
    { re: /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}\b/g, replacement: '[REDACTED GITHUB TOKEN]' },
    { re: /\bAKIA[0-9A-Z]{16}\b/g, replacement: '[REDACTED AWS KEY]' },
  ];
  let result = text;
  for (const { re, replacement } of patterns) {
    result = result.replace(re, replacement);
  }
  return result;
}

describe('redactSensitiveInfo', () => {
  it('redacts OpenAI API keys', () => {
    const input = 'Using key sk-proj-abc123def456ghi789jkl for requests';
    const result = redactSensitiveInfo(input);
    expect(result).not.toContain('sk-proj-abc123');
    expect(result).toContain('[REDACTED API KEY]');
  });

  it('redacts GitHub tokens', () => {
    const input = 'export GITHUB_TOKEN=ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmn';
    const result = redactSensitiveInfo(input);
    expect(result).not.toContain('ghp_');
    expect(result).toContain('[REDACTED GITHUB TOKEN]');
  });

  it('redacts AWS keys', () => {
    const input = 'Found AKIAIOSFODNN7EXAMPLE in config';
    const result = redactSensitiveInfo(input);
    expect(result).not.toContain('AKIAIOSFODNN7EXAMPLE');
    expect(result).toContain('[REDACTED AWS KEY]');
  });

  it('does not redact normal text', () => {
    const input = 'This is a normal commit message about fixing a bug';
    expect(redactSensitiveInfo(input)).toBe(input);
  });

  it('handles multiple secrets in one string', () => {
    const input = 'Keys: sk-proj-abc123def456ghi789 and AKIAIOSFODNN7EXAMPLE';
    const result = redactSensitiveInfo(input);
    expect(result).not.toContain('sk-proj');
    expect(result).not.toContain('AKIA');
  });
});
