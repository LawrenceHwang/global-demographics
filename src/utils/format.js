import { LOCALE_MAP } from '../data/constants';

/**
 * Format a population number into a compact string (e.g., "23.3M", "1.41B").
 * Uses English-style suffixes for backward compatibility.
 */
export function formatPop(n) {
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    return `${Math.round(n / 1000)}K`;
}

/**
 * Format a population number using the active locale's conventions.
 * Falls back to compact English if Intl is unavailable.
 */
export function formatPopLocale(n, lang = 'en') {
    const locale = LOCALE_MAP[lang] || 'en-US';
    try {
        return new Intl.NumberFormat(locale, {
            notation: 'compact',
            maximumFractionDigits: 1,
        }).format(n);
    } catch {
        return formatPop(n);
    }
}

/**
 * Compute a clean Y-axis maximum for the population composition chart.
 */
export function computeYAxisMax(maxVal) {
    const m = maxVal / 1e6;
    const steps = [10, 20, 25, 30, 40, 50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 1250, 1500, 2000];
    const found = steps.find(s => s >= m * 1.08);
    return (found || Math.ceil(m * 1.1 / 100) * 100) * 1e6;
}

/**
 * Format a Y-axis label in millions/billions.
 */
export function formatYLabel(millions) {
    if (millions >= 1000) return `${(millions / 1000).toFixed(millions % 1000 === 0 ? 0 : 1)}B`;
    return `${millions % 1 === 0 ? millions : millions.toFixed(0)}M`;
}
