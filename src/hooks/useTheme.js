import { useState, useCallback } from 'react';

/**
 * Custom hook for theme management.
 * Manages 'light' / 'dark' state and provides a toggle function.
 */
export function useTheme() {
    const [theme, setTheme] = useState('light');

    const toggleTheme = useCallback(() => {
        setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    }, []);

    const isDark = theme === 'dark';

    return { theme, isDark, toggleTheme };
}
