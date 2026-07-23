import { describe, it, expect } from 'vitest';
import { parseDate, fmtDate, overlaps, formatRange, startOfToday } from '../dates';

describe('parseDate', () => {
  it('reads year/month/day as local components, not UTC', () => {
    const d = parseDate('2026-07-23');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(6); // 0-indexed
    expect(d.getDate()).toBe(23);
    expect(d.getHours()).toBe(0);
  });

  it('handles single-digit months and days', () => {
    const d = parseDate('2026-01-05');
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(5);
  });
});

describe('fmtDate', () => {
  it('round-trips with parseDate', () => {
    expect(fmtDate(parseDate('2026-07-23'))).toBe('2026-07-23');
    expect(fmtDate(parseDate('2026-01-05'))).toBe('2026-01-05');
  });

  it('zero-pads single-digit month and day', () => {
    const d = new Date(2026, 0, 5);
    expect(fmtDate(d)).toBe('2026-01-05');
  });
});

describe('overlaps', () => {
  it('detects a clear overlap', () => {
    const a1 = parseDate('2026-07-01');
    const a2 = parseDate('2026-07-10');
    const b1 = parseDate('2026-07-05');
    const b2 = parseDate('2026-07-15');
    expect(overlaps(a1, a2, b1, b2)).toBe(true);
  });

  it('treats touching ranges (same boundary day) as overlapping', () => {
    const a1 = parseDate('2026-07-01');
    const a2 = parseDate('2026-07-10');
    const b1 = parseDate('2026-07-10');
    const b2 = parseDate('2026-07-15');
    expect(overlaps(a1, a2, b1, b2)).toBe(true);
  });

  it('returns false for ranges with a gap between them', () => {
    const a1 = parseDate('2026-07-01');
    const a2 = parseDate('2026-07-05');
    const b1 = parseDate('2026-07-10');
    const b2 = parseDate('2026-07-15');
    expect(overlaps(a1, a2, b1, b2)).toBe(false);
  });
});

describe('formatRange', () => {
  it('shows a single date when start and end are the same', () => {
    const result = formatRange('2026-07-23', '2026-07-23');
    expect(result).not.toContain('→');
  });

  it('shows both dates separated by an arrow otherwise', () => {
    const result = formatRange('2026-07-23', '2026-07-28');
    expect(result).toContain('→');
  });
});

describe('startOfToday', () => {
  it('zeroes out the time so same-day comparisons work', () => {
    const t = startOfToday();
    expect(t.getHours()).toBe(0);
    expect(t.getMinutes()).toBe(0);
    expect(t.getSeconds()).toBe(0);
    const now = new Date();
    expect(t.getFullYear()).toBe(now.getFullYear());
    expect(t.getMonth()).toBe(now.getMonth());
    expect(t.getDate()).toBe(now.getDate());
  });
});
