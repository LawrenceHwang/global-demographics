import { describe, expect, it } from 'vitest';
import { clientPointToViewBox, clientXToYear } from './svgCoordinates';

function makeMockSvg({ left, top, width, height, vbX, vbY, vbWidth, vbHeight }) {
    return {
        getBoundingClientRect: () => ({ left, top, width, height }),
        viewBox: {
            baseVal: { x: vbX, y: vbY, width: vbWidth, height: vbHeight },
        },
    };
}

describe('clientPointToViewBox', () => {
    it('maps client point to viewBox coordinates', () => {
        const svg = makeMockSvg({ left: 100, top: 50, width: 400, height: 200, vbX: -50, vbY: -10, vbWidth: 870, vbHeight: 470 });
        const p = clientPointToViewBox(svg, 300, 150); // midpoint in client rect

        expect(p.x).toBeCloseTo(385, 6); // -50 + 0.5 * 870
        expect(p.y).toBeCloseTo(225, 6); // -10 + 0.5 * 470
    });

    it('clamps outside client bounds to viewBox limits', () => {
        const svg = makeMockSvg({ left: 0, top: 0, width: 100, height: 100, vbX: 0, vbY: 0, vbWidth: 10, vbHeight: 20 });
        const pLeft = clientPointToViewBox(svg, -50, -10);
        const pRight = clientPointToViewBox(svg, 200, 200);

        expect(pLeft).toEqual({ x: 0, y: 0 });
        expect(pRight).toEqual({ x: 10, y: 20 });
    });
});

describe('clientXToYear', () => {
    it('maps left, middle, and right positions to start, mid, and end years', () => {
        const svg = makeMockSvg({ left: 0, top: 0, width: 1000, height: 500, vbX: -50, vbY: -10, vbWidth: 870, vbHeight: 470 });
        const chartWidth = 760;
        const yearStart = 2025;
        const yearSpan = 100;

        expect(clientXToYear(svg, 0, chartWidth, yearStart, yearSpan)).toBe(2025);
        expect(clientXToYear(svg, 1000, chartWidth, yearStart, yearSpan)).toBe(2125);
        expect(clientXToYear(svg, 500, chartWidth, yearStart, yearSpan)).toBe(2076);
    });

    it('remains stable across viewport widths', () => {
        const chartWidth = 760;
        const yearStart = 2025;
        const yearSpan = 100;

        const smallSvg = makeMockSvg({ left: 0, top: 0, width: 320, height: 160, vbX: -50, vbY: -10, vbWidth: 870, vbHeight: 470 });
        const largeSvg = makeMockSvg({ left: 0, top: 0, width: 1280, height: 640, vbX: -50, vbY: -10, vbWidth: 870, vbHeight: 470 });

        // 75% across each viewport should resolve to the same year.
        const smallYear = clientXToYear(smallSvg, 240, chartWidth, yearStart, yearSpan);
        const largeYear = clientXToYear(largeSvg, 960, chartWidth, yearStart, yearSpan);

        expect(smallYear).toBe(largeYear);
    });
});
