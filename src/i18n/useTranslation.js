import { useCallback, useEffect, useMemo } from 'react';
import en from './en';
import zh from './zh';
import ko from './ko';
import ja from './ja';

const translations = { en, zh, ko, ja };

/**
 * Custom hook for internationalization.
 * Returns a translation function and syncs <html lang> attribute.
 *
 * @param {string} lang - Active language code ('en', 'zh', 'ko', 'ja')
 * @returns {(key: string, params?: Record<string, string|number>) => string}
 */
export function useTranslation(lang) {
    // Sync the document lang attribute for screen readers
    useEffect(() => {
        document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : lang;
    }, [lang]);

    const dict = useMemo(() => translations[lang] || translations.en, [lang]);

    const t = useCallback((key, params = {}) => {
        let str = dict[key] || translations.en[key] || key;
        Object.entries(params).forEach(([k, v]) => {
            str = str.replace(`{${k}}`, v);
        });
        return str;
    }, [dict]);

    return t;
}
