import React from 'react';
import { COUNTRY_CONFIG, COUNTRY_KEYS } from '../data/countries';

/**
 * Country selection grid with flag buttons.
 */
function CountrySelector({ country, onCountryChange, t }) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 transition-colors">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">{t('country')}</p>
            <div className="grid grid-cols-3 gap-1.5" role="group" aria-label={t('country')}>
                {COUNTRY_KEYS.map((key) => (
                    <button
                        key={key}
                        onClick={() => onCountryChange(key)}
                        aria-pressed={country === key}
                        className={`flex flex-col items-center gap-0.5 p-2 rounded-xl text-center transition-all min-h-[44px] ${country === key
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
    );
}

export default React.memo(CountrySelector);
