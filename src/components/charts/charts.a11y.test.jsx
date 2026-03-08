// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { MAX_AGE, SIM_END_YEAR, SIM_START_YEAR } from '../../data/constants';
import DemographicPyramid from './DemographicPyramid';
import DependencyTrajectory from './DependencyTrajectory';
import PopulationComposition from './PopulationComposition';

const t = (key, params = {}) => {
    const dict = {
        pyrTitle: 'Population Pyramid',
        pyrSub: `Age distribution (${params.year ?? ''})`,
        trajTitle: 'Dependency Ratio Trajectory',
        trajSub: 'Dependency ratio over time',
        compTitle: 'Population Composition',
        compSub: 'Population by age group',
        youth: 'Youth',
        working: 'Working',
        elderly: 'Elderly',
        total: 'Total',
    };
    return dict[key] || key;
};

function makeHistory() {
    const years = SIM_END_YEAR - SIM_START_YEAR + 1;
    return Array.from({ length: years }, (_, i) => ({
        year: SIM_START_YEAR + i,
        youth: 10000000 - i * 10000,
        working: 20000000 - i * 5000,
        elderly: 5000000 + i * 8000,
        total: 35000000 - i * 7000,
        depRatio: 55 + i * 0.15,
    }));
}

describe('charts accessibility', () => {
    it('DemographicPyramid has no critical axe violations', async () => {
        const pop = new Array(MAX_AGE + 1).fill(100000);
        const { container } = render(
            <DemographicPyramid
                currentPopArray={pop}
                currentYear={SIM_START_YEAR}
                theme="light"
                t={t}
            />
        );

        const results = await axe(container);
        expect(results.violations, JSON.stringify(results.violations, null, 2)).toHaveLength(0);
    });

    it('DependencyTrajectory has no critical axe violations', async () => {
        const history = makeHistory();
        const currentData = history[0];
        const { container } = render(
            <DependencyTrajectory
                history={history}
                currentYear={SIM_START_YEAR}
                currentData={currentData}
                theme="light"
                t={t}
            />
        );

        const results = await axe(container);
        expect(results.violations, JSON.stringify(results.violations, null, 2)).toHaveLength(0);
    });

    it('PopulationComposition has no critical axe violations', async () => {
        const history = makeHistory();
        const { container } = render(
            <PopulationComposition
                history={history}
                currentYear={SIM_START_YEAR}
                theme="light"
                t={t}
            />
        );

        const results = await axe(container);
        expect(results.violations, JSON.stringify(results.violations, null, 2)).toHaveLength(0);
    });
});
