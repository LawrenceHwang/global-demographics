import React, { useCallback, useId, useMemo, useRef, useState } from 'react';
import { CHART_W, SIM_START_YEAR, SIM_YEAR_SPAN } from '../../data/constants';
import { computeYAxisMax, formatPop, formatYLabel } from '../../utils/format';
import { clientXToYear } from '../../utils/svgCoordinates';
import ChartDataFallback from './ChartDataFallback';

/**
 * Population Composition chart (SVG line chart).
 * Shows youth, working, elderly, and total population over time.
 */
function PopulationComposition({ history, currentYear, theme, t }) {
    const [tooltip, setTooltip] = useState(null);
    const liveRegionRef = useRef(null);
    const tableId = useId();
    const isDark = theme === 'dark';

    const xPos = useCallback((year) => ((year - SIM_START_YEAR) / SIM_YEAR_SPAN) * CHART_W, []);

    const maxHistTotal = useMemo(() => Math.max(...history.map(h => h.total)), [history]);
    const yAxisMax = useMemo(() => computeYAxisMax(maxHistTotal), [maxHistTotal]);
    const yAxisStepM = (yAxisMax / 1e6) / 5;
    const yAxisLabels = [1, 2, 3, 4, 5].map(i => yAxisStepM * i);

    const gridColor = isDark ? '#334155' : '#f1f5f9';
    const labelColor = isDark ? '#94a3b8' : '#475569';

    const handleMouseMove = useCallback((e) => {
        const svg = e.currentTarget;
        const year = clientXToYear(svg, e.clientX, CHART_W, SIM_START_YEAR, SIM_YEAR_SPAN);
        const entry = history[year - SIM_START_YEAR];
        if (entry) {
            const tip = {
                x: xPos(year),
                year,
                total: entry.total,
                working: entry.working,
                elderly: entry.elderly,
                youth: entry.youth,
            };
            setTooltip(tip);
            if (liveRegionRef.current) {
                liveRegionRef.current.textContent = `${year}: Working ${formatPop(entry.working)}, Elderly ${formatPop(entry.elderly)}, Youth ${formatPop(entry.youth)}`;
            }
        }
    }, [history, xPos]);

    const handleMouseLeave = useCallback(() => {
        setTooltip(null);
        if (liveRegionRef.current) liveRegionRef.current.textContent = '';
    }, []);

    const handleKeyDown = useCallback((e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        setTooltip(prev => {
            const baseYear = prev?.year ?? currentYear;
            const nextYear = e.key === 'ArrowRight'
                ? Math.min(SIM_START_YEAR + SIM_YEAR_SPAN, baseYear + 1)
                : Math.max(SIM_START_YEAR, baseYear - 1);
            const entry = history[nextYear - SIM_START_YEAR];
            if (!entry) return prev;
            if (liveRegionRef.current) {
                liveRegionRef.current.textContent = `${nextYear}: Working ${formatPop(entry.working)}, Elderly ${formatPop(entry.elderly)}, Youth ${formatPop(entry.youth)}`;
            }
            return {
                x: xPos(nextYear),
                year: nextYear,
                total: entry.total,
                working: entry.working,
                elderly: entry.elderly,
                youth: entry.youth,
            };
        });
    }, [history, xPos, currentYear]);

    const tableRows = useMemo(
        () => history.map(entry => [entry.year, Math.round(entry.total), Math.round(entry.working), Math.round(entry.elderly), Math.round(entry.youth)]),
        [history]
    );

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 transition-colors">
            <h2 className="text-base font-bold">{t('compTitle')}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-4">{t('compSub')}</p>
            <span ref={liveRegionRef} aria-live="polite" className="sr-only" />
            <svg
                viewBox="-50 -5 880 220"
                className="w-full h-auto"
                role="group"
                aria-label={t('compTitle')}
                aria-describedby={tableId}
                tabIndex={0}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onKeyDown={handleKeyDown}
            >
                <title>{t('compTitle')}</title>
                <desc>{t('compSub')}</desc>

                {yAxisLabels.map(val => {
                    const y = 200 - (val / (yAxisMax / 1e6)) * 200;
                    return (
                        <g key={val}>
                            <line x1="0" y1={y} x2={CHART_W} y2={y} stroke={gridColor} strokeWidth="1" />
                            <text x="-8" y={y + 4} fontSize="14" fill={labelColor} textAnchor="end" fontWeight="600">{formatYLabel(val)}</text>
                        </g>
                    );
                })}

                {/* Total (dashed) */}
                <path d={history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${xPos(h.year)} ${200 - (h.total / yAxisMax) * 200}`).join(' ')}
                    fill="none" stroke={isDark ? '#334155' : '#cbd5e1'} strokeWidth="1.5" strokeDasharray="6 3" />
                {/* Working */}
                <path d={history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${xPos(h.year)} ${200 - (h.working / yAxisMax) * 200}`).join(' ')}
                    fill="none" stroke={isDark ? '#818cf8' : '#6366f1'} strokeWidth="2.5" />
                {/* Elderly */}
                <path d={history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${xPos(h.year)} ${200 - (h.elderly / yAxisMax) * 200}`).join(' ')}
                    fill="none" stroke={isDark ? '#c084fc' : '#a855f7'} strokeWidth="2" />
                {/* Youth */}
                <path d={history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${xPos(h.year)} ${200 - (h.youth / yAxisMax) * 200}`).join(' ')}
                    fill="none" stroke={isDark ? '#4ade80' : '#22c55e'} strokeWidth="2" />

                {/* Current year indicator */}
                <line x1={xPos(currentYear)} y1="0" x2={xPos(currentYear)} y2="200" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7" />

                {/* Tooltip */}
                {tooltip && (
                    <g>
                        <line x1={tooltip.x} y1="0" x2={tooltip.x} y2="200" stroke="#6366f1" strokeWidth="1" opacity="0.5" />
                        <rect x={tooltip.x + 6} y="2" width="100" height="60" rx="6" fill={isDark ? '#1e293b' : '#fff'} stroke={isDark ? '#475569' : '#e2e8f0'} strokeWidth="1" opacity="0.95" />
                        <text x={tooltip.x + 12} y="16" fontSize="11" fill={labelColor} fontWeight="700">{tooltip.year}</text>
                        <text x={tooltip.x + 12} y="29" fontSize="10" fill={isDark ? '#818cf8' : '#6366f1'}>W: {formatPop(tooltip.working)}</text>
                        <text x={tooltip.x + 12} y="41" fontSize="10" fill={isDark ? '#c084fc' : '#a855f7'}>E: {formatPop(tooltip.elderly)}</text>
                        <text x={tooltip.x + 12} y="53" fontSize="10" fill={isDark ? '#4ade80' : '#22c55e'}>Y: {formatPop(tooltip.youth)}</text>
                    </g>
                )}
            </svg>
            <div className="flex justify-between text-[11px] font-semibold text-slate-400 dark:text-slate-600 mt-1">
                <span>2025</span><span>2050</span><span>2075</span><span>2125</span>
            </div>
            <div className="flex flex-wrap gap-4 justify-center mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                    <span className="block w-5 h-0" style={{ borderTop: '2px dashed #94a3b8' }}></span>
                    {t('total')}
                </div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-indigo-500"></span>{t('working')}</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-purple-500"></span>{t('elderly')}</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500"></span>{t('youth')}</div>
            </div>
            <ChartDataFallback
                tableId={tableId}
                caption={t('chartDataTableLabel', { chart: t('compTitle') })}
                columns={[t('year'), t('totalPop'), t('working'), t('elderly'), t('youth')]}
                rows={tableRows}
                downloadLabel={t('downloadCsv')}
                fileName="population-composition.csv"
            />
        </div>
    );
}

export default React.memo(PopulationComposition);
