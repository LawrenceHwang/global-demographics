import { Activity, AlertTriangle, ChevronDown, ChevronUp, Globe, Info, Moon, Pause, Play, RotateCcw, Settings2, Sun, Users } from 'lucide-react';
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
        videoTitle: "How China blew up its own future (Max Fisher)",
        controls: "Controls",
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
        videoTitle: "How China blew up its own future (Max Fisher)",
        controls: "參數設定",
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
        videoTitle: "How China blew up its own future (Max Fisher)",
        controls: "제어판",
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
        videoTitle: "How China blew up its own future (Max Fisher)",
        controls: "コントロール",
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
    const [showControls, setShowControls] = useState(false);

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
        if (ratio < 50) return { text: t('statusHealthy'), color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/30", border: "border-emerald-200 dark:border-emerald-800" };
        if (ratio < 65) return { text: t('statusWarning'), color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/30", border: "border-amber-200 dark:border-amber-800" };
        if (ratio < 80) return { text: t('statusSevere'), color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/30", border: "border-orange-200 dark:border-orange-800" };
        if (ratio < 100) return { text: t('statusEmergency'), color: "text-red-700 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/30", border: "border-red-200 dark:border-red-800" };
        return { text: t('statusCollapse'), color: "text-rose-700 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/30", border: "border-rose-200 dark:border-rose-800" };
    };

    const status = getDependencyStatus(currentData.depRatio);

    // Chart SVG helpers — chart area is 0-760, leaving room for y-axis labels
    const CHART_W = 760;
    const xPos = (year) => ((year - 2025) / 75) * CHART_W;

    return (
        <div className={`${theme === 'dark' ? 'dark' : ''}`}>
            <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">

                {/* Sticky App Bar */}
                <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
                        {/* Brand */}
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-indigo-300 dark:shadow-none">
                                <Users size={14} className="text-white" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-sm font-bold truncate leading-tight">{t('title')}</h1>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block leading-none">{t('subtitle')}</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Mobile controls toggle */}
                            <button
                                className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors"
                                onClick={() => setShowControls(!showControls)}
                                aria-label="Toggle controls"
                            >
                                <Settings2 size={12} />
                                <span className="hidden xs:inline">{t('controls')}</span>
                                {showControls ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>

                            {/* Language */}
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

                            {/* Theme toggle */}
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
                                    <span className="hidden sm:inline"> · {t('totalPop')}: <span className="font-semibold">{(currentData.total / 1e6).toFixed(1)}M</span></span>
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

                                {/* Mode Toggle */}
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
                                            type="range" min="0.5" max="3.0" step="0.01" value={tfr}
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
                                                    type="range" min="0.5" max="3.0" step="0.01" value={terminalTfr}
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
                                        : t('repRateNote')}
                                </p>
                            </div>

                            {/* Migration Card */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 transition-colors">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">{t('netMigration')}</p>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-medium text-slate-700 dark:text-slate-300">{t('netMigration')}</span>
                                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+{migration.toLocaleString()}</span>
                                </div>
                                <input
                                    type="range" min="0" max="300000" step="5000" value={migration}
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

                            {/* Metric Cards — always 3 columns, font adapts */}
                            <div className="grid grid-cols-3 gap-3">
                                {/* Total Population */}
                                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-3 sm:p-5 transition-colors">
                                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                        <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg flex-shrink-0">
                                            <Users size={14} className="sm:hidden" /><Users size={18} className="hidden sm:block" />
                                        </div>
                                        <h3 className="text-[9px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight">{t('totalPop')}</h3>
                                    </div>
                                    <div className="text-lg sm:text-3xl font-bold tabular-nums">{(currentData.total / 1e6).toFixed(1)}M</div>
                                    <div className="text-[9px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 hidden sm:block">{t('startingAt')}</div>
                                </div>

                                {/* Dependency Ratio */}
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

                                {/* Workforce */}
                                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-3 sm:p-5 transition-colors">
                                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                        <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-lg flex-shrink-0">
                                            <Activity size={14} className="sm:hidden" /><Activity size={18} className="hidden sm:block" />
                                        </div>
                                        <h3 className="text-[9px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight">{t('workforceSize')}</h3>
                                    </div>
                                    <div className="text-lg sm:text-3xl font-bold tabular-nums">{(currentData.working / 1e6).toFixed(1)}M</div>
                                    <div className="text-[9px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 hidden sm:block">
                                        {t('supports', { num: ((currentData.youth + currentData.elderly) / 1e6).toFixed(1) })}
                                    </div>
                                </div>
                            </div>

                            {/* Charts Row */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

                                {/* Chart 1: Dependency Ratio Trajectory */}
                                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 transition-colors">
                                    <h2 className="text-base font-bold">{t('trajTitle')}</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-4">{t('trajSub')}</p>

                                    {/* SVG with viewBox that includes space for right-side y-axis labels */}
                                    <svg viewBox="0 -5 840 315" className="w-full h-auto" aria-label={t('trajTitle')}>
                                        {/* Status zone bands — chart area 0-760 */}
                                        <rect x="0" y={(150 - 50) * 2.5} width={CHART_W} height={50 * 2.5} fill={theme === 'dark' ? "#064e3b" : "#dcfce7"} opacity="0.35" />
                                        <rect x="0" y={(150 - 65) * 2.5} width={CHART_W} height={15 * 2.5} fill={theme === 'dark' ? "#78350f" : "#fef9c3"} opacity="0.35" />
                                        <rect x="0" y={(150 - 80) * 2.5} width={CHART_W} height={15 * 2.5} fill={theme === 'dark' ? "#7c2d12" : "#fed7aa"} opacity="0.35" />
                                        <rect x="0" y={0} width={CHART_W} height={70 * 2.5} fill={theme === 'dark' ? "#7f1d1d" : "#fecaca"} opacity="0.35" />

                                        {/* Grid lines + right-side labels (at x=770+, well inside 840 viewBox) */}
                                        {[50, 65, 80, 100, 130].map(val => {
                                            const y = (150 - val) * 2.5;
                                            return (
                                                <g key={val}>
                                                    <line x1="0" y1={y} x2={CHART_W} y2={y} stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} strokeWidth="1.5" strokeDasharray="5 4" />
                                                    <text x={CHART_W + 10} y={y + 4} fontSize="13" fill={theme === 'dark' ? '#64748b' : '#94a3b8'} fontWeight="600">{val}</text>
                                                </g>
                                            );
                                        })}

                                        {/* Area fill under line */}
                                        <path
                                            d={[
                                                ...history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${xPos(h.year)} ${(150 - Math.min(150, h.depRatio)) * 2.5}`),
                                                `L ${CHART_W} 300`,
                                                'L 0 300',
                                                'Z'
                                            ].join(' ')}
                                            fill={theme === 'dark' ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.06)'}
                                        />

                                        {/* Main trend line */}
                                        <path
                                            d={history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${xPos(h.year)} ${(150 - Math.min(150, h.depRatio)) * 2.5}`).join(' ')}
                                            fill="none"
                                            stroke={theme === 'dark' ? '#e2e8f0' : '#334155'}
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />

                                        {/* Current year marker */}
                                        <line
                                            x1={xPos(currentYear)} y1="0"
                                            x2={xPos(currentYear)} y2="300"
                                            stroke="#6366f1" strokeWidth="2" strokeDasharray="5 3"
                                        />
                                        <circle
                                            cx={xPos(currentYear)}
                                            cy={(150 - Math.min(150, currentData.depRatio)) * 2.5}
                                            r="5" fill="#6366f1" stroke={theme === 'dark' ? '#0f172a' : 'white'} strokeWidth="2.5"
                                        />
                                    </svg>

                                    {/* X-axis labels */}
                                    <div className="flex justify-between text-[11px] font-semibold text-slate-400 dark:text-slate-600 mt-1 pr-12">
                                        <span>2025</span><span>2050</span><span>2075</span><span>2100</span>
                                    </div>
                                </div>

                                {/* Chart 2: Demographic Pyramid */}
                                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 transition-colors">
                                    <h2 className="text-base font-bold">{t('pyrTitle')}</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-4">{t('pyrSub', { year: currentYear })}</p>

                                    {/* Pyramid uses full width, viewBox gives space for age labels on left */}
                                    <svg viewBox="-22 -5 462 318" className="w-full h-auto" aria-label={t('pyrTitle')}>
                                        {/* Center axis */}
                                        <line x1="200" y1="0" x2="200" y2="305" stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} strokeWidth="1.5" />

                                        {/* Age labels every 10 years */}
                                        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(age => (
                                            <text key={age} x="188" y={305 - (age * 3) + 4} fontSize="9" fill={theme === 'dark' ? '#475569' : '#94a3b8'} textAnchor="end">{age}</text>
                                        ))}

                                        {/* Population bars (both sides mirrored) */}
                                        {currentPopArray.map((pop, age) => {
                                            const w = Math.min((pop / 2 / 200000) * 185, 195);
                                            const y = 305 - (age * 3);
                                            const fill = age < 15
                                                ? (theme === 'dark' ? '#4ade80' : '#22c55e')
                                                : age < 65
                                                    ? (theme === 'dark' ? '#818cf8' : '#6366f1')
                                                    : (theme === 'dark' ? '#c084fc' : '#a855f7');
                                            return (
                                                <g key={age}>
                                                    <rect x={200 - w} y={y - 2.5} width={w} height={2.5} fill={fill} opacity="0.85" />
                                                    <rect x={200} y={y - 2.5} width={w} height={2.5} fill={fill} opacity="0.85" />
                                                </g>
                                            );
                                        })}
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

                                {/* viewBox extends left to include y-axis labels (-50) */}
                                <svg viewBox="-50 -5 880 220" className="w-full h-auto" aria-label={t('compTitle')}>
                                    {/* Grid lines + left-side labels */}
                                    {[5, 10, 15, 20, 25].map(val => {
                                        const y = 200 - (val / 25) * 200;
                                        return (
                                            <g key={val}>
                                                <line x1="0" y1={y} x2={CHART_W} y2={y} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} strokeWidth="1" />
                                                <text x="-8" y={y + 4} fontSize="11" fill={theme === 'dark' ? '#475569' : '#94a3b8'} textAnchor="end">{val}M</text>
                                            </g>
                                        );
                                    })}

                                    {/* Total (dashed) */}
                                    <path
                                        d={history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${xPos(h.year)} ${200 - (h.total / 25e6) * 200}`).join(' ')}
                                        fill="none" stroke={theme === 'dark' ? '#334155' : '#cbd5e1'} strokeWidth="1.5" strokeDasharray="6 3"
                                    />
                                    {/* Working */}
                                    <path
                                        d={history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${xPos(h.year)} ${200 - (h.working / 25e6) * 200}`).join(' ')}
                                        fill="none" stroke={theme === 'dark' ? '#818cf8' : '#6366f1'} strokeWidth="2.5"
                                    />
                                    {/* Elderly */}
                                    <path
                                        d={history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${xPos(h.year)} ${200 - (h.elderly / 25e6) * 200}`).join(' ')}
                                        fill="none" stroke={theme === 'dark' ? '#c084fc' : '#a855f7'} strokeWidth="2"
                                    />
                                    {/* Youth */}
                                    <path
                                        d={history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${xPos(h.year)} ${200 - (h.youth / 25e6) * 200}`).join(' ')}
                                        fill="none" stroke={theme === 'dark' ? '#4ade80' : '#22c55e'} strokeWidth="2"
                                    />

                                    {/* Current year marker */}
                                    <line
                                        x1={xPos(currentYear)} y1="0"
                                        x2={xPos(currentYear)} y2="200"
                                        stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7"
                                    />
                                </svg>

                                {/* X-axis + Legend */}
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
                    <div className="border-t border-slate-200 dark:border-slate-800 pt-5 flex justify-center">
                        <div className="text-xs text-slate-400 dark:text-slate-600 flex gap-4 flex-wrap justify-center">
                            <a href="https://lawrencehwang.github.io/taiwan-demographics/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors underline">
                                {lang === 'en' ? 'Live Demo' : lang === 'zh' ? '線上演示' : lang === 'ko' ? '라이브 데모' : 'ライブデモ'}
                            </a>
                            <span>·</span>
                            <a href="https://github.com/LawrenceHwang/taiwan-demographics" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors underline">
                                GitHub
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
