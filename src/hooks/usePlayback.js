import { useState, useEffect, useCallback } from 'react';
import { SIM_START_YEAR, SIM_END_YEAR, PLAYBACK_SPEED_MS } from '../data/constants';

/**
 * Custom hook for simulation playback controls.
 * Manages year state, play/pause, and auto-advance interval.
 */
export function usePlayback() {
    const [currentYear, setCurrentYear] = useState(SIM_START_YEAR);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        if (!isPlaying) return;

        const interval = setInterval(() => {
            setCurrentYear(y => {
                if (y >= SIM_END_YEAR) {
                    setIsPlaying(false);
                    return SIM_END_YEAR;
                }
                return y + 1;
            });
        }, PLAYBACK_SPEED_MS);

        return () => clearInterval(interval);
    }, [isPlaying]);

    const togglePlay = useCallback(() => setIsPlaying(p => !p), []);

    const reset = useCallback(() => {
        setCurrentYear(SIM_START_YEAR);
        setIsPlaying(false);
    }, []);

    const seekTo = useCallback((year) => {
        setCurrentYear(year);
        setIsPlaying(false);
    }, []);

    return { currentYear, isPlaying, togglePlay, reset, seekTo };
}
