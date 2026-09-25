import type { TeamCounts, TeamId } from '@voidbrawl/shared';

interface Member {
    team: TeamId;
}

export function teamCounts( members: Iterable< Member > ): TeamCounts {
    const counts = { marigold: 0, cyan: 0 };
    for ( const m of members ) {
        if ( m.team === 0 ) counts.marigold++;
        else counts.cyan++;
    }
    return counts;
}

export function freeSlot( members: Iterable< Member >, team: TeamId ): number {
    let n = 0;
    for ( const m of members ) if ( m.team === team ) n++;
    return n;
}
