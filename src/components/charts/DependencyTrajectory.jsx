import React, { useMemo, useState, useCallback } from 'react';
import { CHART_W, TRAJ_CHART_H, SIM_START_YEAR, SIM_YEAR_SPAN, DEP_THRESHOLD_HEALTHY, DEP_THRESHOLD_WARNING, DEP_THRESHOLD_SEVERE } from '../../data/constants';

/**
 * Dependency Ratio Trajectory chart (SVG).
 * Shows dependency ratio over simulation years with colored threshold zones.
 */
function DependencyTrajectory({ history, currentYear, currentData, theme, t }) {
    const [tooltip, setTooltip] = useState(null);

    const xPos = useCallback((year) => ((year - SIM_START_YEAR) / SIM_YEAR_SPAN) * CHART_W, []);

    const maxDepRatio = useMemo(() => {
        if (!history.length) return 80;
        return Math.max(...history.map(h => h.depRatio));
    }, [history]);

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
        const rect = svg.getBoundingClientRect();
        const svgX = ((e.clientX - rect.left) / rect.width) * (CHART_W + 920 / 10) - 50;
        const yearIdx = Math.round((svgX / CHART_W) * SIM_YEAR_SPAN);
        const year = SIM_START_YEAR + Math.max(0, Math.min(SIM_YEAR_SPAN, yearIdx));
        const entry = history[year - SIM_START_YEAR];
        if (entry) {
            setTooltip({ x: xPos(year), y: (depRatioChartTop - Math.min(depRatioChartTop, entry.depRatio)) * trajScaleY, year, value: entry.depRatio });
        }
    }, [history, xPos, depRatioChartTop, trajScaleY]);

    const handleMouseLeave = useCallback(() => setTooltip(null), []);

    const isDark = theme === 'dark';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const labelColor = isDark ? '#94a3b8' : '#475569';
    const strokeColor = isDark ? '#e2e8f0' : '#334155';
    const fillColor = isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.06)';

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 transition-colors">
            <h2 className="text-base font-bold">{t('trajTitle')}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-4">{t('trajSub')}</p>
            <svg
                viewBox="-50 -10 870 470"
                className="w-full h-auto overflow-visible"
                role="img"
                aria-label={t('trajTitle')}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
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
                        ...history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${xPos(h.year)} ${(depRatioChartTop - Math.min(depRatioChartTop, h.depRatio)) * trajScaleY}`),
                        `L ${CHART_W} ${TRAJ_CHART_H}`, `L 0 ${TRAJ_CHART_H}`, 'Z'
                    ].join(' ')}
                    fill={fillColor}
                />
                {/* Data path (stroke) */}
                <path
                    d={history.map((h, i) => `${i === 0 ? 'M' : 'L'} ${xPos(h.year)} ${(depRatioChartTop - Math.min(depRatioChartTop, h.depRatio)) * trajScaleY}`).join(' ')}
                    fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                />

                {/* Current year indicator */}
                <line x1={xPos(currentYear)} y1="0" x2={xPos(currentYear)} y2={TRAJ_CHART_H + 10} stroke="#6366f1" strokeWidth="2" strokeDasharray="5 3" />
                <circle cx={xPos(currentYear)} cy={(depRatioChartTop - Math.min(depRatioChartTop, currentData.depRatio)) * trajScaleY} r="5" fill="#6366f1" stroke={isDark ? '#0f172a' : 'white'} strokeWidth="2.5" />

                {/* Tooltip */}
                {tooltip && (
                    <g>
                        <circle cx={tooltip.x} cy={tooltip.y} r="4" fill="#6366f1" stroke="white" strokeWidth="2" />
                        <rect x={tooltip.x - 40} y={tooltip.y - 32} width="80" height="24" rx="6" fill={isDark ? '#1e293b' : '#fff'} stroke={isDark ? '#475569' : '#e2e8f0'} strokeWidth="1" />
                        <text x={tooltip.x} y={tooltip.y - 16} fontSize="13" fill={labelColor} fontWeight="700" textAnchor="middle">
                            {tooltip.year}: {tooltip.value.toFixed(1)}
                        </text>
                    </g>
                )}

                {/* X-axis labels */}
                {[2025, 2050, 2075, 2125].map((yr, i) => (
                    <text key={yr} x={xPos(yr)} y={TRAJ_CHART_H + 22} fontSize="20" fill={labelColor} fontWeight="600" textAnchor={i === 0 ? 'start' : i === 3 ? 'end' : 'middle'}>{yr}</text>
                ))}
            </svg>
        </div>
    );
}

export default React.memo(DependencyTrajectory);
