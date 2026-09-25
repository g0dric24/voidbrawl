import { useSyncExternalStore } from 'react';
import { pointerLocked, requestLock, subscribeMouse } from '../input/mouse';

export function PointerPrompt() {
    const locked = useSyncExternalStore( subscribeMouse, pointerLocked, () => false );

    if ( locked ) return null;

    return (
        <button
            type="button"
            onClick={ () => requestLock( document.documentElement ) }
            className="fixed inset-0 z-30 flex cursor-pointer flex-col items-center justify-center gap-4 bg-void/55 font-readout text-readout uppercase"
        >
            <span className="text-[clamp(20px,3.4vh,34px)] font-bold tracking-[0.35em] text-marigold">
                Click to fly
            </span>
            <span className="text-[clamp(10px,1.6vh,14px)] tracking-[0.2em] text-readout-dim">
                Esc releases the mouse
            </span>
        </button>
    );
}
