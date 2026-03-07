// =============================================================================
// SIMULATION CONSTANTS
// =============================================================================

/** First year of the simulation */
export const SIM_START_YEAR = 2025;

/** Last year of the simulation */
export const SIM_END_YEAR = 2125;

/** Total simulation span in years */
export const SIM_YEAR_SPAN = SIM_END_YEAR - SIM_START_YEAR;

/** Maximum age cohort tracked */
export const MAX_AGE = 100;

/** Number of reproductive years (15–49) used to convert TFR to annual birth rate */
export const REPRODUCTIVE_YEARS = 35;

/** Assumed female fraction of each age cohort */
export const GENDER_RATIO = 0.5;

/** Lower bound of reproductive age range */
export const REPRODUCTIVE_AGE_MIN = 15;

/** Upper bound of reproductive age range */
export const REPRODUCTIVE_AGE_MAX = 49;

/** Lower bound of migration target age range */
export const MIGRATION_AGE_MIN = 20;

/** Upper bound of migration target age range (exclusive) */
export const MIGRATION_AGE_MAX = 35;

/** Number of migration age bins */
export const MIGRATION_BINS = MIGRATION_AGE_MAX - MIGRATION_AGE_MIN;

/** Playback interval in milliseconds */
export const PLAYBACK_SPEED_MS = 100;

// =============================================================================
// AGE-GROUP BOUNDARIES
// =============================================================================

/** Youth upper bound (inclusive) */
export const YOUTH_AGE_MAX = 14;

/** Working-age upper bound (inclusive) */
export const WORKING_AGE_MAX = 64;

// =============================================================================
// DEPENDENCY RATIO THRESHOLDS
// =============================================================================

export const DEP_THRESHOLD_HEALTHY = 50;
export const DEP_THRESHOLD_WARNING = 65;
export const DEP_THRESHOLD_SEVERE = 80;
export const DEP_THRESHOLD_EMERGENCY = 100;

// =============================================================================
// CHART DIMENSIONS
// =============================================================================

export const CHART_W = 760;
export const TRAJ_CHART_H = 420;

// =============================================================================
// TFR SLIDER RANGE
// =============================================================================

export const TFR_MIN = 0.3;
export const TFR_MAX = 8.0;
export const TFR_STEP = 0.05;

// =============================================================================
// LOCALE MAPPING (for Intl.NumberFormat)
// =============================================================================

export const LOCALE_MAP = {
    en: 'en-US',
    zh: 'zh-TW',
    ko: 'ko-KR',
    ja: 'ja-JP',
};
