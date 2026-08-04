import { __testing } from './logger';

const { redact } = __testing;

describe('logger redaction', () => {
  it('redacts sensitive keys regardless of casing', () => {
    expect(
      redact({ accessToken: 'abc', Authorization: 'Bearer x', name: 'Asit' }),
    ).toEqual({
      accessToken: '[redacted]',
      Authorization: '[redacted]',
      name: 'Asit',
    });
  });

  it('redacts health data nested inside arrays and objects', () => {
    expect(
      redact({ records: [{ diagnosis: 'confidential', date: '2026-01-01' }] }),
    ).toEqual({
      records: [{ diagnosis: '[redacted]', date: '2026-01-01' }],
    });
  });

  it('serialises Errors instead of dropping them to an empty object', () => {
    const result = redact(new Error('boom')) as {
      name: string;
      message: string;
    };

    expect(result.name).toBe('Error');
    expect(result.message).toBe('boom');
  });

  it('stops at max depth so a cyclic graph cannot hang the logger', () => {
    const root: Record<string, unknown> = {};
    let node = root;
    for (let i = 0; i < 20; i += 1) {
      const child: Record<string, unknown> = {};
      node.child = child;
      node = child;
    }

    expect(() => redact(root)).not.toThrow();
    expect(JSON.stringify(redact(root))).toContain('[max depth]');
  });

  it('passes primitives through untouched', () => {
    expect(redact('hello')).toBe('hello');
    expect(redact(42)).toBe(42);
    expect(redact(null)).toBeNull();
  });
});
