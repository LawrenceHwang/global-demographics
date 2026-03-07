import { useState } from 'react';
import { useTranslation } from './i18n/useTranslation';
import { useTheme } from './hooks/useTheme';
import { usePlayback } from './hooks/usePlayback';
import { useSimulation } from './hooks/useSimulation';
import { getDependencyStatus } from './components/StatusBanner';
import Header from './components/Header';
import StatusBanner from './components/StatusBanner';
import CountrySelector from './components/CountrySelector';
import PlaybackControls from './components/PlaybackControls';
import TfrControls from './components/TfrControls';
import MigrationControls from './components/MigrationControls';
import DependencyKey from './components/DependencyKey';
import MetricCards from './components/MetricCards';
import Footer from './components/Footer';
import DependencyTrajectory from './components/charts/DependencyTrajectory';
import DemographicPyramid from './components/charts/DemographicPyramid';
import PopulationComposition from './components/charts/PopulationComposition';

export default function App() {
    const [lang, setLang] = useState('en');
    const [showControls, setShowControls] = useState(false);
    const [showSources, setShowSources] = useState(false);

    const t = useTranslation(lang);
    const { theme, toggleTheme } = useTheme();
    const { currentYear, isPlaying, togglePlay, reset, seekTo } = usePlayback();
    const sim = useSimulation(reset);

    const { data: currentData, popArray: currentPopArray } = sim.getDataForYear(currentYear);
    const status = getDependencyStatus(currentData.depRatio, t);

    return (
        <div className={`${theme === 'dark' ? 'dark' : ''}`}>
            <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">

                <Header
                    t={t} lang={lang} setLang={setLang}
                    theme={theme} toggleTheme={toggleTheme}
                    showControls={showControls} setShowControls={setShowControls}
                />

                <main className="max-w-7xl mx-auto px-4 py-5 flex flex-col gap-5">

                    <StatusBanner
                        status={status} currentData={currentData}
                        currentYear={currentYear} flag={sim.cfg.flag} t={t} lang={lang}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

                        {/* LEFT PANEL: CONTROLS */}
                        <div className={`lg:col-span-1 flex-col gap-4 ${showControls ? 'flex' : 'hidden lg:flex'}`}>
                            <CountrySelector country={sim.country} onCountryChange={sim.handleCountryChange} t={t} />
                            <PlaybackControls currentYear={currentYear} isPlaying={isPlaying} togglePlay={togglePlay} reset={reset} seekTo={seekTo} t={t} />
                            <TfrControls
                                tfr={sim.tfr} setTfr={sim.setTfr}
                                isDynamicTfr={sim.isDynamicTfr} setIsDynamicTfr={sim.setIsDynamicTfr}
                                terminalTfr={sim.terminalTfr} setTerminalTfr={sim.setTerminalTfr}
                                terminalYear={sim.terminalYear} setTerminalYear={sim.setTerminalYear}
                                country={sim.country} cfg={sim.cfg} t={t}
                            />
                            <MigrationControls migration={sim.migration} setMigration={sim.setMigration} cfg={sim.cfg} t={t} />
                            <DependencyKey t={t} />
                        </div>

                        {/* RIGHT PANEL: DASHBOARD */}
                        <div className="lg:col-span-3 flex flex-col gap-5">
                            <MetricCards currentData={currentData} status={status} totalInit={sim.totalInit} t={t} lang={lang} />
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                                <DependencyTrajectory history={sim.history} currentYear={currentYear} currentData={currentData} theme={theme} t={t} />
                                <DemographicPyramid currentPopArray={currentPopArray} currentYear={currentYear} theme={theme} t={t} />
                            </div>
                            <PopulationComposition history={sim.history} currentYear={currentYear} theme={theme} t={t} />
                        </div>
                    </div>

                    <Footer showSources={showSources} setShowSources={setShowSources} t={t} />
                </main>
            </div>
        </div>
    );
}
