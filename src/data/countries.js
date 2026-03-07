// =============================================================================
// COUNTRY CONFIGURATION
// Sources: UN World Population Prospects 2024; national statistics offices.
// See DATA_SOURCES for full citations.
// Population figures are 2025 estimates (medium variant).
// =============================================================================

export const COUNTRY_CONFIG = {
    taiwan: {
        flag: '🇹🇼',
        tfr: 0.86, migration: 20_000,
        youth: 2_680_000, working: 15_950_000, elderly: 4_670_000,
        mortalityProfile: 'developed',
        migrationMin: -100_000, migrationMax: 500_000, migrationStep: 5_000,
        // Per-cohort weights calibrated to UN WPP 2024 single-year estimates (unit ≈ 100K/yr).
        // Shape: small youth (declining births), large 35-55 working bulge, declining elderly.
        anchors: [[0, 1.6], [5, 1.8], [10, 1.9], [15, 2.0], [20, 2.2], [25, 2.8], [30, 3.6], [35, 3.9], [40, 3.9], [45, 3.8], [50, 3.7], [55, 3.5], [60, 3.1], [65, 2.8], [70, 2.2], [75, 1.6], [80, 1.2], [85, 0.7], [90, 0.36], [95, 0.16], [100, 0.05]],
    },
    us: {
        flag: '🇺🇸',
        // Source: US Census Bureau International Data Base 2024; CDC NCHS TFR 2023
        tfr: 1.62, migration: 1_000_000,
        youth: 60_600_000, working: 215_900_000, elderly: 63_500_000,
        mortalityProfile: 'developed',
        migrationMin: -500_000, migrationMax: 2_000_000, migrationStep: 50_000,
        anchors: [[0, 4.0], [10, 4.1], [20, 4.4], [30, 4.8], [45, 4.6], [55, 4.5], [64, 3.8], [70, 3.0], [80, 1.8], [90, 0.8], [100, 0.1]],
    },
    canada: {
        flag: '🇨🇦',
        // Source: Statistics Canada Cat. 91-520-X; TFR 2022
        tfr: 1.44, migration: 400_000,
        youth: 6_300_000, working: 26_000_000, elderly: 8_700_000,
        mortalityProfile: 'developed',
        migrationMin: -200_000, migrationMax: 800_000, migrationStep: 10_000,
        anchors: [[0, 3.6], [15, 3.8], [25, 4.5], [35, 4.7], [45, 4.8], [55, 4.2], [64, 3.2], [70, 2.5], [80, 1.5], [90, 0.6], [100, 0.1]],
    },
    japan: {
        flag: '🇯🇵',
        // Source: Statistics Bureau of Japan 2024; MHLW Vital Statistics TFR 2023
        tfr: 1.20, migration: 100_000,
        youth: 13_900_000, working: 73_200_000, elderly: 36_200_000,
        mortalityProfile: 'developed',
        migrationMin: -100_000, migrationMax: 500_000, migrationStep: 10_000,
        // Calibrated to UN WPP 2024: Dankai Jr. baby boom (born 1971-74) peaks at age 50-54;
        // very small young cohorts (births ~800K/yr recently vs ~2M/yr in 1970s).
        anchors: [[0, 1.5], [5, 1.8], [10, 2.0], [15, 2.1], [20, 2.2], [25, 2.3], [30, 2.5], [35, 2.5], [40, 3.0], [45, 3.1], [50, 4.0], [55, 3.8], [60, 3.3], [65, 3.2], [70, 3.0], [75, 2.2], [80, 1.3], [85, 0.7], [90, 0.3], [95, 0.10], [100, 0.03]],
    },
    korea: {
        flag: '🇰🇷',
        // Source: Statistics Korea (KOSIS) 2024; TFR 2023 (record low 0.72)
        tfr: 0.72, migration: 100_000,
        youth: 5_700_000, working: 36_500_000, elderly: 9_500_000,
        mortalityProfile: 'developed',
        migrationMin: -100_000, migrationMax: 500_000, migrationStep: 10_000,
        // Calibrated to Statistics Korea 2024: births collapsed from ~1M/yr (1965) to ~250K/yr (2023).
        // Large 50-64 cohorts (born 1961-75); much smaller youth than working age.
        anchors: [[0, 2.6], [5, 3.3], [10, 4.4], [15, 4.7], [20, 4.9], [25, 6.4], [30, 7.0], [35, 6.5], [40, 7.0], [45, 7.5], [50, 9.0], [55, 9.0], [60, 10.0], [65, 6.0], [70, 4.7], [75, 3.7], [80, 2.6], [85, 1.4], [90, 0.6], [95, 0.18], [100, 0.05]],
    },
    china: {
        flag: '🇨🇳',
        // Source: NBS China Statistical Yearbook 2024; UN WPP 2024
        // One-child policy (1980-2015) created a dip in ages 10-30 (born 1995-2014)
        // and a larger bulge at 35-55 (born 1970-1990)
        tfr: 1.09, migration: -100_000,
        youth: 232_000_000, working: 967_000_000, elderly: 209_000_000,
        mortalityProfile: 'developed',
        migrationMin: -500_000, migrationMax: 1_000_000, migrationStep: 50_000,
        anchors: [[0, 8.0], [10, 10.0], [14, 10.0], [20, 12.0], [25, 10.0], [30, 10.5], [40, 13.5], [50, 14.0], [55, 11.0], [64, 10.0], [70, 7.0], [80, 3.5], [90, 1.0], [100, 0.1]],
    },
    germany: {
        flag: '🇩🇪',
        // Source: Destatis Bevoelkerungsvorausberechnung 2024; TFR 2023
        tfr: 1.35, migration: 300_000,
        youth: 11_000_000, working: 53_500_000, elderly: 20_000_000,
        mortalityProfile: 'developed',
        migrationMin: -200_000, migrationMax: 600_000, migrationStep: 10_000,
        // Post-war baby boom bulge at ages 50-65; reunification echo at 30-35
        anchors: [[0, 1.8], [15, 2.0], [25, 2.5], [35, 3.0], [45, 3.3], [50, 3.5], [55, 3.4], [60, 3.0], [64, 2.5], [70, 2.0], [80, 1.3], [90, 0.6], [100, 0.1]],
    },
    niger: {
        flag: '🇳🇪',
        // Source: UN WPP 2024 (Medium Variant); World Bank WDI 2024
        // World's highest TFR (~6.7); classic broad-base pyramid
        tfr: 6.73, migration: -20_000,
        youth: 13_900_000, working: 13_200_000, elderly: 870_000,
        mortalityProfile: 'high-fertility',
        migrationMin: -100_000, migrationMax: 200_000, migrationStep: 5_000,
        anchors: [[0, 10.0], [5, 8.5], [15, 6.5], [25, 4.5], [35, 3.0], [45, 1.8], [55, 1.0], [65, 0.5], [75, 0.2], [85, 0.07], [100, 0.01]],
    },
    mali: {
        flag: '🇲🇱',
        // Source: UN WPP 2024 (Medium Variant); World Bank WDI 2024
        // Second-highest TFR globally (~5.97); broad-base pyramid
        tfr: 5.97, migration: -30_000,
        youth: 11_600_000, working: 12_100_000, elderly: 810_000,
        mortalityProfile: 'high-fertility',
        migrationMin: -100_000, migrationMax: 200_000, migrationStep: 5_000,
        anchors: [[0, 9.5], [5, 8.0], [15, 6.2], [25, 4.2], [35, 2.8], [45, 1.7], [55, 0.9], [65, 0.45], [75, 0.18], [85, 0.06], [100, 0.01]],
    },
};

/** Ordered list of country keys for rendering */
export const COUNTRY_KEYS = Object.keys(COUNTRY_CONFIG);
