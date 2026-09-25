import { PHASE } from '@voidbrawl/shared';
import { useSyncExternalStore } from 'react';
import { pointerLocked, requestLock, subscribeMouse } from '../input/mouse';
import { useMatch } from '../match/use-match';

function lock(): void {
    void requestLock( document.documentElement );
}

export function PointerPrompt( { inMatch }: { inMatch: boolean } ) {
    const locked = useSyncExternalStore( subscribeMouse, pointerLocked, () => false );
    const match = useMatch();

    if ( locked || ( inMatch && match.phase === PHASE.results ) ) return null;

    if ( inMatch && match.phase === PHASE.lobby ) {
        return (
            <button
                type="button"
                onClick={ lock }
                className="fixed bottom-[22%] left-1/2 z-20 -translate-x-1/2 border border-line bg-deep/70 px-6 py-2 font-readout text-xs font-bold tracking-[0.3em] text-readout uppercase hover:border-readout"
            >
                Click to fly while you wait · Esc for the menu
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={ lock }
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
