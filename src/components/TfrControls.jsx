import React from 'react';
import { TFR_MIN, TFR_MAX, TFR_STEP, SIM_END_YEAR } from '../data/constants';

/**
 * TFR controls card with fixed/dynamic toggle and sliders.
 */
function TfrControls({ tfr, setTfr, isDynamicTfr, setIsDynamicTfr, terminalTfr, setTerminalTfr, terminalYear, setTerminalYear, country, cfg, t }) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 transition-colors">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">{t('tfr')}</p>
            <div className="flex gap-1 mb-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl" role="group" aria-label={t('tfr')}>
                <button
                    className={`flex-1 text-xs py-2 rounded-lg font-semibold transition-all min-h-[36px] ${!isDynamicTfr ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    onClick={() => setIsDynamicTfr(false)}
                    aria-pressed={!isDynamicTfr}
                >{t('fixedTfr')}</button>
                <button
                    className={`flex-1 text-xs py-2 rounded-lg font-semibold transition-all min-h-[36px] ${isDynamicTfr ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    onClick={() => setIsDynamicTfr(true)}
                    aria-pressed={isDynamicTfr}
                >{t('dynamicTfr')}</button>
            </div>
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{isDynamicTfr ? t('startingTfr') : t('tfr')}</span>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{tfr.toFixed(2)}</span>
                    </div>
                    <input
                        type="range" min={TFR_MIN} max={TFR_MAX} step={TFR_STEP} value={tfr}
                        onChange={(e) => setTfr(parseFloat(e.target.value))}
                        className="w-full accent-indigo-600 dark:accent-indigo-400"
                        aria-label={t('ariaTfrSlider')}
                        aria-valuetext={tfr.toFixed(2)}
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
                                type="range" min={TFR_MIN} max={TFR_MAX} step={TFR_STEP} value={terminalTfr}
                                onChange={(e) => setTerminalTfr(parseFloat(e.target.value))}
                                className="w-full accent-indigo-600 dark:accent-indigo-400"
                                aria-label={t('ariaTerminalTfrSlider')}
                                aria-valuetext={terminalTfr.toFixed(2)}
                            />
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-medium text-slate-700 dark:text-slate-300">{t('targetYear')}</span>
                                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{terminalYear}</span>
                            </div>
                            <input
                                type="range" min="2030" max={SIM_END_YEAR} step="1" value={terminalYear}
                                onChange={(e) => setTerminalYear(parseInt(e.target.value))}
                                className="w-full accent-indigo-600 dark:accent-indigo-400"
                                aria-label={t('ariaTargetYearSlider')}
                                aria-valuetext={`${terminalYear}`}
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
    );
}

export default React.memo(TfrControls);
