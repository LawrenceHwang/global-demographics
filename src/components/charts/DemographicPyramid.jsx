import React, { useCallback, useId, useMemo, useRef, useState } from 'react';
import { MAX_AGE } from '../../data/constants';
import ChartDataFallback from './ChartDataFallback';

/**
 * Age Distribution chart (single-sided horizontal bar chart).
 * Shows total population by 5-year age bands without implying a sex split.
 */
function DemographicPyramid({ currentPopArray, currentYear, theme, t }) {
    const [tooltip, setTooltip] = useState(null);
    const liveRegionRef = useRef(null);
    const tableId = useId();
    const isDark = theme === 'dark';

    // Aggregate to 5-year age bands
    const ageBands = useMemo(() => {
        const bands = [];
        for (let g = 0; g < 20; g++) {
            let total = 0;
            for (let age = g * 5; age <= g * 5 + 4; age++) total += currentPopArray[age];
            bands.push({ startAge: g * 5, total });
        }
        bands.push({ startAge: MAX_AGE, total: currentPopArray[MAX_AGE] });
        return bands;
    }, [currentPopArray]);

    const maxBand = useMemo(() => Math.max(...ageBands.map(b => b.total)), [ageBands]);

    const barH = 13, stride = 14, maxBarW = 240, barX = 90;
    const LABEL_X = 70;
    const getY = (idx) => (20 - idx) * stride;
    const labelColor = isDark ? '#94a3b8' : '#475569';

    const barFill = (startAge) => startAge < 15
        ? (isDark ? '#4ade80' : '#22c55e')
        : startAge < 65
            ? (isDark ? '#818cf8' : '#6366f1')
            : (isDark ? '#c084fc' : '#a855f7');

    const formatNum = (n) => {
        if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
        if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
        return `${Math.round(n)}`;
    };

    const bandLabel = (startAge) => startAge === MAX_AGE ? '100+' : `${startAge}–${startAge + 4}`;

    const showTooltip = useCallback((band, idx) => {
        const y = getY(idx);
        const w = maxBand > 0 ? (band.total / maxBand) * maxBarW : 0;
        const label = bandLabel(band.startAge);
        const value = formatNum(band.total);
        setTooltip({ x: Math.min(barX + w + 8, 336), y: y + barH / 2, label, value });
        if (liveRegionRef.current) {
            liveRegionRef.current.textContent = `${t('pyrTitle')}. Age ${label}: ${value}.`;
        }
    }, [barX, maxBand, t]);

    const hideTooltip = useCallback(() => {
        setTooltip(null);
        if (liveRegionRef.current) liveRegionRef.current.textContent = '';
    }, []);

    const handleBarKey = useCallback((e, band, idx) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            showTooltip(band, idx);
        }
    }, [showTooltip]);

    const tableRows = useMemo(
        () => ageBands.map(band => [bandLabel(band.startAge), Math.round(band.total)]),
        [ageBands]
    );

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 transition-colors">
            <h2 className="text-base font-bold">{t('pyrTitle')}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-4">{t('pyrSub', { year: currentYear })}</p>
            {/* Screen-reader live region for tooltip updates */}
            <span ref={liveRegionRef} aria-live="polite" className="sr-only" />
            <svg
                viewBox="0 -10 440 315"
                className="w-full h-auto"
                role="group"
                aria-label={t('pyrTitle')}
                aria-describedby={tableId}
                onMouseLeave={hideTooltip}
            >
                <title>{t('pyrTitle')}</title>
                <desc>{t('pyrSub', { year: currentYear })}</desc>

                <line x1={barX} y1={getY(20)} x2={barX} y2={getY(0) + barH} stroke={isDark ? '#334155' : '#e2e8f0'} strokeWidth="1" />

                {ageBands.map(({ startAge, total }, idx) => {
                    const w = maxBand > 0 ? (total / maxBand) * maxBarW : 0;
                    const y = getY(idx);
                    const fill = barFill(startAge);
                    const showLabel = startAge % 10 === 0 || startAge === MAX_AGE;
                    const label = bandLabel(startAge);
                    return (
                        <g
                            key={idx}
                            role="button"
                            tabIndex={0}
                            aria-label={`Total population age ${label}: ${formatNum(total)}. ${t('pyrSub', { year: currentYear })}`}
                            onMouseEnter={() => showTooltip({ startAge, total }, idx)}
                            onFocus={() => showTooltip({ startAge, total }, idx)}
                            onBlur={hideTooltip}
                            onKeyDown={(e) => handleBarKey(e, { startAge, total }, idx)}
                            style={{ cursor: 'pointer' }}
                        >
                            <rect x={barX} y={y} width={w} height={barH} fill={fill} opacity="0.85" />
                            {showLabel && (
                                <text x={LABEL_X} y={y + 9} fontSize="12" fill={labelColor} textAnchor="end" fontWeight="600">
                                    {label}
                                </text>
                            )}
                        </g>
                    );
                })}

                {/* Tooltip */}
                {tooltip && (
                    <g>
                        <rect x={tooltip.x - 2} y={tooltip.y - 12} width="80" height="20" rx="4" fill={isDark ? '#1e293b' : '#fff'} stroke={isDark ? '#475569' : '#e2e8f0'} strokeWidth="1" />
                        <text x={tooltip.x + 4} y={tooltip.y + 2} fontSize="11" fill={labelColor} fontWeight="600">
                            {tooltip.label}: {tooltip.value}
                        </text>
                    </g>
                )}
            </svg>
            <div className="flex gap-4 justify-center mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500"></span>{t('youth')}</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-indigo-500"></span>{t('working')}</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-purple-500"></span>{t('elderly')}</div>
            </div>
            <ChartDataFallback
                tableId={tableId}
                caption={t('chartDataTableLabel', { chart: t('pyrTitle') })}
                columns={[t('ageGroup'), t('totalPop')]}
                rows={tableRows}
                downloadLabel={t('downloadCsv')}
                fileName="population-by-age.csv"
            />
        </div>
    );
}

export default React.memo(DemographicPyramid);
