export const DEP_RATIO_CHART_NULL_FALLBACK = 120;

export function formatDepRatio(ratio, t) {
    if (Number.isFinite(ratio)) return ratio.toFixed(1);
    return typeof t === 'function' ? t('depRatioUnavailable') : 'No workforce';
}

export function getNumericDepRatioForCharts(ratio, fallback = DEP_RATIO_CHART_NULL_FALLBACK) {
    return Number.isFinite(ratio) ? ratio : fallback;
}