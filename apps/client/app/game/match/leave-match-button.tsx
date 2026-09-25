import { PHASE } from '@voidbrawl/shared';
import { useSyncExternalStore } from 'react';
import { Link } from 'react-router';
import { pointerLocked, subscribeMouse } from '../input/mouse';
import { useMatch } from './use-match';

export function LeaveMatchButton() {
    const locked = useSyncExternalStore( subscribeMouse, pointerLocked, () => false );
    const match = useMatch();
    const playing = match.phase === PHASE.countdown || match.phase === PHASE.live;
    if ( locked || ! playing ) return null;

    return (
        <Link
            to="/lobby"
            className="fixed bottom-[18%] left-1/2 z-40 -translate-x-1/2 border border-line bg-deep/80 px-6 py-2 font-readout text-xs font-bold tracking-[0.3em] text-readout-dim uppercase hover:border-danger hover:text-danger focus-visible:border-danger focus-visible:text-danger focus-visible:outline-none"
        >
            Leave match
        </Link>
    );
}
