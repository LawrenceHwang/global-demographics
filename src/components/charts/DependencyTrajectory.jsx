import React, { useCallback, useId, useMemo, useRef, useState } from 'react';
import { CHART_W, DEP_THRESHOLD_HEALTHY, DEP_THRESHOLD_SEVERE, DEP_THRESHOLD_WARNING, SIM_START_YEAR, SIM_YEAR_SPAN, TRAJ_CHART_H } from '../../data/constants';
import { formatDepRatio, getNumericDepRatioForCharts } from '../../utils/metrics';
import { clientXToYear } from '../../utils/svgCoordinates';
import ChartDataFallback from './ChartDataFallback';

/**
 * Dependency Ratio Trajectory chart (SVG).
 * Shows dependency ratio over simulation years with colored threshold zones.
 */
function DependencyTrajectory({ history, currentYear, currentData, theme, t }) {
    const [tooltip, setTooltip] = useState(null);
    const liveRegionRef = useRef(null);
    const tableId = useId();

    const xPos = useCallback((year) => ((year - SIM_START_YEAR) / SIM_YEAR_SPAN) * CHART_W, []);

    const chartHistory = useMemo(
        () => history.map(entry => ({ ...entry, chartDepRatio: getNumericDepRatioForCharts(entry.depRatio) })),
        [history]
    );

    const maxDepRatio = useMemo(() => {
        if (!chartHistory.length) return 80;
        return Math.max(...chartHistory.map(entry => entry.chartDepRatio));
    }, [chartHistory]);

    const depRatioChartTop = useMemo(() => {
        const paddedMax = Math.max(80, maxDepRatio * 1.15);
        return Math.ceil(paddedMax / 20) * 20;
    }, [maxDepRatio]);

    const depRatioYLabels = useMemo(() => {
        if (depRatioChartTop === 0) return [];
        const numSteps = 4;
        const step = depRatioChartTop / numSteps;
        return Array.from({ length: numSteps }, (_, i) => Math.round(step * (i + 1)));
    }, [depRatioChartTop]);

    const trajScaleY = TRAJ_CHART_H / depRatioChartTop;

    const handleMouseMove = useCallback((e) => {
        const svg = e.currentTarget;
        const year = clientXToYear(svg, e.clientX, CHART_W, SIM_START_YEAR, SIM_YEAR_SPAN);
        const entry = history[year - SIM_START_YEAR];
        if (entry) {
            const chartValue = getNumericDepRatioForCharts(entry.depRatio, depRatioChartTop);
            setTooltip({ x: xPos(year), y: (depRatioChartTop - Math.min(depRatioChartTop, chartValue)) * trajScaleY, year, value: entry.depRatio });
            if (liveRegionRef.current) {
                liveRegionRef.current.textContent = `${year}: ${t('depRatio')} ${formatDepRatio(entry.depRatio, t)}`;
            }
        }
    }, [history, xPos, depRatioChartTop, trajScaleY, t]);

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
            const chartValue = getNumericDepRatioForCharts(entry.depRatio, depRatioChartTop);
            if (liveRegionRef.current) {
                liveRegionRef.current.textContent = `${nextYear}: ${t('depRatio')} ${formatDepRatio(entry.depRatio, t)}`;
            }
            return { x: xPos(nextYear), y: (depRatioChartTop - Math.min(depRatioChartTop, chartValue)) * trajScaleY, year: nextYear, value: entry.depRatio };
        });
    }, [history, xPos, depRatioChartTop, trajScaleY, currentYear, t]);

    const tableRows = useMemo(
        () => history.map(entry => [entry.year, formatDepRatio(entry.depRatio, t)]),
        [history, t]
    );

    const isDark = theme === 'dark';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const labelColor = isDark ? '#94a3b8' : '#475569';
    const strokeColor = isDark ? '#e2e8f0' : '#334155';
    const fillColor = isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.06)';

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 transition-colors">
            <h2 className="text-base font-bold">{t('trajTitle')}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-4">{t('trajSub')}</p>
            <span ref={liveRegionRef} aria-live="polite" className="sr-only" />
            <svg
                viewBox="-50 -10 870 470"
                className="w-full h-auto overflow-visible"
                role="group"
                aria-label={t('trajTitle')}
                aria-describedby={tableId}
                tabIndex={0}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onKeyDown={handleKeyDown}
            >
                <title>{t('trajTitle')}</title>
                <desc>{t('trajSub')}</desc>

                {/* Background threshold zones */}
                <rect x="0" y={(depRatioChartTop - DEP_THRESHOLD_HEALTHY) * trajScaleY} width={CHART_W} height={DEP_THRESHOLD_HEALTHY * trajScaleY} fill={isDark ? "#064e3b" : "#dcfce7"} opacity="0.35" />
                <rect x="0" y={(depRatioChartTop - DEP_THRESHOLD_WARNING) * trajScaleY} width={CHART_W} height={(DEP_THRESHOLD_WARNING - DEP_THRESHOLD_HEALTHY) * trajScaleY} fill={isDark ? "#78350f" : "#fef9c3"} opacity="0.35" />
                <rect x="0" y={(depRatioChartTop - DEP_THRESHOLD_SEVERE) * trajScaleY} width={CHART_W} height={(DEP_THRESHOLD_SEVERE - DEP_THRESHOLD_WARNING) * trajScaleY} fill={isDark ? "#7c2d12" : "#fed7aa"} opacity="0.35" />
                <rect x="0" y="0" width={CHART_W} height={(depRatioChartTop - DEP_THRESHOLD_SEVERE) * trajScaleY} fill={isDark ? "#7f1d1d" : "#fecaca"} opacity="0.35" />

                {/* Y-axis labels and grid lines */}
                {depRatioYLabels.map(val => {
                    const y = (depRatioChartTop - val) * trajScaleY;
                    return (
                        <g key={val}>
                            <line x1="0" y1={y} x2={CHART_W} y2={y} stroke={gridColor} strokeWidth="1.5" strokeDasharray="5 4" />
                            <text x="-8" y={y + 7} fontSize="22" fill={labelColor} fontWeight="600" textAnchor="end">{val}</text>
                        </g>
                    );
                })}

                {/* Data path (filled area) */}
                <path
                    d={[
                        ...chartHistory.map((entry, i) => `${i === 0 ? 'M' : 'L'} ${xPos(entry.year)} ${(depRatioChartTop - Math.min(depRatioChartTop, entry.chartDepRatio)) * trajScaleY}`),
                        `L ${CHART_W} ${TRAJ_CHART_H}`, `L 0 ${TRAJ_CHART_H}`, 'Z'
                    ].join(' ')}
                    fill={fillColor}
                />
                {/* Data path (stroke) */}
                <path
                    d={chartHistory.map((entry, i) => `${i === 0 ? 'M' : 'L'} ${xPos(entry.year)} ${(depRatioChartTop - Math.min(depRatioChartTop, entry.chartDepRatio)) * trajScaleY}`).join(' ')}
                    fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                />

                {/* Current year indicator */}
                <line x1={xPos(currentYear)} y1="0" x2={xPos(currentYear)} y2={TRAJ_CHART_H + 10} stroke="#6366f1" strokeWidth="2" strokeDasharray="5 3" />
                <circle cx={xPos(currentYear)} cy={(depRatioChartTop - Math.min(depRatioChartTop, getNumericDepRatioForCharts(currentData.depRatio, depRatioChartTop))) * trajScaleY} r="5" fill="#6366f1" stroke={isDark ? '#0f172a' : 'white'} strokeWidth="2.5" />

                {/* Tooltip */}
                {tooltip && (
                    <g>
                        <circle cx={tooltip.x} cy={tooltip.y} r="4" fill="#6366f1" stroke="white" strokeWidth="2" />
                        <rect x={tooltip.x - 40} y={tooltip.y - 32} width="80" height="24" rx="6" fill={isDark ? '#1e293b' : '#fff'} stroke={isDark ? '#475569' : '#e2e8f0'} strokeWidth="1" />
                        <text x={tooltip.x} y={tooltip.y - 16} fontSize="13" fill={labelColor} fontWeight="700" textAnchor="middle">
                            {tooltip.year}: {formatDepRatio(tooltip.value, t)}
                        </text>
                    </g>
                )}

                {/* X-axis labels */}
                {[2025, 2050, 2075, 2125].map((yr, i) => (
                    <text key={yr} x={xPos(yr)} y={TRAJ_CHART_H + 22} fontSize="20" fill={labelColor} fontWeight="600" textAnchor={i === 0 ? 'start' : i === 3 ? 'end' : 'middle'}>{yr}</text>
                ))}
            </svg>
            <ChartDataFallback
                tableId={tableId}
                caption={t('chartDataTableLabel', { chart: t('trajTitle') })}
                columns={[t('year'), t('depRatio')]}
                rows={tableRows}
                downloadLabel={t('downloadCsv')}
                fileName="dependency-trajectory.csv"
            />
        </div>
    );
}

export default React.memo(DependencyTrajectory);
