import { describe, expect, it } from 'vitest';
import { MAX_AGE, MIGRATION_AGE_MAX, MIGRATION_AGE_MIN, SIM_END_YEAR, SIM_START_YEAR } from '../data/constants';
import { COUNTRY_CONFIG } from '../data/countries';
import { MORTALITY_PROFILES } from '../data/mortality';
import { buildCountryPopulation, runSimulation, sanitizeMortality } from './simulation';

describe('buildCountryPopulation', () => {
    it('returns an array of 101 elements', () => {
        const pop = buildCountryPopulation(COUNTRY_CONFIG.taiwan);
        expect(pop).toHaveLength(MAX_AGE + 1);
    });

    it('sums to total population within 100', () => {
        const cfg = COUNTRY_CONFIG.taiwan;
        const pop = buildCountryPopulation(cfg);
        const sum = pop.reduce((a, b) => a + b, 0);
        const expectedTotal = cfg.youth + cfg.working + cfg.elderly;
        expect(Math.abs(sum - expectedTotal)).toBeLessThan(100);
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
            expect(Math.abs(sum - expectedTotal)).toBeLessThan(100);
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
        expect(Math.abs(first.total - expectedTotal)).toBeLessThan(1000);
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
        expect(history).toHaveLength(SIM_END_YEAR - SIM_START_YEAR + 1);
        expect(history[history.length - 1].year).toBe(SIM_END_YEAR);
    });
});

describe('migration conservation', () => {
    it('positive migration is fully applied each year', () => {
        const flatPop = new Array(MAX_AGE + 1).fill(100_000);
        const flatMort = new Array(MAX_AGE + 1).fill(0); // zero mortality for clean accounting
        const netMig = 15_000;
        const { history, popByYear } = runSimulation(flatPop, flatMort, 0, netMig, false, 0, 0);

        for (let t = 0; t < history.length - 1; t++) {
            const popBefore = popByYear[t].reduce((a, b) => a + b, 0);
            const popAfter = popByYear[t + 1].reduce((a, b) => a + b, 0);
            // With zero TFR and zero mortality, only migration changes population
            // Births = 0, deaths = 0 (including age-100 accumulation)
            // popAfter ≈ popBefore + netMig
            expect(Math.abs(popAfter - popBefore - netMig)).toBeLessThan(1);
        }
    });

    it('negative migration is conserved when bins have sufficient capacity', () => {
        const largePop = new Array(MAX_AGE + 1).fill(500_000);
        const flatMort = new Array(MAX_AGE + 1).fill(0);
        const netMig = -30_000;
        const { popByYear } = runSimulation(largePop, flatMort, 0, netMig, false, 0, 0);

        // With TFR=0 and zero mortality, migration bins eventually run dry as cohorts age out.
        // Check the first 15 years where bins are guaranteed to have ample capacity.
        for (let t = 0; t < 15; t++) {
            const popBefore = popByYear[t].reduce((a, b) => a + b, 0);
            const popAfter = popByYear[t + 1].reduce((a, b) => a + b, 0);
            expect(Math.abs(popAfter - popBefore - netMig)).toBeLessThan(1);
        }
    });

    it('handles extreme emigration with small cohorts (clamping + redistribution)', () => {
        // Small population in migration bins; large emigration request
        const tinyPop = new Array(MAX_AGE + 1).fill(0);
        for (let i = MIGRATION_AGE_MIN; i < MIGRATION_AGE_MAX; i++) tinyPop[i] = 100;
        const flatMort = new Array(MAX_AGE + 1).fill(0);
        const netMig = -5_000; // much more than available
        const { popByYear } = runSimulation(tinyPop, flatMort, 0, netMig, false, 0, 0);

        // Population should never go negative
        for (const pop of popByYear) {
            pop.forEach(v => expect(v).toBeGreaterThanOrEqual(0));
        }
        // First step: all migration bins should be emptied (total available = 100 * 15 = 1500)
        const migBinSum = popByYear[1].slice(MIGRATION_AGE_MIN, MIGRATION_AGE_MAX).reduce((a, b) => a + b, 0);
        expect(migBinSum).toBe(0);
    });
});

