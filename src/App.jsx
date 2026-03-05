import { Activity, AlertTriangle, ChevronDown, ChevronUp, Globe, Info, Moon, Pause, Play, RotateCcw, Settings2, Sun, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// =============================================================================
// COUNTRY CONFIGURATION
// Sources: UN World Population Prospects 2024; national statistics offices.
// See DATA_SOURCES below for full citations.
// Population figures are 2025 estimates (medium variant).
// =============================================================================
const COUNTRY_CONFIG = {
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

// Build a 101-element age-distribution array from country config.
// Uses piecewise linear interpolation between anchor points,
// then normalizes to total population (single factor) to avoid boundary discontinuities.
// Anchors are calibrated to actual per-cohort population proportions (UN WPP 2024).
function buildCountryPopulation({ anchors, youth: tY, working: tW, elderly: tE }) {
    const pop = new Array(101).fill(0);
    for (let seg = 0; seg < anchors.length - 1; seg++) {
        const [a0, w0] = anchors[seg];
        const [a1, w1] = anchors[seg + 1];
        for (let age = a0; age <= a1; age++) {
            const t = (a1 === a0) ? 1 : (age - a0) / (a1 - a0);
            pop[age] = w0 + t * (w1 - w0);
        }
    }
    const total = tY + tW + tE;
    const sum = pop.reduce((a, b) => a + b, 0);
    const factor = sum > 0 ? total / sum : 1;
    for (let i = 0; i <= 100; i++) pop[i] *= factor;
    return pop;
}

// =============================================================================
// MORTALITY PROFILES
// =============================================================================
const MORTALITY_PROFILES = {
    // Developed world: life expectancy ~80-84 years
    developed: new Array(101).fill(0).map((_, i) => {
        if (i === 0) return 0.0039;      // ~3.9/1000 infant mortality
        if (i < 15) return 0.0002;
        if (i < 40) return 0.0008;
        if (i < 60) return 0.002 + (i - 40) * 0.0003;
        if (i < 80) return 0.01 + (i - 60) * 0.002;
        if (i < 100) return 0.05 + (i - 80) * 0.015;
        return 0.3;
    }),
    // High-fertility / Sub-Saharan Africa: life expectancy ~60-65 years
    'high-fertility': new Array(101).fill(0).map((_, i) => {
        if (i === 0) return 0.050;       // ~50/1000 infant mortality
        if (i < 5) return 0.012;
        if (i < 15) return 0.004;
        if (i < 40) return 0.007;
        if (i < 60) return 0.018 + (i - 40) * 0.0015;
        if (i < 75) return 0.048 + (i - 60) * 0.006;
        return 0.15;
    }),
};

// =============================================================================
// SIMULATION ENGINE
// =============================================================================
const runSimulation = (basePop, mortality, tfr, netMigration, isDynamicTfr, terminalTfr, terminalYear) => {
    let currentPop = [...basePop];
    const history = [];
    const popByYear = [];

    for (let year = 2025; year <= 2100; year++) {
        let youth = 0, working = 0, elderly = 0;
        for (let i = 0; i <= 100; i++) {
            if (i <= 14) youth += currentPop[i];
            else if (i <= 64) working += currentPop[i];
            else elderly += currentPop[i];
        }
        const total = youth + working + elderly;
        const depRatio = ((youth + elderly) / working) * 100;
        history.push({ year, total, youth, working, elderly, depRatio });
        popByYear.push([...currentPop]);

        const nextPop = new Array(101).fill(0);
        let women15to49 = 0;
        for (let i = 15; i <= 49; i++) women15to49 += currentPop[i] * 0.5;

        let currentYearTfr = tfr;
        if (isDynamicTfr) {
            if (year >= terminalYear) {
                currentYearTfr = terminalTfr;
            } else {
                const progress = (year - 2025) / (terminalYear - 2025);
                currentYearTfr = tfr + (terminalTfr - tfr) * progress;
            }
        }

        // TFR is lifetime births per woman; divide by 35 reproductive years for annual rate
        const births = women15to49 * (currentYearTfr / 35);
        nextPop[0] = births;

        for (let i = 1; i <= 100; i++) {
            nextPop[i] = currentPop[i - 1] * (1 - mortality[i - 1]);
        }
        nextPop[100] += currentPop[100] * (1 - mortality[100]);

        // Migration distributed across working-age adults (20-34)
        if (netMigration !== 0) {
            const immigrantPerBin = netMigration / 15;
            for (let i = 20; i < 35; i++) {
                nextPop[i] = Math.max(0, nextPop[i] + immigrantPerBin);
            }
        }
        currentPop = nextPop;
    }
    return { history, popByYear };
};

// =============================================================================
// HELPERS
// =============================================================================
const formatPop = (n) => {
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    return `${Math.round(n / 1000)}K`;
};

function computeYAxisMax(maxVal) {
    const m = maxVal / 1e6;
    const steps = [10, 20, 25, 30, 40, 50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 1250, 1500, 2000];
    const found = steps.find(s => s >= m * 1.08);
    return (found || Math.ceil(m * 1.1 / 100) * 100) * 1e6;
}

function formatYLabel(millions) {
    if (millions >= 1000) return `${(millions / 1000).toFixed(millions % 1000 === 0 ? 0 : 1)}B`;
    return `${millions % 1 === 0 ? millions : millions.toFixed(0)}M`;
}

// =============================================================================
// DATA SOURCES
// =============================================================================
const DATA_SOURCES = [
    { label: 'UN WPP 2024 (all countries)', url: 'https://population.un.org/wpp/', text: 'UN World Population Prospects 2024' },
    { label: 'Taiwan', url: 'https://www.mohw.gov.tw/', text: 'Taiwan MOHW; National Development Council Population Projections 2022–2070' },
    { label: 'United States', url: 'https://www.census.gov/programs-surveys/international-programs/about/idb.html', text: 'US Census Bureau IDB 2024; CDC NCHS TFR 2023 (1.616)' },
    { label: 'Canada', url: 'https://www.statcan.gc.ca/', text: 'Statistics Canada Cat. 91-520-X; TFR 2022' },
    { label: 'Japan', url: 'https://www.stat.go.jp/', text: 'Statistics Bureau of Japan 2024; MHLW Vital Statistics TFR 2023 (1.20)' },
    { label: 'South Korea', url: 'https://kosis.kr/', text: 'Statistics Korea (KOSIS) 2024; TFR 2023 (0.72 — record low)' },
    { label: 'China', url: 'https://www.stats.gov.cn/', text: 'NBS China Statistical Yearbook 2024; TFR 2023 (1.09)' },
    { label: 'Germany', url: 'https://www.destatis.de/', text: 'Destatis Bevoelkerungsvorausberechnung 2024; TFR 2023 (1.35)' },
    { label: 'Niger & Mali', url: 'https://population.un.org/wpp/', text: 'UN WPP 2024 Medium Variant; World Bank WDI 2024. Highest TFR nations globally.' },
    { label: 'Methodology', text: 'Cohort-Component model. Mortality calibrated to life expectancy per profile. Births from women aged 15–49 (×0.5) × (TFR ÷ 35). Migration distributed across ages 20–34.' },
    { label: 'Conceptual framework', url: 'https://www.youtube.com/watch?v=AultJcNb90c', text: '"How China blew up its own future" — Max Fisher' },
];

// =============================================================================
// I18N
// =============================================================================
const translations = {
    en: {
        title: "Global Demographics",
        subtitle: "Simulation Engine (2025 - 2100)",
        simYear: "Simulation Year",
        play: "Play", pause: "Pause",
        fixedTfr: "Fixed TFR", dynamicTfr: "Dynamic Target",
        startingTfr: "Starting TFR (2025)", tfr: "Total Fertility Rate (TFR)",
        terminalTfr: "Terminal Target TFR", targetYear: "Target Year",
        repRateNote: "Replacement rate is 2.1. {country}'s 2025 TFR is ~{tfr}.",
        dynRateNote: "Linearly interpolates from {tfr} to {terminalTfr} by {terminalYear}.",
        netMigration: "Net Migration / Year",
        migrationNote: "Working-age immigration is the primary lever countries use to offset the dependency crisis.",
        videoKey: "Dependency Key",
        depRatioDesc: "Dependency Ratio: Dependents (Children + Elderly) per 100 working-age adults.",
        healthyDesc: "~45 (Healthy): Fuels economy.",
        declineDesc: "~70 (Decline): Japan today. Severe economic drag.",
        collapseDesc: "100+ (Collapse): 1 worker per dependent. Social systems fail.",
        totalPop: "Total Population", startingAt: "Starting {pop} in 2025",
        depRatio: "Dependency Ratio", workforceSize: "Workforce Size",
        supports: "Supports {num} dependents",
        trajTitle: "Dependency Ratio Trajectory",
        trajSub: "Dependents per 100 working-age adults (2025 - 2100)",
        pyrTitle: "Demographic Pyramid", pyrSub: "Population distribution by age ({year})",
        compTitle: "Population Composition Over Time",
        compSub: "Total numbers for each demographic bucket",
        youth: "Youth (0-14)", working: "Working (15-64)", elderly: "Elderly (65+)", total: "Total",
        statusHealthy: "Healthy Demographic Dividend",
        statusWarning: "Aging Society (Warning)",
        statusSevere: "Severe Aging (National Decline)",
        statusEmergency: "Demographic Emergency",
        statusCollapse: "System Collapse (Upside-Down Pyramid)",
        creditPrefix: "Based on concepts from:",
        videoTitle: "How China blew up its own future (Max Fisher)",
        controls: "Controls",
        country: "Country / Region",
        highTfrNote: "Niger & Mali represent the world's two highest-TFR nations (2024), included for comparison.",
        dataSources: "Data Sources & Methodology",
        cname_taiwan: "Taiwan", cname_us: "United States", cname_canada: "Canada",
        cname_japan: "Japan", cname_korea: "S. Korea", cname_china: "China",
        cname_germany: "Germany", cname_niger: "Niger", cname_mali: "Mali",
    },
    zh: {
        title: "全球人口統計",
        subtitle: "模擬引擎 (2025 - 2100)",
        simYear: "模擬年份", play: "播放", pause: "暫停",
        fixedTfr: "固定生育率", dynamicTfr: "動態目標",
        startingTfr: "起始生育率 (2025)", tfr: "總和生育率 (TFR)",
        terminalTfr: "最終目標生育率", targetYear: "目標年份",
        repRateNote: "替代率為 2.1。{country} 2025 年 TFR 約為 {tfr}。",
        dynRateNote: "從 {tfr} 線性插值到 {terminalYear} 年的 {terminalTfr}。",
        netMigration: "每年淨移民人數",
        migrationNote: "引入適齡勞動移民是各國抵消撫養比危機的主要方式。",
        videoKey: "撫養比說明",
        depRatioDesc: "撫養比：每 100 名適齡勞動成年人對應的受撫養人數（兒童+老人）。",
        healthyDesc: "~45 (健康): 推動經濟發展。",
        declineDesc: "~70 (衰退): 今日日本。嚴重的經濟負擔。",
        collapseDesc: "100+ (崩潰): 1名工人對應1名受撫養者。社會系統崩潰。",
        totalPop: "總人口", startingAt: "2025年起始為 {pop}",
        depRatio: "撫養比", workforceSize: "勞動力規模",
        supports: "撫養 {num} 名受撫養者",
        trajTitle: "撫養比軌跡", trajSub: "每 100 名勞動年齡成人的受撫養人數 (2025 - 2100)",
        pyrTitle: "人口金字塔", pyrSub: "按年齡劃分的人口分佈 ({year})",
        compTitle: "人口組成隨時間變化", compSub: "每個年齡段的總人數",
        youth: "青年 (0-14)", working: "勞動 (15-64)", elderly: "老年 (65+)", total: "總計",
        statusHealthy: "健康的人口紅利", statusWarning: "高齡化社會 (警告)",
        statusSevere: "嚴重高齡化 (國家衰退)", statusEmergency: "人口緊急狀態",
        statusCollapse: "系統崩潰 (倒金字塔)",
        creditPrefix: "概念參考自影片：",
        videoTitle: "How China blew up its own future (Max Fisher)",
        controls: "參數設定",
        country: "國家／地區",
        highTfrNote: "尼日爾與馬利為全球生育率最高的兩個國家（2024），納入作為對照。",
        dataSources: "資料來源與研究方法",
        cname_taiwan: "台灣", cname_us: "美國", cname_canada: "加拿大",
        cname_japan: "日本", cname_korea: "韓國", cname_china: "中國",
        cname_germany: "德國", cname_niger: "尼日爾", cname_mali: "馬利",
    },
    ko: {
        title: "글로벌 인구 통계",
        subtitle: "시뮬레이션 엔진 (2025 - 2100)",
        simYear: "시뮬레이션 연도", play: "재생", pause: "일시정지",
        fixedTfr: "고정 출산율", dynamicTfr: "동적 목표",
        startingTfr: "시작 출산율 (2025)", tfr: "합계출산율 (TFR)",
        terminalTfr: "최종 목표 출산율", targetYear: "목표 연도",
        repRateNote: "대체 출산율은 2.1입니다. {country}의 2025년 TFR은 약 {tfr}입니다.",
        dynRateNote: "{tfr}에서 {terminalYear}년까지 {terminalTfr}로 선형 보간됩니다.",
        netMigration: "연간 순 이동",
        migrationNote: "노동 연령 이민자 유입은 국가가 부양비 위기를 상쇄하는 주요 방법입니다.",
        videoKey: "부양비 핵심",
        depRatioDesc: "부양비: 생산가능인구 100명당 피부양자(어린이+노인) 수.",
        healthyDesc: "~45 (건강): 경제를 촉진합니다.", declineDesc: "~70 (쇠퇴): 현재 일본. 심각한 경제적 부담.",
        collapseDesc: "100+ (붕괴): 노동자 1명당 피부양자 1명. 사회 시스템 실패.",
        totalPop: "총 인구", startingAt: "2025년 {pop} 시작",
        depRatio: "부양비", workforceSize: "노동력 규모",
        supports: "{num} 피부양자 지원",
        trajTitle: "부양비 궤적", trajSub: "생산가능인구 100명당 피부양자 수 (2025 - 2100)",
        pyrTitle: "인구 피라미드", pyrSub: "연령별 인구 분포 ({year})",
        compTitle: "시간에 따른 인구 구성", compSub: "각 인구 통계 버킷의 총 수",
        youth: "유소년 (0-14)", working: "노동 (15-64)", elderly: "노인 (65+)", total: "총계",
        statusHealthy: "건강한 인구 배당금", statusWarning: "고령화 사회 (경고)",
        statusSevere: "심각한 고령화 (국가 쇠퇴)", statusEmergency: "인구 비상 사태",
        statusCollapse: "시스템 붕괴 (역피라미드)",
        creditPrefix: "다음 비디오의 개념을 바탕으로 함:",
        videoTitle: "How China blew up its own future (Max Fisher)",
        controls: "제어판",
        country: "국가 / 지역",
        highTfrNote: "니제르와 말리는 세계에서 출산율이 가장 높은 두 나라입니다(2024), 비교를 위해 포함되었습니다.",
        dataSources: "데이터 출처 및 방법론",
        cname_taiwan: "대만", cname_us: "미국", cname_canada: "캐나다",
        cname_japan: "일본", cname_korea: "한국", cname_china: "중국",
        cname_germany: "독일", cname_niger: "니제르", cname_mali: "말리",
    },
    ja: {
        title: "グローバル人口動態",
        subtitle: "シミュレーションエンジン (2025 - 2100)",
        simYear: "シミュレーション年", play: "再生", pause: "一時停止",
        fixedTfr: "固定出生率", dynamicTfr: "動的ターゲット",
        startingTfr: "開始出生率 (2025)", tfr: "合計特殊出生率 (TFR)",
        terminalTfr: "最終目標出生率", targetYear: "目標年",
        repRateNote: "人口置換水準は2.1です。{country}の2025年TFRは約{tfr}です。",
        dynRateNote: "{tfr}から{terminalYear}年までに{terminalTfr}まで線形補間します。",
        netMigration: "年間の純移動",
        migrationNote: "労働年齢の移民受け入れは、従属人口指数危機を相殺する主な方法です。",
        videoKey: "従属人口指数の基準",
        depRatioDesc: "従属人口指数：生産年齢人口100人あたりの従属人口（子供+高齢者）の数。",
        healthyDesc: "~45 (健康): 経済を牽引。", declineDesc: "~70 (衰退): 今日の日本。深刻な経済的足かせ。",
        collapseDesc: "100+ (崩壊): 労働者1人につき従属人口1人。社会システムが破綻。",
        totalPop: "総人口", startingAt: "2025年に{pop}から開始",
        depRatio: "従属人口指数", workforceSize: "労働力規模",
        supports: "{num}の従属人口を支援",
        trajTitle: "従属人口指数の軌跡", trajSub: "生産年齢人口100人あたりの従属人口 (2025 - 2100)",
        pyrTitle: "人口ピラミッド", pyrSub: "年齢別の人口分布 ({year})",
        compTitle: "経時的な人口構成", compSub: "各人口動態バケットの総数",
        youth: "若者 (0-14)", working: "労働 (15-64)", elderly: "高齢者 (65+)", total: "合計",
        statusHealthy: "健全な人口ボーナス", statusWarning: "高齢化社会 (警告)",
        statusSevere: "深刻な高齢化 (国家衰退)", statusEmergency: "人口緊急事態",
        statusCollapse: "システム崩壊 (逆ピラミッド)",
        creditPrefix: "以下のビデオの概念に基づいています：",
        videoTitle: "How China blew up its own future (Max Fisher)",
        controls: "コントロール",
        country: "国 / 地域",
        highTfrNote: "ニジェールとマリは世界で最も出生率が高い2カ国(2024)で、比較のために含まれています。",
        dataSources: "データソースと方法論",
        cname_taiwan: "台湾", cname_us: "アメリカ", cname_canada: "カナダ",
        cname_japan: "日本", cname_korea: "韓国", cname_china: "中国",
        cname_germany: "ドイツ", cname_niger: "ニジェール", cname_mali: "マリ",
    },
};

// =============================================================================
// APP COMPONENT
// =============================================================================
export default function App() {
    const [theme, setTheme] = useState('dark');
    const [lang, setLang] = useState('en');
    const [country, setCountry] = useState('taiwan');

    const [tfr, setTfr] = useState(COUNTRY_CONFIG.taiwan.tfr);
    const [isDynamicTfr, setIsDynamicTfr] = useState(false);
    const [terminalTfr, setTerminalTfr] = useState(1.50);
    const [terminalYear, setTerminalYear] = useState(2050);
    const [migration, setMigration] = useState(COUNTRY_CONFIG.taiwan.migration);
    const [currentYear, setCurrentYear] = useState(2025);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const [showSources, setShowSources] = useState(false);

    const t = (key, params = {}) => {
        let str = translations[lang][key] || translations['en'][key] || key;
        Object.entries(params).forEach(([k, v]) => { str = str.replace(`{${k}}`, v); });
        return str;
    };

    const handleCountryChange = (newCountry) => {
        const cfg = COUNTRY_CONFIG[newCountry];
        setCountry(newCountry);
        setTfr(cfg.tfr);
        setMigration(cfg.migration);
        setCurrentYear(2025);
        setIsPlaying(false);
        setIsDynamicTfr(false);
    };

    const cfg = COUNTRY_CONFIG[country];

    const basePop = useMemo(() => buildCountryPopulation(cfg), [country]);
    const mortality = MORTALITY_PROFILES[cfg.mortalityProfile];

    const { history, popByYear } = useMemo(
        () => runSimulation(basePop, mortality, tfr, migration, isDynamicTfr, terminalTfr, terminalYear),
        [basePop, mortality, tfr, migration, isDynamicTfr, terminalTfr, terminalYear]
    );
    const currentData = history.find(h => h.year === currentYear);
    const currentPopArray = popByYear[currentYear - 2025];

    // Dynamic chart scales
    const maxHistTotal = useMemo(() => Math.max(...history.map(h => h.total)), [history]);
    const yAxisMax = useMemo(() => computeYAxisMax(maxHistTotal), [maxHistTotal]);
    const yAxisStepM = (yAxisMax / 1e6) / 5;
    const yAxisLabels = [1, 2, 3, 4, 5].map(i => yAxisStepM * i);

    const totalInit = cfg.youth + cfg.working + cfg.elderly;

    useEffect(() => {
        let interval;
        if (isPlaying) {
            interval = setInterval(() => {
                setCurrentYear(y => {
                    if (y >= 2100) { setIsPlaying(false); return 2100; }
                    return y + 1;
                });
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    const getDependencyStatus = (ratio) => {
        if (ratio < 50) return { text: t('statusHealthy'), color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/30", border: "border-emerald-200 dark:border-emerald-800" };
        if (ratio < 65) return { text: t('statusWarning'), color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/30", border: "border-amber-200 dark:border-amber-800" };
        if (ratio < 80) return { text: t('statusSevere'), color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/30", border: "border-orange-200 dark:border-orange-800" };
        if (ratio < 100) return { text: t('statusEmergency'), color: "text-red-700 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/30", border: "border-red-200 dark:border-red-800" };
        return { text: t('statusCollapse'), color: "text-rose-700 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/30", border: "border-rose-200 dark:border-rose-800" };
    };

    const status = getDependencyStatus(currentData.depRatio);

    const CHART_W = 760;
    const xPos = (year) => ((year - 2025) / 75) * CHART_W;

    return (
        <div className={`${theme === 'dark' ? 'dark' : ''}`}>
            <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">

                {/* Sticky App Bar */}
                <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-indigo-300 dark:shadow-none">
                                <Users size={14} className="text-white" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-sm font-bold truncate leading-tight">{t('title')}</h1>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block leading-none">{t('subtitle')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors"
                                onClick={() => setShowControls(!showControls)}
                                aria-label="Toggle controls"
                            >
                                <Settings2 size={12} />
                                <span className="hidden xs:inline">{t('controls')}</span>
                                {showControls ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-full">
                                <Globe size={12} className="text-slate-400 flex-shrink-0" />
                                <select
                                    className="bg-transparent text-xs font-medium outline-none cursor-pointer dark:text-slate-200"
                                    value={lang}
                                    onChange={(e) => setLang(e.target.value)}
                                >
                                    <option value="en">EN</option>
                                    <option value="zh">中文</option>
                                    <option value="ko">한국어</option>
                                    <option value="ja">日本語</option>
                                </select>
                            </div>
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="p-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                aria-label="Toggle theme"
                            >
                                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                            </button>
                        </div>
                    </div>
                </header>

                <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col gap-5">

                    {/* Status Banner */}
                    <div className={`${status.bg} ${status.border} border rounded-2xl p-4 flex items-center justify-between gap-4 transition-colors`}>
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-2 rounded-xl ${status.bg} ${status.color} flex-shrink-0`}>
                                <AlertTriangle size={18} />
                            </div>
                            <div className="min-w-0">
                                <div className={`text-sm font-bold ${status.color} leading-tight truncate`}>{status.text}</div>
                                <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                                    <span className="hidden sm:inline">{t('depRatio')}: </span>
                                    <span className="font-semibold">{currentData.depRatio.toFixed(1)}</span>
                                    <span className="hidden sm:inline"> · {t('totalPop')}: <span className="font-semibold">{formatPop(currentData.total)}</span></span>
                                    <span className="ml-2">{cfg.flag}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <div className="text-2xl sm:text-3xl font-mono font-bold">{currentYear}</div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('simYear')}</div>
                        </div>
                    </div>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

                        {/* LEFT PANEL: CONTROLS */}
                        <div className={`lg:col-span-1 flex-col gap-4 ${showControls ? 'flex' : 'hidden lg:flex'}`}>

                            {/* Country Selector */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 transition-colors">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">{t('country')}</p>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {Object.entries(COUNTRY_CONFIG).map(([key]) => (
                                        <button
                                            key={key}
                                            onClick={() => handleCountryChange(key)}
                                            className={`flex flex-col items-center gap-0.5 p-2 rounded-xl text-center transition-all ${country === key
                                                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-400/50'
                                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                        >
                                            <span className="text-lg leading-none">{COUNTRY_CONFIG[key].flag}</span>
                                            <span className="text-[9px] font-semibold leading-tight w-full text-center truncate">{t(`cname_${key}`)}</span>
                                        </button>
                                    ))}
                                </div>
                                {(country === 'niger' || country === 'mali') && (
                                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-3 leading-relaxed">
                                        {t('highTfrNote')}
                                    </p>
                                )}
                            </div>

                            {/* Playback Card */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 transition-colors">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">{t('simYear')}</p>
                                <input
                                    type="range" min="2025" max="2100" value={currentYear}
                                    onChange={(e) => { setCurrentYear(parseInt(e.target.value)); setIsPlaying(false); }}
                                    className="w-full accent-indigo-600 dark:accent-indigo-400 mb-3"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsPlaying(!isPlaying)}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white py-2.5 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
                                    >
                                        {isPlaying ? <Pause size={15} /> : <Play size={15} />}
                                        {isPlaying ? t('pause') : t('play')}
                                    </button>
                                    <button
                                        onClick={() => { setCurrentYear(2025); setIsPlaying(false); }}
                                        className="px-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl flex items-center transition-colors"
                                    >
                                        <RotateCcw size={15} />
                                    </button>
                                </div>
                            </div>

                            {/* TFR Card */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 transition-colors">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">{t('tfr')}</p>
                                <div className="flex gap-1 mb-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                    <button
                                        className={`flex-1 text-xs py-2 rounded-lg font-semibold transition-all ${!isDynamicTfr ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                        onClick={() => setIsDynamicTfr(false)}
                                    >{t('fixedTfr')}</button>
                                    <button
                                        className={`flex-1 text-xs py-2 rounded-lg font-semibold transition-all ${isDynamicTfr ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                        onClick={() => setIsDynamicTfr(true)}
                                    >{t('dynamicTfr')}</button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="font-medium text-slate-700 dark:text-slate-300">{isDynamicTfr ? t('startingTfr') : t('tfr')}</span>
                                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{tfr.toFixed(2)}</span>
                                        </div>
                                        <input
                                            type="range" min="0.3" max="8.0" step="0.05" value={tfr}
                                            onChange={(e) => setTfr(parseFloat(e.target.value))}
                                            className="w-full accent-indigo-600 dark:accent-indigo-400"
                                        />
                                    </div>
                                    {isDynamicTfr && (
                                        <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                                            <div>
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">{t('terminalTfr')}</span>
                                                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{terminalTfr.toFixed(2)}</span>
                                                </div>
                                                <input
                                                    type="range" min="0.3" max="8.0" step="0.05" value={terminalTfr}
                                                    onChange={(e) => setTerminalTfr(parseFloat(e.target.value))}
                                                    className="w-full accent-indigo-600 dark:accent-indigo-400"
                                                />
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">{t('targetYear')}</span>
                                                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{terminalYear}</span>
                                                </div>
                                                <input
                                                    type="range" min="2030" max="2100" step="1" value={terminalYear}
                                                    onChange={(e) => setTerminalYear(parseInt(e.target.value))}
                                                    className="w-full accent-indigo-600 dark:accent-indigo-400"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
                                    {isDynamicTfr
                                        ? t('dynRateNote', { tfr: tfr.toFixed(2), terminalTfr: terminalTfr.toFixed(2), terminalYear })
                                        : t('repRateNote', { country: t(`cname_${country}`), tfr: cfg.tfr.toFixed(2) })}
                                </p>
                            </div>

                            {/* Migration Card */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 transition-colors">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">{t('netMigration')}</p>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-medium text-slate-700 dark:text-slate-300">{t('netMigration')}</span>
                                    <span className={`font-mono font-bold ${migration >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                                        {migration >= 0 ? '+' : ''}{migration.toLocaleString()}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min={cfg.migrationMin} max={cfg.migrationMax} step={cfg.migrationStep}
                                    value={migration}
                                    onChange={(e) => setMigration(parseInt(e.target.value))}
                                    className="w-full accent-emerald-600 dark:accent-emerald-400"
                                />
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
                                    {t('migrationNote')}
                                </p>
                            </div>

                            {/* Info Card */}
                            <div className="bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-900/60 transition-colors">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 dark:text-indigo-400 mb-3 flex items-center gap-1.5">
                                    <Info size={12} /> {t('videoKey')}
                                </h3>
                                <ul className="space-y-3">
                                    <li className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">≤45 — </span>
                                        {t('healthyDesc').split(':')[1]}
                                    </li>
                                    <li className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                                        <span className="font-bold text-amber-600 dark:text-amber-400">~70 — </span>
                                        {t('declineDesc').split(':')[1]}
                                    </li>
                                    <li className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                                        <span className="font-bold text-rose-600 dark:text-rose-400">100+ — </span>
                                        {t('collapseDesc').split(':')[1]}
                                    </li>
                                </ul>
                                <div className="mt-4 pt-4 border-t border-indigo-200 dark:border-indigo-900">
                                    <p className="text-[10px] text-indigo-700 dark:text-indigo-400 leading-relaxed">
                                        {t('creditPrefix')}<br />
                                        <a
                                            href="https://www.youtube.com/watch?v=AultJcNb90c"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-semibold underline hover:text-indigo-900 dark:hover:text-indigo-200 transition-colors"
                                        >
                                            {t('videoTitle')}
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT PANEL: DASHBOARD */}
                        <div className="lg:col-span-3 flex flex-col gap-5">

                            {/* Metric Cards */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-3 sm:p-5 transition-colors">
                                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                        <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg flex-shrink-0">
                                            <Users size={14} className="sm:hidden" /><Users size={18} className="hidden sm:block" />
                                        </div>
                                        <h3 className="text-[9px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight">{t('totalPop')}</h3>
                                    </div>
                                    <div className="text-lg sm:text-3xl font-bold tabular-nums">{formatPop(currentData.total)}</div>
                                    <div className="text-[9px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 hidden sm:block">{t('startingAt', { pop: formatPop(totalInit) })}</div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-3 sm:p-5 transition-colors">
                                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                        <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${status.bg} ${status.color}`}>
                                            <AlertTriangle size={14} className="sm:hidden" /><AlertTriangle size={18} className="hidden sm:block" />
                                        </div>
                                        <h3 className="text-[9px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight">{t('depRatio')}</h3>
                                    </div>
                                    <div className="text-lg sm:text-3xl font-bold tabular-nums">{currentData.depRatio.toFixed(1)}</div>
                                    <div className={`text-[9px] sm:text-xs font-bold mt-0.5 sm:mt-1 ${status.color} leading-tight`}>{status.text}</div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-3 sm:p-5 transition-colors">
                                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                        <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-lg flex-shrink-0">
                                            <Activity size={14} className="sm:hidden" /><Activity size={18} className="hidden sm:block" />
                                        </div>
                                        <h3 className="text-[9px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight">{t('workforceSize')}</h3>
                                    </div>
                                    <div className="text-lg sm:text-3xl font-bold tabular-nums">{formatPop(currentData.working)}</div>
                                    <div className="text-[9px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 hidden sm:block">
                                        {t('supports', { num: formatPop(currentData.youth + currentData.elderly) })}
                                    </div>
                                </div>
                            </div>

                            {/* Charts Row */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

                                {/* Chart 1: Dependency Ratio Trajectory */}
                                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 transition-colors">
                                    <h2 className="text-base font-bold">{t('trajTitle')}</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-4">{t('trajSub')}</p>
                                    <svg viewBox="-46 -5 848 335" className="w-full h-auto" aria-label={t('trajTitle')}>
                                        <rect x="0" y={(150 - 50) * 2.5} width={CHART_W} height={50 * 2.5} fill={theme === 'dark' ? "#064e3b" : "#dcfce7"} opacity="0.35" />
                                        <rect x="0" y={(150 - 65) * 2.5} width={CHART_W} height={15 * 2.5} fill={theme === 'dark' ? "#78350f" : "#fef9c3"} opacity="0.35" />
                                        <rect x="0" y={(150 - 80) * 2.5} width={CHART_W} height={15 * 2.5} fill={theme === 'dark' ? "#7c2d12" : "#fed7aa"} opacity="0.35" />
                                        <rect x="0" y={0} width={CHART_W} height={70 * 2.5} fill={theme === 'dark' ? "#7f1d1d" : "#fecaca"} opacity="0.35" />
                                        {[50, 65, 80, 100, 130].map(val => {
                                            const y = (150 - val) * 2.5;
                                            return (
                                                <g key={val}>
                                                    <line x1="0" y1={y} x2={CHART_W} y2={y} stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} strokeWidth="1.5" strokeDasharray="5 4" />
                                                    <text x="-8" y={y + 7} fontSize="22" fill={theme === 'dark' ? '#64748b' : '#94a3b8'} fontWeight="600" textAnchor="end">{val}</text>
                                                </g>
                                            );
                                        })}
                                        <path
                                            d={[
                                                ...history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${xPos(h.year)} ${(150 - Math.min(150, h.depRatio)) * 2.5}`),
                                                `L ${CHART_W} 300`, 'L 0 300', 'Z'
                                            ].join(' ')}
                                            fill={theme === 'dark' ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.06)'}
                                        />
                                        <path
                                            d={history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${xPos(h.year)} ${(150 - Math.min(150, h.depRatio)) * 2.5}`).join(' ')}
                                            fill="none" stroke={theme === 'dark' ? '#e2e8f0' : '#334155'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                        />
                                        <line x1={xPos(currentYear)} y1="0" x2={xPos(currentYear)} y2="310" stroke="#6366f1" strokeWidth="2" strokeDasharray="5 3" />
                                        <circle cx={xPos(currentYear)} cy={(150 - Math.min(150, currentData.depRatio)) * 2.5} r="5" fill="#6366f1" stroke={theme === 'dark' ? '#0f172a' : 'white'} strokeWidth="2.5" />
                                        {[2025, 2050, 2075, 2100].map((yr, i) => (
                                            <text key={yr} x={xPos(yr)} y="322" fontSize="20" fill={theme === 'dark' ? '#475569' : '#94a3b8'} fontWeight="600" textAnchor={i === 0 ? 'start' : i === 3 ? 'end' : 'middle'}>{yr}</text>
                                        ))}
                                    </svg>
                                </div>

                                {/* Chart 2: Demographic Pyramid */}
                                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 transition-colors">
                                    <h2 className="text-base font-bold">{t('pyrTitle')}</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-4">{t('pyrSub', { year: currentYear })}</p>
                                    <svg viewBox="-10 -10 460 315" className="w-full h-auto" aria-label={t('pyrTitle')}>
                                        {(() => {
                                            // Aggregate to 5-year age bands for smooth, readable bars
                                            const ageBands = [];
                                            for (let g = 0; g < 20; g++) {
                                                let total = 0;
                                                for (let age = g * 5; age <= g * 5 + 4; age++) total += currentPopArray[age];
                                                ageBands.push({ startAge: g * 5, total });
                                            }
                                            ageBands.push({ startAge: 100, total: currentPopArray[100] });
                                            const maxBand = Math.max(...ageBands.map(b => b.total));
                                            const barH = 13, stride = 14, maxBarW = 185, cx = 225;
                                            const getY = (idx) => (20 - idx) * stride;
                                            const barFill = (startAge) => startAge < 15
                                                ? (theme === 'dark' ? '#4ade80' : '#22c55e')
                                                : startAge < 65
                                                    ? (theme === 'dark' ? '#818cf8' : '#6366f1')
                                                    : (theme === 'dark' ? '#c084fc' : '#a855f7');
                                            return (
                                                <>
                                                    <line x1={cx} y1={getY(20)} x2={cx} y2={getY(0) + barH} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} strokeWidth="1" />
                                                    {ageBands.map(({ startAge, total }, idx) => {
                                                        const w = maxBand > 0 ? (total / maxBand) * maxBarW : 0;
                                                        const y = getY(idx);
                                                        const fill = barFill(startAge);
                                                        const showLabel = startAge % 20 === 0;
                                                        return (
                                                            <g key={idx}>
                                                                <rect x={cx - w} y={y} width={w} height={barH} fill={fill} opacity="0.85" />
                                                                <rect x={cx} y={y} width={w} height={barH} fill={fill} opacity="0.85" />
                                                                {showLabel && (
                                                                    <text x={cx - 4} y={y + barH - 2} fontSize="13" fill={theme === 'dark' ? '#64748b' : '#94a3b8'} textAnchor="end">
                                                                        {startAge === 100 ? '100+' : startAge}
                                                                    </text>
                                                                )}
                                                            </g>
                                                        );
                                                    })}
                                                </>
                                            );
                                        })()}
                                    </svg>
                                    <div className="flex gap-4 justify-center mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                                        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500"></span>{t('youth')}</div>
                                        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-indigo-500"></span>{t('working')}</div>
                                        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-purple-500"></span>{t('elderly')}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Population Composition Chart */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 transition-colors">
                                <h2 className="text-base font-bold">{t('compTitle')}</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-4">{t('compSub')}</p>
                                <svg viewBox="-50 -5 880 220" className="w-full h-auto" aria-label={t('compTitle')}>
                                    {yAxisLabels.map(val => {
                                        const y = 200 - (val / (yAxisMax / 1e6)) * 200;
                                        return (
                                            <g key={val}>
                                                <line x1="0" y1={y} x2={CHART_W} y2={y} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} strokeWidth="1" />
                                                <text x="-8" y={y + 4} fontSize="11" fill={theme === 'dark' ? '#475569' : '#94a3b8'} textAnchor="end">{formatYLabel(val)}</text>
                                            </g>
                                        );
                                    })}
                                    {/* Total (dashed) */}
                                    <path d={history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${xPos(h.year)} ${200 - (h.total / yAxisMax) * 200}`).join(' ')}
                                        fill="none" stroke={theme === 'dark' ? '#334155' : '#cbd5e1'} strokeWidth="1.5" strokeDasharray="6 3" />
                                    {/* Working */}
                                    <path d={history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${xPos(h.year)} ${200 - (h.working / yAxisMax) * 200}`).join(' ')}
                                        fill="none" stroke={theme === 'dark' ? '#818cf8' : '#6366f1'} strokeWidth="2.5" />
                                    {/* Elderly */}
                                    <path d={history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${xPos(h.year)} ${200 - (h.elderly / yAxisMax) * 200}`).join(' ')}
                                        fill="none" stroke={theme === 'dark' ? '#c084fc' : '#a855f7'} strokeWidth="2" />
                                    {/* Youth */}
                                    <path d={history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${xPos(h.year)} ${200 - (h.youth / yAxisMax) * 200}`).join(' ')}
                                        fill="none" stroke={theme === 'dark' ? '#4ade80' : '#22c55e'} strokeWidth="2" />
                                    <line x1={xPos(currentYear)} y1="0" x2={xPos(currentYear)} y2="200" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7" />
                                </svg>
                                <div className="flex justify-between text-[11px] font-semibold text-slate-400 dark:text-slate-600 mt-1">
                                    <span>2025</span><span>2050</span><span>2075</span><span>2100</span>
                                </div>
                                <div className="flex flex-wrap gap-4 justify-center mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                                    <div className="flex items-center gap-1.5">
                                        <span className="block w-5 h-0" style={{ borderTop: '2px dashed #94a3b8' }}></span>
                                        {t('total')}
                                    </div>
                                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-indigo-500"></span>{t('working')}</div>
                                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-purple-500"></span>{t('elderly')}</div>
                                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500"></span>{t('youth')}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-200 dark:border-slate-800 pt-5 space-y-4">

                        {/* Data Sources (collapsible) */}
                        <div>
                            <button
                                onClick={() => setShowSources(!showSources)}
                                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                                <span className={`inline-block transition-transform ${showSources ? 'rotate-90' : ''}`}>▶</span>
                                {t('dataSources')}
                            </button>
                            {showSources && (
                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                                    {DATA_SOURCES.map((src, i) => (
                                        <div key={i} className="text-[11px] text-slate-400 dark:text-slate-600">
                                            <span className="font-semibold text-slate-500 dark:text-slate-500">{src.label}:</span>{' '}
                                            {src.url
                                                ? <a href={src.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-500 transition-colors">{src.text}</a>
                                                : src.text}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Links */}
                        <div className="flex justify-center">
                            <div className="text-xs text-slate-400 dark:text-slate-600 flex gap-4 flex-wrap justify-center">
                                <a href="https://lawrencehwang.github.io/global-demographics/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors underline">
                                    {lang === 'en' ? 'Live Demo' : lang === 'zh' ? '線上演示' : lang === 'ko' ? '라이브 데모' : 'ライブデモ'}
                                </a>
                                <span>·</span>
                                <a href="https://github.com/LawrenceHwang/global-demographics" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors underline">
                                    GitHub
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
