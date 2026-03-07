import React from 'react';

/**
 * Migration slider card.
 */
function MigrationControls({ migration, setMigration, cfg, t }) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 transition-colors">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">{t('netMigration')}</p>
            <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-slate-700 dark:text-slate-300">{t('netMigration')}</span>
                <span className={`font-mono font-bold ${migration >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                    {migration >= 0 ? '+' : ''}{migration.toLocaleString()}
                </span>
            </div>
            <input
                type="range"
                min={cfg.migrationMin} max={cfg.migrationMax} step={cfg.migrationStep}
                value={migration}
                onChange={(e) => setMigration(parseInt(e.target.value))}
                className="w-full accent-emerald-600 dark:accent-emerald-400"
                aria-label={t('ariaMigrationSlider')}
                aria-valuetext={`${migration >= 0 ? '+' : ''}${migration.toLocaleString()}`}
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
                {t('migrationNote')}
            </p>
        </div>
    );
}

export default React.memo(MigrationControls);
