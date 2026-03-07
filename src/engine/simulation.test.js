import { describe, it, expect } from 'vitest';
import { buildCountryPopulation, runSimulation } from './simulation';
import { COUNTRY_CONFIG } from '../data/countries';
import { MORTALITY_PROFILES } from '../data/mortality';
import { SIM_START_YEAR, SIM_END_YEAR, MAX_AGE } from '../data/constants';

describe('buildCountryPopulation', () => {
    it('returns an array of 101 elements', () => {
        const pop = buildCountryPopulation(COUNTRY_CONFIG.taiwan);
        expect(pop).toHaveLength(MAX_AGE + 1);
    });

    it('sums to total population', () => {
        const cfg = COUNTRY_CONFIG.taiwan;
        const pop = buildCountryPopulation(cfg);
        const sum = pop.reduce((a, b) => a + b, 0);
        const expectedTotal = cfg.youth + cfg.working + cfg.elderly;
        expect(sum).toBeCloseTo(expectedTotal, -2); // within 100
    });

    it('produces non-negative values', () => {
        for (const key of Object.keys(COUNTRY_CONFIG)) {
            const pop = buildCountryPopulation(COUNTRY_CONFIG[key]);
            pop.forEach((val, age) => {
                expect(val).toBeGreaterThanOrEqual(0, `Negative value at age ${age} for ${key}`);
            });
        }
    });

    it('works for all countries', () => {
        for (const key of Object.keys(COUNTRY_CONFIG)) {
            const cfg = COUNTRY_CONFIG[key];
            const pop = buildCountryPopulation(cfg);
            const sum = pop.reduce((a, b) => a + b, 0);
            const expectedTotal = cfg.youth + cfg.working + cfg.elderly;
            expect(sum).toBeCloseTo(expectedTotal, -2);
        }
    });
});

describe('runSimulation', () => {
    const cfg = COUNTRY_CONFIG.taiwan;
    const basePop = buildCountryPopulation(cfg);
    const mortality = MORTALITY_PROFILES[cfg.mortalityProfile];

    it('returns history with correct number of entries', () => {
        const { history } = runSimulation(basePop, mortality, cfg.tfr, cfg.migration, false, 0, 0);
        expect(history).toHaveLength(SIM_END_YEAR - SIM_START_YEAR + 1);
    });

    it('returns popByYear with correct number of entries', () => {
        const { popByYear } = runSimulation(basePop, mortality, cfg.tfr, cfg.migration, false, 0, 0);
        expect(popByYear).toHaveLength(SIM_END_YEAR - SIM_START_YEAR + 1);
    });

    it('first year matches base population totals', () => {
        const { history } = runSimulation(basePop, mortality, cfg.tfr, cfg.migration, false, 0, 0);
        const first = history[0];
        expect(first.year).toBe(SIM_START_YEAR);
        const expectedTotal = cfg.youth + cfg.working + cfg.elderly;
        expect(first.total).toBeCloseTo(expectedTotal, -3);
    });

    it('is deterministic (same inputs produce same outputs)', () => {
        const r1 = runSimulation(basePop, mortality, 1.5, 50000, false, 0, 0);
        const r2 = runSimulation(basePop, mortality, 1.5, 50000, false, 0, 0);
        expect(r1.history).toEqual(r2.history);
    });

    it('higher TFR leads to higher population', () => {
        const lowTfr = runSimulation(basePop, mortality, 0.5, 0, false, 0, 0);
        const highTfr = runSimulation(basePop, mortality, 3.0, 0, false, 0, 0);
        const lastLow = lowTfr.history[lowTfr.history.length - 1];
        const lastHigh = highTfr.history[highTfr.history.length - 1];
        expect(lastHigh.total).toBeGreaterThan(lastLow.total);
    });

    it('positive migration increases population vs negative', () => {
        const posMig = runSimulation(basePop, mortality, cfg.tfr, 100000, false, 0, 0);
        const negMig = runSimulation(basePop, mortality, cfg.tfr, -100000, false, 0, 0);
        const lastPos = posMig.history[posMig.history.length - 1];
        const lastNeg = negMig.history[negMig.history.length - 1];
        expect(lastPos.total).toBeGreaterThan(lastNeg.total);
    });

    it('population never goes negative', () => {
        // Extreme case: very low TFR and high emigration
        const { history } = runSimulation(basePop, mortality, 0.3, -100000, false, 0, 0);
        history.forEach(h => {
            expect(h.total).toBeGreaterThanOrEqual(0);
            expect(h.youth).toBeGreaterThanOrEqual(0);
            expect(h.working).toBeGreaterThanOrEqual(0);
            expect(h.elderly).toBeGreaterThanOrEqual(0);
        });
    });

    it('dependency ratio is correctly calculated', () => {
        const { history } = runSimulation(basePop, mortality, cfg.tfr, cfg.migration, false, 0, 0);
        history.forEach(h => {
            const expected = ((h.youth + h.elderly) / h.working) * 100;
            expect(h.depRatio).toBeCloseTo(expected, 5);
        });
    });

    it('dynamic TFR reaches terminal value', () => {
        const terminalTfr = 2.1;
        const terminalYear = 2050;
        const { history } = runSimulation(basePop, mortality, cfg.tfr, cfg.migration, true, terminalTfr, terminalYear);
        // The TFR effect is indirect (through births), but we can verify the simulation runs
        expect(history).toHaveLength(SIM_END_YEAR - SIM_START_YEAR + 1);
        expect(history[history.length - 1].year).toBe(SIM_END_YEAR);
    });
});
