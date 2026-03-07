import { describe, it, expect } from 'vitest';
import { formatPop, formatPopLocale, computeYAxisMax, formatYLabel } from './format';

describe('formatPop', () => {
    it('formats billions', () => {
        expect(formatPop(1_400_000_000)).toBe('1.40B');
        expect(formatPop(2_500_000_000)).toBe('2.50B');
    });

    it('formats millions', () => {
        expect(formatPop(23_300_000)).toBe('23.3M');
        expect(formatPop(1_500_000)).toBe('1.5M');
    });

    it('formats thousands', () => {
        expect(formatPop(500_000)).toBe('500K');
        expect(formatPop(50_000)).toBe('50K');
    });

    it('handles zero', () => {
        expect(formatPop(0)).toBe('0K');
    });
});

describe('formatPopLocale', () => {
    it('formats with English locale', () => {
        const result = formatPopLocale(23_300_000, 'en');
        expect(result).toBeTruthy();
        expect(typeof result).toBe('string');
    });

    it('formats with Chinese locale', () => {
        const result = formatPopLocale(23_300_000, 'zh');
        expect(result).toBeTruthy();
    });

    it('handles unknown locale gracefully', () => {
        const result = formatPopLocale(23_300_000, 'xx');
        expect(result).toBeTruthy();
    });
});

describe('computeYAxisMax', () => {
    it('returns a clean step value above the input', () => {
        const result = computeYAxisMax(23_300_000);
        expect(result).toBeGreaterThanOrEqual(23_300_000);
        expect(result % 1e6).toBe(0); // should be a whole million
    });

    it('handles large populations', () => {
        const result = computeYAxisMax(1_400_000_000);
        expect(result).toBeGreaterThanOrEqual(1_400_000_000);
    });

    it('handles small populations', () => {
        const result = computeYAxisMax(5_000_000);
        expect(result).toBeGreaterThanOrEqual(5_000_000);
    });
});

describe('formatYLabel', () => {
    it('formats millions', () => {
        expect(formatYLabel(100)).toBe('100M');
        expect(formatYLabel(25)).toBe('25M');
    });

    it('formats billions', () => {
        expect(formatYLabel(1000)).toBe('1B');
        expect(formatYLabel(1500)).toBe('1.5B');
    });
});
