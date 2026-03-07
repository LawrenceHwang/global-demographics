import {
    MAX_AGE,
    SIM_START_YEAR,
    SIM_END_YEAR,
    REPRODUCTIVE_YEARS,
    GENDER_RATIO,
    REPRODUCTIVE_AGE_MIN,
    REPRODUCTIVE_AGE_MAX,
    MIGRATION_AGE_MIN,
    MIGRATION_AGE_MAX,
    MIGRATION_BINS,
    YOUTH_AGE_MAX,
    WORKING_AGE_MAX,
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
        const depRatio = working > 0 ? ((youth + elderly) / working) * 100 : 0;
        history.push({ year, total, youth, working, elderly, depRatio });
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

        // Births: TFR is lifetime births per woman; divide by reproductive-year span for annual rate
        nextPop[0] = women * (currentYearTfr / REPRODUCTIVE_YEARS);

        // Age each cohort by one year, applying mortality
        for (let i = 1; i <= MAX_AGE; i++) {
            nextPop[i] = currentPop[i - 1] * (1 - mortality[i - 1]);
        }
        // Accumulate survivors at max age (prevents population from "falling off")
        nextPop[MAX_AGE] += currentPop[MAX_AGE] * (1 - mortality[MAX_AGE]);

        // Distribute migration across working-age adults
        if (netMigration !== 0) {
            const immigrantPerBin = netMigration / MIGRATION_BINS;
            for (let i = MIGRATION_AGE_MIN; i < MIGRATION_AGE_MAX; i++) {
                nextPop[i] = Math.max(0, nextPop[i] + immigrantPerBin);
            }
        }

        currentPop = nextPop;
    }

    return { history, popByYear };
}
