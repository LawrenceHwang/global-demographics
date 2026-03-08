import { Activity, AlertTriangle, Users } from 'lucide-react';
import React from 'react';
import { formatPopLocale } from '../utils/format';
import { formatDepRatio } from '../utils/metrics';

/**
 * Top-level metric summary cards (Total Pop, Dependency Ratio, Workforce).
 */
function MetricCards({ currentData, status, totalInit, t, lang }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-3 sm:p-5 transition-colors">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg flex-shrink-0">
                        <Users size={14} className="sm:hidden" /><Users size={18} className="hidden sm:block" />
                    </div>
                    <h3 className="text-[9px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight">{t('totalPop')}</h3>
                </div>
                <div className="text-lg sm:text-3xl font-bold tabular-nums">{formatPopLocale(currentData.total, lang)}</div>
                <div className="text-[9px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 hidden sm:block">{t('startingAt', { pop: formatPopLocale(totalInit, lang) })}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-3 sm:p-5 transition-colors">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${status.bg} ${status.color}`}>
                        <AlertTriangle size={14} className="sm:hidden" /><AlertTriangle size={18} className="hidden sm:block" />
                    </div>
                    <h3 className="text-[9px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight">{t('depRatio')}</h3>
                </div>
                <div className="text-lg sm:text-3xl font-bold tabular-nums">{formatDepRatio(currentData.depRatio, t)}</div>
                <div className={`text-[9px] sm:text-xs font-bold mt-0.5 sm:mt-1 ${status.color} leading-tight`}>{status.text}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-3 sm:p-5 transition-colors">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-lg flex-shrink-0">
                        <Activity size={14} className="sm:hidden" /><Activity size={18} className="hidden sm:block" />
                    </div>
                    <h3 className="text-[9px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight">{t('workforceSize')}</h3>
                </div>
                <div className="text-lg sm:text-3xl font-bold tabular-nums">{formatPopLocale(currentData.working, lang)}</div>
                <div className="text-[9px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 hidden sm:block">
                    {t('supports', { num: formatPopLocale(currentData.youth + currentData.elderly, lang) })}
                </div>
            </div>
        </div>
    );
}

export default React.memo(MetricCards);