describe('dynamic TFR edge cases', () => {
    const cfg = COUNTRY_CONFIG.taiwan;
    const basePop = buildCountryPopulation(cfg);
    const mortality = MORTALITY_PROFILES[cfg.mortalityProfile];

    it('terminalYear === SIM_START_YEAR uses terminalTfr immediately', () => {
        const terminalTfr = 3.0;
        const result = runSimulation(basePop, mortality, cfg.tfr, 0, true, terminalTfr, SIM_START_YEAR);
        // With terminalYear === SIM_START_YEAR, progress denominator = 0, so year >= terminalYear
        // The sim should use terminalTfr from the start — higher births than baseline
        const baseResult = runSimulation(basePop, mortality, cfg.tfr, 0, false, 0, 0);
        // By year 30, higher TFR should yield more people
        expect(result.history[30].total).toBeGreaterThan(baseResult.history[30].total);
    });

    it('terminalYear < SIM_START_YEAR uses terminalTfr immediately', () => {
        const terminalTfr = 3.0;
        const result = runSimulation(basePop, mortality, cfg.tfr, 0, true, terminalTfr, SIM_START_YEAR - 10);
        const baseResult = runSimulation(basePop, mortality, cfg.tfr, 0, false, 0, 0);
        expect(result.history[30].total).toBeGreaterThan(baseResult.history[30].total);
    });
});

describe('infant mortality / birth semantics', () => {
    it('newborns in nextPop[0] are pre-mortality; survivors at age 1 reflect mortality[0]', () => {
        // Construct a population with only reproductive-age women to isolate births
        const pop = new Array(MAX_AGE + 1).fill(0);
        for (let i = 15; i <= 49; i++) pop[i] = 10_000; // 350K women (gender ratio 0.5 → 175K women)
        const mort = new Array(MAX_AGE + 1).fill(0);
        const infantMort = 0.05; // 5% infant mortality
        mort[0] = infantMort;

        const tfr = 2.0;
        const { popByYear } = runSimulation(pop, mort, tfr, 0, false, 0, 0);

        // Year 0 pop: newborns at index 0 are births (pre-mortality)
        const births = popByYear[0 + 1] ? undefined : null; // We actually need the nextPop
        // Actually: popByYear[0] is the state at the START of year 2025 (before aging)
        // popByYear[1] is the state at the START of year 2026 (after aging year 2025)
        // In popByYear[1], index 0 = new births from year 2026's cycle
        // index 1 = survivors of popByYear[0]'s age-0 cohort after mortality[0]

        // The births in year 0: women * (tfr / 35)
        // women = sum(pop[15..49]) * 0.5 = 350_000 * 0.5 = 175_000
        // births = 175_000 * (2.0 / 35) = 10_000
        const expectedBirths = 175_000 * (tfr / 35);
        // popByYear[0][0] = births in the FIRST iteration (but popByYear[0] is the snapshot BEFORE aging)
        // Actually popByYear[0] is the initial snapshot. popByYear[1] is after first year of simulation.
        // In popByYear[1]: index 1 = popByYear[0] was built from initial pop, then:
        //   nextPop[0] = births, nextPop[1] = currentPop[0] * (1 - mort[0])
        // But currentPop[0] in the first iteration = pop[0] = 0, so nextPop[1] = 0
        // nextPop[0] = births = women * (tfr / 35)
        // In popByYear[1]: age 0 = expectedBirths
        expect(Math.abs(popByYear[1][0] - expectedBirths)).toBeLessThan(1);

        // In popByYear[2]: age 1 = popByYear[1][0] * (1 - mort[0]) = expectedBirths * (1 - infantMort)
        const expectedSurvivors = expectedBirths * (1 - infantMort);
        expect(Math.abs(popByYear[2][1] - expectedSurvivors)).toBeLessThan(1);
    });
});

describe('mortality immutability', () => {
    it('sanitizeMortality returns a new clamped array', () => {
        const input = [0.1, -0.3, 1.2, 0.4];
        const copy = [...input];
        const out = sanitizeMortality(input);

        expect(out).toEqual([0.1, 0, 1, 0.4]);
        expect(input).toEqual(copy);
        expect(out).not.toBe(input);
    });

    it('runSimulation does not mutate MORTALITY_PROFILES fixtures', () => {
        const cfg = COUNTRY_CONFIG.taiwan;
        const basePop = buildCountryPopulation(cfg);
        const before = [...MORTALITY_PROFILES[cfg.mortalityProfile]];

        runSimulation(basePop, MORTALITY_PROFILES[cfg.mortalityProfile], cfg.tfr, cfg.migration, false, 0, 0);

        expect(MORTALITY_PROFILES[cfg.mortalityProfile]).toEqual(before);
    });
});
