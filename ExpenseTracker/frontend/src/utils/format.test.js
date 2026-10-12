import { describe, expect, it } from 'vitest';
import { budgetColor } from './budget';
import { formatCurrency, monthLabel, parseMonthInput, toDateInput, toMonthInput } from './format';

describe('format utils', () => {
  it('formats currency using the chosen currency', () => {
    expect(formatCurrency(1234.5, 'USD')).toBe('$1,234.50');
    expect(formatCurrency(1234.5, 'INR')).toContain('1,234.50');
  });

  it('builds month labels', () => {
    expect(monthLabel(2026, 10)).toBe('Oct 2026');
  });

  it('formats dates for native inputs', () => {
    const d = new Date(2026, 0, 5);
    expect(toDateInput(d)).toBe('2026-01-05');
    expect(toMonthInput(d)).toBe('2026-01');
  });

  it('parses month input values', () => {
    expect(parseMonthInput('2026-10')).toEqual({ year: 2026, month: 10 });
    expect(parseMonthInput('')).toBeNull();
    expect(parseMonthInput('2026-13')).toBeNull();
  });

  it('chooses budget colours by usage', () => {
    expect(budgetColor(40)).toBe('success');
    expect(budgetColor(85)).toBe('warning');
    expect(budgetColor(100)).toBe('warning');
    expect(budgetColor(101)).toBe('error');
  });
});
