import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SIM_START_YEAR } from '../data/constants';
import { COUNTRY_CONFIG } from '../data/countries';
import { MORTALITY_PROFILES } from '../data/mortality';
import { buildCountryPopulation, runSimulation } from '../engine/simulation';

/**
 * Custom hook for simulation parameters and results.
 * Manages country selection, TFR, migration, and memoized simulation output.
 */
export function useSimulation(resetPlayback) {
    const [country, setCountry] = useState('taiwan');
    const [tfr, setTfr] = useState(COUNTRY_CONFIG.taiwan.tfr);
    const [isDynamicTfr, setIsDynamicTfr] = useState(false);
    const [terminalTfr, setTerminalTfr] = useState(1.50);
    const [terminalYear, setTerminalYear] = useState(2050);
    const [migration, setMigration] = useState(COUNTRY_CONFIG.taiwan.migration);

    const cfg = COUNTRY_CONFIG[country];

    // Keep a ref to the latest resetPlayback so handleCountryChange is stable
    const resetRef = useRef(resetPlayback);
    useEffect(() => { resetRef.current = resetPlayback; }, [resetPlayback]);

    const handleCountryChange = useCallback((newCountry) => {
        const newCfg = COUNTRY_CONFIG[newCountry];
        setCountry(newCountry);
        setTfr(newCfg.tfr);
        setMigration(newCfg.migration);
        setIsDynamicTfr(false);
        resetRef.current?.();
    }, []);

    const basePop = useMemo(
        () => buildCountryPopulation(cfg),
        [cfg.youth, cfg.working, cfg.elderly, cfg.anchors]
    );
    const mortality = useMemo(
        () => MORTALITY_PROFILES[cfg.mortalityProfile],
        [cfg.mortalityProfile]
    );

    const { history, popByYear } = useMemo(
        () => runSimulation(basePop, mortality, tfr, migration, isDynamicTfr, terminalTfr, terminalYear),
        [basePop, mortality, tfr, migration, isDynamicTfr, terminalTfr, terminalYear]
    );

    const totalInit = cfg.youth + cfg.working + cfg.elderly;

    const getDataForYear = useCallback((year) => {
        const idx = year - SIM_START_YEAR;
        return {
            data: history[idx] || history[0],
            popArray: popByYear[idx] || popByYear[0],
        };
    }, [history, popByYear]);

    return {
        country,
        cfg,
        tfr, setTfr,
        isDynamicTfr, setIsDynamicTfr,
        terminalTfr, setTerminalTfr,
        terminalYear, setTerminalYear,
        migration, setMigration,
        handleCountryChange,
        history,
        popByYear,
        totalInit,
        getDataForYear,
    };
}
