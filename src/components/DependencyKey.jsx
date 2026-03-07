import React from 'react';
import { Info } from 'lucide-react';

/**
 * Info card explaining dependency ratio thresholds.
 */
function DependencyKey({ t }) {
    return (
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
    );
}

export default React.memo(DependencyKey);
