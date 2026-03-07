import React from 'react';
import { DATA_SOURCES } from '../data/sources';

/**
 * Footer with collapsible data sources and project links.
 */
function Footer({ showSources, setShowSources, t }) {
    return (
        <footer className="border-t border-slate-200 dark:border-slate-800 pt-5 space-y-4">
            {/* Data Sources (collapsible) */}
            <div>
                <button
                    onClick={() => setShowSources(!showSources)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors min-h-[44px]"
                    aria-expanded={showSources}
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

            {/* Links + Version */}
            <div className="flex flex-col items-center gap-2">
                <div className="text-xs text-slate-400 dark:text-slate-600 flex gap-4 flex-wrap justify-center">
                    <a href="https://lawrencehwang.github.io/global-demographics/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors underline">
                        {t('liveDemo')}
                    </a>
                    <span>·</span>
                    <a href="https://github.com/LawrenceHwang/global-demographics" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors underline">
                        {t('github')}
                    </a>
                </div>
                <div className="text-[10px] text-slate-300 dark:text-slate-700 font-mono tracking-wider select-all" aria-label="Application version">
                    v2.0.0
                </div>
            </div>
        </footer>
    );
}

export default React.memo(Footer);
