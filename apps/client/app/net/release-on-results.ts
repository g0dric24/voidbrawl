import { getStateCallbacks, type Room } from '@colyseus/sdk';
import { type MatchState, PHASE } from '@voidbrawl/shared';

export function releaseOnResults( room: Room< MatchState > ): () => void {
    const $ = getStateCallbacks( room );
    return $( room.state ).listen( 'phase', ( phase ) => {
        if ( phase === PHASE.results && document.pointerLockElement ) document.exitPointerLock();
    } );
}
