import { MAX_AGE } from './constants';

// =============================================================================
// MORTALITY PROFILES
// Age-specific annual probability of death, indexed 0–100.
// =============================================================================

export const MORTALITY_PROFILES = {
    // Developed world: life expectancy ~80-84 years
    developed: Array.from({ length: MAX_AGE + 1 }, (_, i) => {
        if (i === 0) return 0.0039;      // ~3.9/1000 infant mortality
        if (i < 15) return 0.0002;
        if (i < 40) return 0.0008;
        if (i < 60) return 0.002 + (i - 40) * 0.0003;
        if (i < 80) return 0.01 + (i - 60) * 0.002;
        if (i < 100) return 0.05 + (i - 80) * 0.015;
        return 0.3;
    }),

    // High-fertility / Sub-Saharan Africa: life expectancy ~60-65 years
    'high-fertility': Array.from({ length: MAX_AGE + 1 }, (_, i) => {
        if (i === 0) return 0.050;       // ~50/1000 infant mortality
        if (i < 5) return 0.012;
        if (i < 15) return 0.004;
        if (i < 40) return 0.007;
        if (i < 60) return 0.018 + (i - 40) * 0.0015;
        if (i < 75) return 0.048 + (i - 60) * 0.006;
        return 0.15;
    }),
};
