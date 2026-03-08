import { describe, expect, it } from 'vitest';
import { DEP_RATIO_CHART_NULL_FALLBACK, formatDepRatio, getNumericDepRatioForCharts } from './metrics';

describe('formatDepRatio', () => {
    it('formats finite dependency ratios to one decimal place', () => {
        expect(formatDepRatio(63.456)).toBe('63.5');
    });

    it('returns localized fallback text for null ratios', () => {
        expect(formatDepRatio(null, key => ({ depRatioUnavailable: 'No workforce' }[key] || key))).toBe('No workforce');
    });
});

describe('getNumericDepRatioForCharts', () => {
    it('returns finite ratios unchanged', () => {
        expect(getNumericDepRatioForCharts(72.4)).toBe(72.4);
    });

    it('returns the chart fallback for null ratios', () => {
        expect(getNumericDepRatioForCharts(null)).toBe(DEP_RATIO_CHART_NULL_FALLBACK);
    });
});