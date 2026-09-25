import type { TeamId } from '@voidbrawl/shared';

interface Member {
    team: TeamId;
}

export function smallerTeam( members: Iterable< Member > ): TeamId {
    let marigold = 0;
    let cyan = 0;
    for ( const m of members ) {
        if ( m.team === 0 ) marigold++;
        else cyan++;
    }
    return cyan < marigold ? 1 : 0;
}

export function freeSlot( members: Iterable< Member >, team: TeamId ): number {
    let n = 0;
    for ( const m of members ) if ( m.team === team ) n++;
    return n;
}
