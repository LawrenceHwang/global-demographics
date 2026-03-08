import { describe, expect, it } from 'vitest';
import { SIM_END_YEAR, SIM_START_YEAR } from '../data/constants';
import { getClampedYearIndex } from './useSimulation';

describe('getClampedYearIndex', () => {
    const length = SIM_END_YEAR - SIM_START_YEAR + 1;

    it('clamps years below SIM_START_YEAR to first index', () => {
        expect(getClampedYearIndex(SIM_START_YEAR - 10, length)).toBe(0);
    });

    it('clamps years above SIM_END_YEAR to final index', () => {
        expect(getClampedYearIndex(SIM_END_YEAR + 10, length)).toBe(length - 1);
    });

    it('maps in-range years to expected index', () => {
        expect(getClampedYearIndex(SIM_START_YEAR, length)).toBe(0);
        expect(getClampedYearIndex(SIM_START_YEAR + 25, length)).toBe(25);
        expect(getClampedYearIndex(SIM_END_YEAR, length)).toBe(length - 1);
    });
});
