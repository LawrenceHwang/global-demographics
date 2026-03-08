import { AlertTriangle } from 'lucide-react';
import React from 'react';
import { DEP_THRESHOLD_EMERGENCY, DEP_THRESHOLD_HEALTHY, DEP_THRESHOLD_SEVERE, DEP_THRESHOLD_WARNING } from '../data/constants';
import { formatPopLocale } from '../utils/format';
import { formatDepRatio } from '../utils/metrics';

/**
 * Get dependency status styling and label based on the ratio value.
 */
export function getDependencyStatus(ratio, t) {
    if (!Number.isFinite(ratio)) return { text: t('statusCollapse'), color: "text-rose-700 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/30", border: "border-rose-200 dark:border-rose-800" };
    if (ratio < DEP_THRESHOLD_HEALTHY) return { text: t('statusHealthy'), color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/30", border: "border-emerald-200 dark:border-emerald-800" };
    if (ratio < DEP_THRESHOLD_WARNING) return { text: t('statusWarning'), color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/30", border: "border-amber-200 dark:border-amber-800" };
    if (ratio < DEP_THRESHOLD_SEVERE) return { text: t('statusSevere'), color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/30", border: "border-orange-200 dark:border-orange-800" };
    if (ratio < DEP_THRESHOLD_EMERGENCY) return { text: t('statusEmergency'), color: "text-red-700 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/30", border: "border-red-200 dark:border-red-800" };
    return { text: t('statusCollapse'), color: "text-rose-700 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/30", border: "border-rose-200 dark:border-rose-800" };
}

/**
 * Status banner showing dependency ratio, total population, and current year.
 */
function StatusBanner({ status, currentData, currentYear, flag, t, lang }) {
    return (
        <div
            className={`${status.bg} ${status.border} border rounded-2xl p-4 flex items-center justify-between gap-4 transition-colors`}
            role="status"
            aria-live="polite"
        >
            <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2 rounded-xl ${status.bg} ${status.color} flex-shrink-0`}>
                    <AlertTriangle size={18} />
                </div>
                <div className="min-w-0">
                    <div className={`text-sm font-bold ${status.color} leading-tight truncate`}>{status.text}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        <span className="hidden sm:inline">{t('depRatio')}: </span>
                        <span className="font-semibold">{formatDepRatio(currentData.depRatio, t)}</span>
                        <span className="hidden sm:inline"> · {t('totalPop')}: <span className="font-semibold">{formatPopLocale(currentData.total, lang)}</span></span>
                        <span className="ml-2">{flag}</span>
                    </div>
                </div>
            </div>
            <div className="text-right flex-shrink-0">
                <div className="text-2xl sm:text-3xl font-mono font-bold">{currentYear}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('simYear')}</div>
            </div>
        </div>
    );
}

export default React.memo(StatusBanner);
