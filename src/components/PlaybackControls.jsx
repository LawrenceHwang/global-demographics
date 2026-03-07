import React from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { SIM_START_YEAR, SIM_END_YEAR } from '../data/constants';

/**
 * Playback controls: year slider, play/pause, and reset.
 */
function PlaybackControls({ currentYear, isPlaying, togglePlay, reset, seekTo, t }) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 transition-colors">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">{t('simYear')}</p>
            <input
                type="range"
                min={SIM_START_YEAR}
                max={SIM_END_YEAR}
                value={currentYear}
                onChange={(e) => seekTo(parseInt(e.target.value))}
                className="w-full accent-indigo-600 dark:accent-indigo-400 mb-3"
                aria-label={t('ariaYearSlider')}
                aria-valuetext={`${currentYear}`}
            />
            <div className="flex gap-2">
                <button
                    onClick={togglePlay}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white py-2.5 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-colors shadow-sm shadow-indigo-200 dark:shadow-none min-h-[44px]"
                >
                    {isPlaying ? <Pause size={15} /> : <Play size={15} />}
                    {isPlaying ? t('pause') : t('play')}
                </button>
                <button
                    onClick={reset}
                    className="px-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl flex items-center transition-colors min-h-[44px]"
                    aria-label={t('ariaResetYear')}
                >
                    <RotateCcw size={15} />
                </button>
            </div>
        </div>
    );
}

export default React.memo(PlaybackControls);
