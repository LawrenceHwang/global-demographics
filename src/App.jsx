import { Activity, AlertTriangle, Globe, Info, Moon, Pause, Play, RotateCcw, Sun, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';


// --- DEMOGRAPHIC INITIALIZATION (TAIWAN 2025 PUBLIC DATA) ---
// Actuals roughly: Youth (0-14): 2.68M, Working (15-64): 15.95M, Elderly (65+): 4.67M. Total: ~23.3M
const initializeBasePopulation = () => {
    const pop = new Array(101).fill(0);

    // Create an approximate shape for the 2025 Taiwan demographic curve
    for (let i = 0; i <= 14; i++) pop[i] = 130000 + i * ((220000 - 130000) / 14);
    for (let i = 15; i <= 30; i++) pop[i] = 220000 + (i - 15) * ((300000 - 220000) / 15);
    for (let i = 31; i <= 45; i++) pop[i] = 300000 + (i - 31) * ((420000 - 300000) / 14);
    for (let i = 46; i <= 64; i++) pop[i] = 420000 - (i - 46) * ((420000 - 300000) / 18);
    for (let i = 65; i <= 85; i++) pop[i] = 300000 - (i - 65) * ((300000 - 80000) / 20);
    for (let i = 86; i <= 100; i++) pop[i] = 80000 - (i - 86) * ((80000 - 0) / 14);

    // Normalize to exact 2025 buckets
    let y = 0, w = 0, e = 0;
    for (let i = 0; i <= 14; i++) y += pop[i];
    for (let i = 15; i <= 64; i++) w += pop[i];
    for (let i = 65; i <= 100; i++) e += pop[i];

    const yFactor = 2680000 / y;
    const wFactor = 15950000 / w;
    const eFactor = 4670000 / e;

    for (let i = 0; i <= 14; i++) pop[i] *= yFactor;
    for (let i = 15; i <= 64; i++) pop[i] *= wFactor;
    for (let i = 65; i <= 100; i++) pop[i] *= eFactor;

    return pop;
};

const BASE_POP_2025 = initializeBasePopulation();

// Mortality rates approximated for modern life expectancy (~81 years)
const MORTALITY_RATES = new Array(101).fill(0).map((_, i) => {
    if (i === 0) return 0.0039; // Infant
    if (i < 15) return 0.0002;
    if (i < 40) return 0.0008;
    if (i < 60) return 0.002 + (i - 40) * 0.0003;
    if (i < 80) return 0.01 + (i - 60) * 0.002;
    if (i < 100) return 0.05 + (i - 80) * 0.015;
    return 0.3; // 100+
});

// --- ENGINE SIMULATION LOGIC ---
const runSimulation = (tfr, netMigration, isDynamicTfr, terminalTfr, terminalYear) => {
    let currentPop = [...BASE_POP_2025];
    const history = [];
    const popByYear = [];

    for (let year = 2025; year <= 2100; year++) {
        let youth = 0, working = 0, elderly = 0;

        // Categorize
        for (let i = 0; i <= 100; i++) {
            if (i <= 14) youth += currentPop[i];
            else if (i <= 64) working += currentPop[i];
            else elderly += currentPop[i];
        }

        const total = youth + working + elderly;
        const depRatio = ((youth + elderly) / working) * 100;

        history.push({ year, total, youth, working, elderly, depRatio });
        popByYear.push([...currentPop]);

        // Next year progression
        const nextPop = new Array(101).fill(0);

        // Calculate Births (Women age 15-49 roughly 50% of pop in that bracket)
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

        // TFR is lifetime births per woman. Divide by 35 reproductive years for annual rate.
        const births = women15to49 * (currentYearTfr / 35);
        nextPop[0] = births;

        // Apply aging and mortality
        for (let i = 1; i <= 100; i++) {
            nextPop[i] = currentPop[i - 1] * (1 - MORTALITY_RATES[i - 1]);
        }
        nextPop[100] += currentPop[100] * (1 - MORTALITY_RATES[100]); // Accumulate 100+

        // Apply Immigration (Assumed working-age adults migrating for work, ages 20-35)
        if (netMigration !== 0) {
            const immigrantPerBin = netMigration / 15;
            for (let i = 20; i < 35; i++) {
                // Prevent negative populations in case of extreme emigration
                nextPop[i] = Math.max(0, nextPop[i] + immigrantPerBin);
            }
        }

        currentPop = nextPop;
    }
    return { history, popByYear };
};

// --- I18N LOCALIZATION DICTIONARY ---
const translations = {
    en: {
        title: "Taiwan Demographics",
        subtitle: "Simulation Engine (2025 - 2100)",
        simYear: "Simulation Year",
        play: "Play",
        pause: "Pause",
        fixedTfr: "Fixed TFR",
        dynamicTfr: "Dynamic Target",
        startingTfr: "Starting TFR (2025)",
        tfr: "Total Fertility Rate (TFR)",
        terminalTfr: "Terminal Target TFR",
        targetYear: "Target Year",
        repRateNote: "Replacement rate is 2.1. Taiwan's actual 2025 rate is ~0.86, driving a sharp decline.",
        dynRateNote: "Linearly interpolates from {tfr} to {terminalTfr} by {terminalYear}.",
        netMigration: "Net Migration / Year",
        migrationNote: "The video notes that injecting working-age immigrants is the primary way countries (like the US) offset the dependency crisis.",
        videoKey: "Video Concept Key",
        depRatioDesc: "Dependency Ratio: Number of dependents (Children + Elderly) for every 100 working-age adults.",
        healthyDesc: "~45 (Healthy): Fuels economy.",
        declineDesc: "~70 (Decline): Japan today. Severe economic drag.",
        collapseDesc: "100+ (Collapse): 1 worker per dependent. Social systems fail.",
        totalPop: "Total Population",
        startingAt: "Starting 23.3M in 2025",
        depRatio: "Dependency Ratio",
        workforceSize: "Workforce Size",
        supports: "Supports {num}M dependents",
        trajTitle: "Dependency Ratio Trajectory",
        trajSub: "Dependents per 100 working-age adults (2025 - 2100)",
        pyrTitle: "Demographic Pyramid",
        pyrSub: "Population distribution by age ({year})",
        compTitle: "Population Composition Over Time",
        compSub: "Total numbers for each demographic bucket (Millions)",
        youth: "Youth (0-14)",
        working: "Working (15-64)",
        elderly: "Elderly (65+)",
        total: "Total",
        statusHealthy: "Healthy Demographic Dividend",
        statusWarning: "Aging Society (Warning)",
        statusSevere: "Severe Aging (National Decline)",
        statusEmergency: "Demographic Emergency",
        statusCollapse: "System Collapse (Upside-Down Pyramid)",
        creditPrefix: "Based on concepts from:",
        videoTitle: "How China blew up its own future (Max Fisher)"
    },
    zh: {
        title: "台灣人口統計",
        subtitle: "模擬引擎 (2025 - 2100)",
        simYear: "模擬年份",
        play: "播放",
        pause: "暫停",
        fixedTfr: "固定生育率",
        dynamicTfr: "動態目標",
        startingTfr: "起始生育率 (2025)",
        tfr: "總和生育率 (TFR)",
        terminalTfr: "最終目標生育率",
        targetYear: "目標年份",
        repRateNote: "替代率為 2.1。台灣 2025 年實際比率約為 0.86，導致人口急劇下降。",
        dynRateNote: "從 {tfr} 線性插值到 {terminalYear} 年的 {terminalTfr}。",
        netMigration: "每年淨移民人數",
        migrationNote: "影片指出，引入適齡勞動移民是各國（如美國）抵消撫養比危機的主要方式。",
        videoKey: "影片概念說明",
        depRatioDesc: "撫養比：每 100 名適齡勞動成年人對應的受撫養人數（兒童+老人）。",
        healthyDesc: "~45 (健康): 推動經濟發展。",
        declineDesc: "~70 (衰退): 今日日本。嚴重的經濟負擔。",
        collapseDesc: "100+ (崩潰): 1名工人對應1名受撫養者。社會系統崩潰。",
        totalPop: "總人口",
        startingAt: "2025年起始為 23.3M",
        depRatio: "撫養比",
        workforceSize: "勞動力規模",
        supports: "撫養 {num}M 名受撫養者",
        trajTitle: "撫養比軌跡",
        trajSub: "每 100 名勞動年齡成人的受撫養人數 (2025 - 2100)",
        pyrTitle: "人口金字塔",
        pyrSub: "按年齡劃分的人口分佈 ({year})",
        compTitle: "人口組成隨時間變化",
        compSub: "每個年齡段的總人數（百萬）",
        youth: "青年 (0-14)",
        working: "勞動 (15-64)",
        elderly: "老年 (65+)",
        total: "總計",
        statusHealthy: "健康的人口紅利",
        statusWarning: "高齡化社會 (警告)",
        statusSevere: "嚴重高齡化 (國家衰退)",
        statusEmergency: "人口緊急狀態",
        statusCollapse: "系統崩潰 (倒金字塔)",
        creditPrefix: "概念參考自影片：",
        videoTitle: "How China blew up its own future (Max Fisher)"
    },
    ko: {
        title: "대만 인구 통계",
        subtitle: "시뮬레이션 엔진 (2025 - 2100)",
        simYear: "시뮬레이션 연도",
        play: "재생",
        pause: "일시정지",
        fixedTfr: "고정 출산율",
        dynamicTfr: "동적 목표",
        startingTfr: "시작 출산율 (2025)",
        tfr: "합계출산율 (TFR)",
        terminalTfr: "최종 목표 출산율",
        targetYear: "목표 연도",
        repRateNote: "대체 출산율은 2.1입니다. 2025년 대만의 실제 비율은 약 0.86으로, 급격한 감소를 초래합니다.",
        dynRateNote: "{tfr}에서 {terminalYear}년까지 {terminalTfr}로 선형 보간됩니다.",
        netMigration: "연간 순 이동",
        migrationNote: "비디오는 노동 연령 이민자를 유입하는 것이 국가(미국 등)가 부양비 위기를 상쇄하는 주요 방법이라고 언급합니다.",
        videoKey: "비디오 개념 핵심",
        depRatioDesc: "부양비: 생산가능인구 100명당 피부양자(어린이+노인) 수.",
        healthyDesc: "~45 (건강): 경제를 촉진합니다.",
        declineDesc: "~70 (쇠퇴): 현재 일본. 심각한 경제적 부담.",
        collapseDesc: "100+ (붕괴): 노동자 1명당 피부양자 1명. 사회 시스템 실패.",
        totalPop: "총 인구",
        startingAt: "2025년 23.3M 시작",
        depRatio: "부양비",
        workforceSize: "노동력 규모",
        supports: "{num}M 명의 피부양자 지원",
        trajTitle: "부양비 궤적",
        trajSub: "생산가능인구 100명당 피부양자 수 (2025 - 2100)",
        pyrTitle: "인구 피라미드",
        pyrSub: "연령별 인구 분포 ({year})",
        compTitle: "시간에 따른 인구 구성",
        compSub: "각 인구 통계 버킷의 총 수 (백만)",
        youth: "유소년 (0-14)",
        working: "노동 (15-64)",
        elderly: "노인 (65+)",
        total: "총계",
        statusHealthy: "건강한 인구 배당금",
        statusWarning: "고령화 사회 (경고)",
        statusSevere: "심각한 고령화 (국가 쇠퇴)",
        statusEmergency: "인구 비상 사태",
        statusCollapse: "시스템 붕괴 (역피라미드)",
        creditPrefix: "다음 비디오의 개념을 바탕으로 함:",
        videoTitle: "How China blew up its own future (Max Fisher)"
    },
    ja: {
        title: "台湾の人口動態",
        subtitle: "シミュレーションエンジン (2025 - 2100)",
        simYear: "シミュレーション年",
        play: "再生",
        pause: "一時停止",
        fixedTfr: "固定出生率",
        dynamicTfr: "動的ターゲット",
        startingTfr: "開始出生率 (2025)",
        tfr: "合計特殊出生率 (TFR)",
        terminalTfr: "最終目標出生率",
        targetYear: "目標年",
        repRateNote: "人口置換水準は2.1です。2025年の台湾の実際の比率は約0.86であり、急激な減少をもたらしています。",
        dynRateNote: "{tfr}から{terminalYear}年までに{terminalTfr}まで線形補間します。",
        netMigration: "年間の純移動",
        migrationNote: "ビデオは、労働年齢の移民を受け入れることが、国（米国など）が従属人口指数危機を相殺する主な方法であると指摘しています。",
        videoKey: "ビデオの概念キー",
        depRatioDesc: "従属人口指数：生産年齢人口100人あたりの従属人口（子供+高齢者）の数。",
        healthyDesc: "~45 (健康): 経済を牽引。",
        declineDesc: "~70 (衰退): 今日の日本。深刻な経済的足かせ。",
        collapseDesc: "100+ (崩壊): 労働者1人につき従属人口1人。社会システムが破綻。",
        totalPop: "総人口",
        startingAt: "2025年に23.3Mから開始",
        depRatio: "従属人口指数",
        workforceSize: "労働力規模",
        supports: "{num}M人の従属人口を支援",
        trajTitle: "従属人口指数の軌跡",
        trajSub: "生産年齢人口100人あたりの従属人口 (2025 - 2100)",
        pyrTitle: "人口ピラミッド",
        pyrSub: "年齢別の人口分布 ({year})",
        compTitle: "経時的な人口構成",
        compSub: "各人口動態バケットの総数 (百万)",
        youth: "若者 (0-14)",
        working: "労働 (15-64)",
        elderly: "高齢者 (65+)",
        total: "合計",
        statusHealthy: "健全な人口ボーナス",
        statusWarning: "高齢化社会 (警告)",
        statusSevere: "深刻な高齢化 (国家衰退)",
        statusEmergency: "人口緊急事態",
        statusCollapse: "システム崩壊 (逆ピラミッド)",
        creditPrefix: "以下のビデオの概念に基づいています：",
        videoTitle: "How China blew up its own future (Max Fisher)"
    }
};


// --- UI COMPONENTS ---

export default function App() {
    const [theme, setTheme] = useState('dark');
    const [lang, setLang] = useState('en');

    const [tfr, setTfr] = useState(0.86); // Taiwan's 2024/2025 crisis level
    const [isDynamicTfr, setIsDynamicTfr] = useState(false);
    const [terminalTfr, setTerminalTfr] = useState(1.50);
    const [terminalYear, setTerminalYear] = useState(2050);
    const [migration, setMigration] = useState(20000);
    const [currentYear, setCurrentYear] = useState(2025);
    const [isPlaying, setIsPlaying] = useState(false);

    // Translation helper function
    const t = (key, params = {}) => {
        let str = translations[lang][key] || translations['en'][key] || key;
        Object.entries(params).forEach(([k, v]) => {
            str = str.replace(`{${k}}`, v);
        });
        return str;
    };

    // Run the massive simulation memoized whenever inputs change
    const { history, popByYear } = useMemo(() => runSimulation(tfr, migration, isDynamicTfr, terminalTfr, terminalYear), [tfr, migration, isDynamicTfr, terminalTfr, terminalYear]);
    const currentData = history.find(h => h.year === currentYear);
    const currentPopArray = popByYear[currentYear - 2025];

    // Playback Loop
    useEffect(() => {
        let interval;
        if (isPlaying) {
            interval = setInterval(() => {
                setCurrentYear(y => {
                    if (y >= 2100) {
                        setIsPlaying(false);
                        return 2100;
                    }
                    return y + 1;
                });
            }, 100); // 10 years per second
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    const getDependencyStatus = (ratio) => {
        if (ratio < 50) return { text: t('statusHealthy'), color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/40" };
        if (ratio < 65) return { text: t('statusWarning'), color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900/40" };
        if (ratio < 80) return { text: t('statusSevere'), color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/40" };
        if (ratio < 100) return { text: t('statusEmergency'), color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/40" };
        return { text: t('statusCollapse'), color: "text-rose-700 dark:text-rose-400", bg: "bg-rose-100 dark:bg-rose-900/40" };
    };

    const status = getDependencyStatus(currentData.depRatio);

    return (
        <div className={`${theme === 'dark' ? 'dark' : ''}`}>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans p-4 md:p-8 flex flex-col items-center transition-colors duration-300">

                {/* Top App Bar */}
                <div className="max-w-7xl w-full flex justify-end items-center gap-4 mb-6">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full shadow-sm">
                        <Globe size={16} className="text-slate-500 dark:text-slate-400" />
                        <select
                            className="bg-transparent text-sm font-medium outline-none cursor-pointer dark:text-slate-200"
                            value={lang}
                            onChange={(e) => setLang(e.target.value)}
                        >
                            <option value="en">English</option>
                            <option value="zh">繁體中文 (ZH-TW)</option>
                            <option value="ko">한국어 (Korean)</option>
                            <option value="ja">日本語 (Japanese)</option>
                        </select>
                    </div>
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-sm text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>

                <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-4 gap-6">

                    {/* LEFT PANEL: CONTROLS */}
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-colors">
                            <h1 className="text-xl font-bold mb-1">{t('title')}</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t('subtitle')}</p>

                            <div className="space-y-6">
                                {/* Playback */}
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex justify-between">
                                        <span>{t('simYear')}</span>
                                        <span className="text-blue-600 dark:text-blue-400 font-mono font-bold">{currentYear}</span>
                                    </label>
                                    <input
                                        type="range" min="2025" max="2100" value={currentYear}
                                        onChange={(e) => { setCurrentYear(parseInt(e.target.value)); setIsPlaying(false); }}
                                        className="w-full accent-blue-600 dark:accent-blue-500 mb-3"
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={() => setIsPlaying(!isPlaying)} className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white py-2 rounded-lg flex items-center justify-center font-medium transition-colors">
                                            {isPlaying ? <Pause size={18} className="mr-2" /> : <Play size={18} className="mr-2" />}
                                            {isPlaying ? t('pause') : t('play')}
                                        </button>
                                        <button onClick={() => { setCurrentYear(2025); setIsPlaying(false); }} className="px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg flex items-center transition-colors">
                                            <RotateCcw size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="h-px bg-slate-100 dark:bg-slate-700"></div>

                                {/* TFR Configuration */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <div className="flex gap-2 mb-4 p-1 bg-slate-200 dark:bg-slate-700/50 rounded-lg">
                                        <button
                                            className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${!isDynamicTfr ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                            onClick={() => setIsDynamicTfr(false)}
                                        >
                                            {t('fixedTfr')}
                                        </button>
                                        <button
                                            className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${isDynamicTfr ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                            onClick={() => setIsDynamicTfr(true)}
                                        >
                                            {t('dynamicTfr')}
                                        </button>
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex justify-between">
                                            <span>{isDynamicTfr ? t('startingTfr') : t('tfr')}</span>
                                            <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">{tfr.toFixed(2)}</span>
                                        </label>
                                        <input
                                            type="range" min="0.5" max="3.0" step="0.01" value={tfr}
                                            onChange={(e) => setTfr(parseFloat(e.target.value))}
                                            className="w-full accent-indigo-600 dark:accent-indigo-500"
                                        />
                                    </div>

                                    {isDynamicTfr && (
                                        <div className="mt-4 space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                            <div>
                                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex justify-between">
                                                    <span>{t('terminalTfr')}</span>
                                                    <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">{terminalTfr.toFixed(2)}</span>
                                                </label>
                                                <input
                                                    type="range" min="0.5" max="3.0" step="0.01" value={terminalTfr}
                                                    onChange={(e) => setTerminalTfr(parseFloat(e.target.value))}
                                                    className="w-full accent-indigo-600 dark:accent-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex justify-between">
                                                    <span>{t('targetYear')}</span>
                                                    <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">{terminalYear}</span>
                                                </label>
                                                <input
                                                    type="range" min="2030" max="2100" step="1" value={terminalYear}
                                                    onChange={(e) => setTerminalYear(parseInt(e.target.value))}
                                                    className="w-full accent-indigo-600 dark:accent-indigo-500"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
                                        {isDynamicTfr
                                            ? t('dynRateNote', { tfr: tfr.toFixed(2), terminalTfr: terminalTfr.toFixed(2), terminalYear })
                                            : t('repRateNote')}
                                    </p>
                                </div>

                                {/* Migration Slider */}
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex justify-between">
                                        <span>{t('netMigration')}</span>
                                        <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{(migration).toLocaleString()}</span>
                                    </label>
                                    <input
                                        type="range" min="0" max="300000" step="5000" value={migration}
                                        onChange={(e) => setMigration(parseInt(e.target.value))}
                                        className="w-full accent-emerald-600 dark:accent-emerald-500"
                                    />
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                                        {t('migrationNote')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800 transition-colors">
                            <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-3 flex items-center">
                                <Info size={16} className="mr-2" /> {t('videoKey')}
                            </h3>
                            <ul className="text-xs text-indigo-800 dark:text-indigo-200/80 space-y-2">
                                <li><strong>{t('depRatioDesc').split(':')[0]}</strong>: {t('depRatioDesc').split(':')[1]}</li>
                                <li><span className="font-semibold text-emerald-600 dark:text-emerald-400">{t('healthyDesc').split(':')[0]}:</span> {t('healthyDesc').split(':')[1]}</li>
                                <li><span className="font-semibold text-orange-600 dark:text-orange-400">{t('declineDesc').split(':')[0]}:</span> {t('declineDesc').split(':')[1]}</li>
                                <li><span className="font-semibold text-rose-600 dark:text-rose-400">{t('collapseDesc').split(':')[0]}:</span> {t('collapseDesc').split(':')[1]}</li>
                            </ul>

                            <div className="mt-4 pt-4 border-t border-indigo-200 dark:border-indigo-800/50">
                                <p className="text-xs text-indigo-900 dark:text-indigo-300/80">
                                    {t('creditPrefix')} <br />
                                    <a
                                        href="https://www.youtube.com/watch?v=AultJcNb90c"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-semibold text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800 dark:hover:text-indigo-200 transition-colors"
                                    >
                                        {t('videoTitle')}
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: DASHBOARD */}
                    <div className="lg:col-span-3 flex flex-col gap-6">

                        {/* Top Metrics Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg"><Users size={20} /></div>
                                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('totalPop')}</h3>
                                </div>
                                <div className="text-3xl font-bold">{(currentData.total / 1000000).toFixed(2)}M</div>
                                <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">{t('startingAt')}</div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`p-2 rounded-lg ${status.bg} ${status.color}`}><AlertTriangle size={20} /></div>
                                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('depRatio')}</h3>
                                </div>
                                <div className="text-3xl font-bold">{currentData.depRatio.toFixed(1)}</div>
                                <div className={`text-xs font-semibold mt-1 ${status.color}`}>{status.text}</div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-lg"><Activity size={20} /></div>
                                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('workforceSize')}</h3>
                                </div>
                                <div className="text-3xl font-bold">{(currentData.working / 1000000).toFixed(2)}M</div>
                                <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                    {t('supports', { num: ((currentData.youth + currentData.elderly) / 1000000).toFixed(2) })}
                                </div>
                            </div>
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                            {/* Chart 1: Dependency Trajectory */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-colors">
                                <h2 className="text-lg font-bold mb-1">{t('trajTitle')}</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">{t('trajSub')}</p>

                                <div className="relative w-full h-64">
                                    <svg viewBox="0 0 800 300" className="w-full h-full overflow-visible">
                                        {/* Bands */}
                                        <rect x="0" y={(150 - 50) * 2.5} width="800" height={50 * 2.5} fill={theme === 'dark' ? "#064e3b" : "#dcfce7"} opacity={theme === 'dark' ? "0.3" : "0.4"} />
                                        <rect x="0" y={(150 - 65) * 2.5} width="800" height={15 * 2.5} fill={theme === 'dark' ? "#713f12" : "#fef08a"} opacity={theme === 'dark' ? "0.3" : "0.4"} />
                                        <rect x="0" y={(150 - 80) * 2.5} width="800" height={15 * 2.5} fill={theme === 'dark' ? "#7c2d12" : "#fed7aa"} opacity={theme === 'dark' ? "0.3" : "0.4"} />
                                        <rect x="0" y={0} width="800" height={70 * 2.5} fill={theme === 'dark' ? "#7f1d1d" : "#fecaca"} opacity={theme === 'dark' ? "0.3" : "0.4"} />

                                        {/* Grid Lines & Labels */}
                                        {[50, 65, 80, 100, 130].map(val => {
                                            const y = (150 - val) * 2.5;
                                            return (
                                                <g key={val}>
                                                    <line x1="0" y1={y} x2="800" y2={y} stroke={theme === 'dark' ? '#334155' : '#cbd5e1'} strokeWidth="1" strokeDasharray="4 4" />
                                                    <text x="805" y={y + 4} fontSize="12" fill={theme === 'dark' ? '#94a3b8' : '#64748b'} fontWeight="bold">{val}</text>
                                                </g>
                                            )
                                        })}

                                        {/* Main Line */}
                                        <path
                                            d={history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${((h.year - 2025) / 75) * 800} ${(150 - Math.min(150, h.depRatio)) * 2.5}`).join(' ')}
                                            fill="none" stroke={theme === 'dark' ? '#cbd5e1' : '#1e293b'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                                        />

                                        {/* Current Year Marker */}
                                        <line
                                            x1={((currentYear - 2025) / 75) * 800} y1="0"
                                            x2={((currentYear - 2025) / 75) * 800} y2="300"
                                            stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4"
                                        />
                                        <circle
                                            cx={((currentYear - 2025) / 75) * 800}
                                            cy={(150 - Math.min(150, currentData.depRatio)) * 2.5}
                                            r="6" fill="#3b82f6" stroke={theme === 'dark' ? '#1e293b' : 'white'} strokeWidth="2"
                                        />
                                    </svg>
                                    {/* X Axis Labels */}
                                    <div className="flex justify-between mt-2 text-xs font-semibold text-slate-400">
                                        <span>2025</span>
                                        <span>2050</span>
                                        <span>2075</span>
                                        <span>2100</span>
                                    </div>
                                </div>
                            </div>

                            {/* Chart 2: Demographic Pyramid */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col transition-colors">
                                <h2 className="text-lg font-bold mb-1">{t('pyrTitle')}</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">{t('pyrSub', { year: currentYear })}</p>

                                <div className="flex-1 relative w-full flex flex-col justify-center items-center">
                                    <svg viewBox="0 0 400 300" className="w-full max-w-sm h-auto overflow-visible">
                                        {/* Center Line */}
                                        <line x1="200" y1="0" x2="200" y2="300" stroke={theme === 'dark' ? '#475569' : '#e2e8f0'} strokeWidth="1" />

                                        {/* Y Axis Age Labels (every 20 years) */}
                                        {[0, 20, 40, 60, 80, 100].map(age => (
                                            <text key={`label-${age}`} x="190" y={300 - (age * 3) + 4} fontSize="10" fill={theme === 'dark' ? '#64748b' : '#94a3b8'} textAnchor="end">{age}</text>
                                        ))}

                                        {/* Bars */}
                                        {currentPopArray.map((pop, age) => {
                                            // Maximum population mapped to width of 180 (so 2 sides = 360 wide max)
                                            // Peak is roughly ~200k per side in 2025 base
                                            const w = Math.min((pop / 2 / 200000) * 180, 195);
                                            const y = 300 - (age * 3);
                                            let fill = theme === 'dark' ? "rgb(192 132 252)" : "rgb(168 85 247)"; // Elderly
                                            if (age < 15) fill = theme === 'dark' ? "rgb(74 222 128)" : "rgb(34 197 94)"; // Youth
                                            else if (age < 65) fill = theme === 'dark' ? "rgb(96 165 250)" : "rgb(59 130 246)"; // Working

                                            return (
                                                <g key={age}>
                                                    <rect x={200 - w} y={y - 2} width={w} height={2.5} fill={fill} />
                                                    <rect x={200} y={y - 2} width={w} height={2.5} fill={fill} />
                                                </g>
                                            )
                                        })}
                                    </svg>

                                    {/* Legend */}
                                    <div className="flex gap-4 mt-6 text-xs font-medium text-slate-600 dark:text-slate-400">
                                        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-400"></span> {t('youth')}</div>
                                        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-500 dark:bg-blue-400"></span> {t('working')}</div>
                                        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-purple-500 dark:bg-purple-400"></span> {t('elderly')}</div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Absolute Population Breakdown Chart */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-colors">
                            <h2 className="text-lg font-bold mb-1">{t('compTitle')}</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">{t('compSub')}</p>

                            <div className="relative w-full h-48">
                                <svg viewBox="0 0 800 200" className="w-full h-full overflow-visible">
                                    {/* Grid Lines */}
                                    {[0, 5, 10, 15, 20, 25].map(val => {
                                        const y = 200 - (val / 25) * 200;
                                        return (
                                            <g key={val}>
                                                <line x1="0" y1={y} x2="800" y2={y} stroke={theme === 'dark' ? '#334155' : '#f1f5f9'} strokeWidth="1" />
                                                {val > 0 && <text x="-25" y={y + 4} fontSize="12" fill={theme === 'dark' ? '#64748b' : '#94a3b8'}>{val}M</text>}
                                            </g>
                                        )
                                    })}

                                    {/* Paths */}
                                    {/* Total */}
                                    <path d={history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${((h.year - 2025) / 75) * 800} ${200 - (h.total / 25000000) * 200}`).join(' ')}
                                        fill="none" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} strokeWidth="2" strokeDasharray="4 4" />
                                    {/* Working */}
                                    <path d={history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${((h.year - 2025) / 75) * 800} ${200 - (h.working / 25000000) * 200}`).join(' ')}
                                        fill="none" stroke={theme === 'dark' ? '#60a5fa' : '#3b82f6'} strokeWidth="3" />
                                    {/* Elderly */}
                                    <path d={history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${((h.year - 2025) / 75) * 800} ${200 - (h.elderly / 25000000) * 200}`).join(' ')}
                                        fill="none" stroke={theme === 'dark' ? '#c084fc' : '#a855f7'} strokeWidth="2" />
                                    {/* Youth */}
                                    <path d={history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${((h.year - 2025) / 75) * 800} ${200 - (h.youth / 25000000) * 200}`).join(' ')}
                                        fill="none" stroke={theme === 'dark' ? '#4ade80' : '#22c55e'} strokeWidth="2" />

                                    {/* Current Year Marker */}
                                    <line
                                        x1={((currentYear - 2025) / 75) * 800} y1="0"
                                        x2={((currentYear - 2025) / 75) * 800} y2="200"
                                        stroke={theme === 'dark' ? '#f8fafc' : '#1e293b'} strokeWidth="1" strokeDasharray="4 4"
                                    />
                                </svg>
                            </div>
                            <div className="flex gap-6 justify-center mt-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                                <div className="flex items-center gap-1"><span className="w-4 h-0.5 bg-slate-400 dark:bg-slate-500 border-dashed border-b"></span> {t('total')}</div>
                                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 dark:bg-blue-400"></span> {t('working')}</div>
                                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-purple-500 dark:bg-purple-400"></span> {t('elderly')}</div>
                                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 dark:bg-green-400"></span> {t('youth')}</div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="max-w-7xl w-full mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-center">
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex gap-4 flex-wrap justify-center">
                        <a href="https://lawrencehwang.github.io/taiwan-demographics/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors underline">
                            {lang === 'en' ? 'Live Demo' : lang === 'zh' ? '線上演示' : lang === 'ko' ? '라이브 데모' : 'ライブデモ'}
                        </a>
                        <span>•</span>
                        <a href="https://github.com/LawrenceHwang/taiwan-demographics" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors underline">
                            {lang === 'en' ? 'GitHub Repository' : lang === 'zh' ? 'GitHub 儲存庫' : lang === 'ko' ? 'GitHub 저장소' : 'GitHub リポジトリ'}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}