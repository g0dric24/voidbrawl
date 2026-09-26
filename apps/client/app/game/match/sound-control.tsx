import { useState, useSyncExternalStore } from 'react';
import { getVolume, isMuted, setVolume, subscribeMuted, toggleMute } from '../../audio/audio-engine';

export function SoundControl() {
    const muted = useSyncExternalStore( subscribeMuted, isMuted, () => false );
    const [ volume, setLocal ] = useState( getVolume );

    return (
        <div className="flex items-center gap-3 text-[11px] tracking-[0.2em] text-readout-dim">
            <button
                type="button"
                onClick={ () => toggleMute() }
                className="w-20 border border-line px-2 py-1 text-left hover:text-readout focus-visible:text-readout focus-visible:outline-none"
            >
                { muted ? 'Muted' : 'Sound' } · M
            </button>
            <input
                type="range"
                min={ 0 }
                max={ 1 }
                step={ 0.05 }
                value={ volume }
                aria-label="Volume"
                onChange={ ( e ) => {
                    const v = Number( e.target.value );
                    setLocal( v );
                    setVolume( v );
                } }
                className="flex-1 accent-marigold"
            />
        </div>
    );
}
