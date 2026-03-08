import {
    GENDER_RATIO,
    MAX_AGE,
    MIGRATION_AGE_MAX,
    MIGRATION_AGE_MIN,
    REPRODUCTIVE_AGE_MAX,
    REPRODUCTIVE_AGE_MIN,
    REPRODUCTIVE_YEARS,
    SIM_END_YEAR,
    SIM_START_YEAR,
    WORKING_AGE_MAX,
    YOUTH_AGE_MAX
} from '../data/constants';

/**
 * Build a (MAX_AGE+1)-element age-distribution array from country config.
 * Uses piecewise linear interpolation between anchor points,
 * then normalizes to total population (single factor) to avoid boundary discontinuities.
 * Anchors are calibrated to actual per-cohort population proportions (UN WPP 2024).
 */
export function buildCountryPopulation({ anchors, youth: tY, working: tW, elderly: tE }) {
    const pop = new Array(MAX_AGE + 1).fill(0);

    for (let seg = 0; seg < anchors.length - 1; seg++) {
        const [a0, w0] = anchors[seg];
        const [a1, w1] = anchors[seg + 1];
        for (let age = a0; age <= a1; age++) {
            const t = (a1 - a0) === 0 ? 0 : (age - a0) / (a1 - a0);
            pop[age] = w0 + t * (w1 - w0);
        }
    }

    const total = tY + tW + tE;
    const sum = pop.reduce((a, b) => a + b, 0);
    const factor = sum > 0 ? total / sum : 1;
    for (let i = 0; i <= MAX_AGE; i++) pop[i] *= factor;

    return pop;
}

/**
 * Return a validated mortality copy constrained to [0, 1].
 * This function is intentionally non-mutating to avoid leaking state
 * into shared mortality fixtures.
 */
export function sanitizeMortality(mortality) {
    return mortality.map((rate, age) => {
        if (rate < 0 || rate > 1) {
            console.warn(`Mortality rate out of range at age ${age}: ${rate} (clamped to [0,1])`);
            return Math.max(0, Math.min(1, rate));
        }
        return rate;
    });
}

/**
 * Run a cohort-component demographic simulation.
 *
 * @param {number[]} basePop - Initial 101-element age distribution
 * @param {number[]} mortality - Age-specific mortality rates (0–100)
 * @param {number} tfr - Starting Total Fertility Rate
 * @param {number} netMigration - Annual net migration (can be negative)
 * @param {boolean} isDynamicTfr - Whether TFR changes over time
 * @param {number} terminalTfr - Target TFR (if dynamic)
 * @param {number} terminalYear - Year to reach target TFR (if dynamic)
 * @returns {{ history: object[], popByYear: number[][] }}
 */
export function runSimulation(basePop, mortality, tfr, netMigration, isDynamicTfr, terminalTfr, terminalYear) {
    const safeMortality = sanitizeMortality(mortality);

    let currentPop = [...basePop];
    const history = [];
    const popByYear = [];

    for (let year = SIM_START_YEAR; year <= SIM_END_YEAR; year++) {
        let youth = 0, working = 0, elderly = 0;
        for (let i = 0; i <= MAX_AGE; i++) {
            if (i <= YOUTH_AGE_MAX) youth += currentPop[i];
            else if (i <= WORKING_AGE_MAX) working += currentPop[i];
            else elderly += currentPop[i];
        }
        const total = youth + working + elderly;
        const depRatio = working > 0 ? ((youth + elderly) / working) * 100 : null;
        const yearRecord = { year, total, youth, working, elderly, depRatio };
        history.push(yearRecord);
        popByYear.push([...currentPop]);

        // Calculate women of reproductive age
        const nextPop = new Array(MAX_AGE + 1).fill(0);
        let women = 0;
        for (let i = REPRODUCTIVE_AGE_MIN; i <= REPRODUCTIVE_AGE_MAX; i++) {
            women += currentPop[i] * GENDER_RATIO;
        }

        // Determine current-year TFR (fixed or interpolated)
        let currentYearTfr = tfr;
        if (isDynamicTfr) {
            if (year >= terminalYear) {
                currentYearTfr = terminalTfr;
            } else {
                const progress = (year - SIM_START_YEAR) / (terminalYear - SIM_START_YEAR);
                currentYearTfr = tfr + (terminalTfr - tfr) * progress;
            }
        }

        // Births: TFR is lifetime births per woman; divide by reproductive-year span for annual rate.
        // Newborns are placed at age 0 *before* first-year mortality is applied.
        // In the next iteration, mortality[0] is applied when they age from 0 → 1,
        // so survivors-to-age-1 = births * (1 - mortality[0]).
        nextPop[0] = women * (currentYearTfr / REPRODUCTIVE_YEARS);

        // Age each cohort by one year, applying mortality
        for (let i = 1; i <= MAX_AGE; i++) {
            nextPop[i] = currentPop[i - 1] * (1 - safeMortality[i - 1]);
        }
        // Accumulate survivors at max age (prevents population from "falling off")
        nextPop[MAX_AGE] += currentPop[MAX_AGE] * (1 - safeMortality[MAX_AGE]);

        // Distribute migration across working-age adults, conserving total.
        // For emigration (negative), iteratively redistribute shortfalls from
        // bins that lack capacity across remaining bins.
        let migrationApplied = 0;
        if (netMigration !== 0) {
            let remaining = netMigration;
            const eligible = [];
            for (let i = MIGRATION_AGE_MIN; i < MIGRATION_AGE_MAX; i++) {
                eligible.push(i);
            }

            while (Math.abs(remaining) > 0.5 && eligible.length > 0) {
                const perBin = remaining / eligible.length;
                const nextEligible = [];
                let applied = 0;

                for (const i of eligible) {
                    const proposed = nextPop[i] + perBin;
                    if (proposed < 0) {
                        // This bin can't absorb full emigration; take what's available
                        applied -= nextPop[i];
                        nextPop[i] = 0;
                    } else {
                        nextPop[i] = proposed;
                        applied += perBin;
                        nextEligible.push(i);
                    }
                }

                remaining -= applied;
                migrationApplied += applied;

                // If no progress was made (all bins exhausted), stop
                if (nextEligible.length === eligible.length || nextEligible.length === 0) break;
                // Only re-iterate if there was clamping; remaining shortfall goes to survivors
                eligible.length = 0;
                eligible.push(...nextEligible);
            }

            if (Math.abs(remaining) > 0.5 && netMigration < 0) {
                console.warn(
                    `Migration: could not fully apply ${netMigration}; shortfall = ${remaining.toFixed(0)} (year ${year})`
                );
            }
        }

        yearRecord.migrationRequested = netMigration;
        yearRecord.migrationApplied = migrationApplied;
        yearRecord.migrationShortfall = netMigration - migrationApplied;

        currentPop = nextPop;
    }

    return { history, popByYear };
}
