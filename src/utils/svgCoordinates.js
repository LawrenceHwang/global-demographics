/**
 * Map a client-space pointer position to an SVG viewBox coordinate.
 */
export function clientPointToViewBox(svg, clientX, clientY = 0) {
    const rect = svg.getBoundingClientRect();
    const ratioX = rect.width > 0 ? Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) : 0;
    const ratioY = rect.height > 0 ? Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)) : 0;

    const vb = svg.viewBox?.baseVal;
    if (!vb || vb.width <= 0 || vb.height <= 0) {
        return { x: ratioX, y: ratioY };
    }

    return {
        x: vb.x + ratioX * vb.width,
        y: vb.y + ratioY * vb.height,
    };
}

/**
 * Convert client X into a simulation year for charts that use x=[0, chartWidth]
 * within their SVG viewBox.
 */
export function clientXToYear(svg, clientX, chartWidth, yearStart, yearSpan) {
    const { x } = clientPointToViewBox(svg, clientX, 0);
    const clampedX = Math.max(0, Math.min(chartWidth, x));
    const yearIdx = Math.round((clampedX / chartWidth) * yearSpan);
    return yearStart + Math.max(0, Math.min(yearSpan, yearIdx));
}
