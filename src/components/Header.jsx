import React from 'react';
import { ChevronDown, ChevronUp, Globe, Moon, Settings2, Sun, Users } from 'lucide-react';

/**
 * Sticky app bar with title, language selector, theme toggle, and mobile controls toggle.
 */
function Header({ t, lang, setLang, theme, toggleTheme, showControls, setShowControls }) {
    return (
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
                <nav className="flex items-center gap-2 flex-shrink-0" role="navigation" aria-label={t('controls')}>
                    <button
                        className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors"
                        onClick={() => setShowControls(!showControls)}
                        aria-label={t('ariaToggleControls')}
                        aria-expanded={showControls}
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
                            aria-label="Language"
                        >
                            <option value="en">EN</option>
                            <option value="zh">中文</option>
                            <option value="ko">한국어</option>
                            <option value="ja">日本語</option>
                        </select>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className="p-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        aria-label={t('ariaThemeToggle')}
                    >
                        {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                    </button>
                </nav>
            </div>
        </header>
    );
}

export default React.memo(Header);
