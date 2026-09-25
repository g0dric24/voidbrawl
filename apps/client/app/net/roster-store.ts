import type { TeamId } from '@voidbrawl/shared';

export interface Roster {
    marigold: number;
    cyan: number;
    you: TeamId | null;
}

const listeners = new Set< () => void >();
let roster: Roster = { marigold: 0, cyan: 0, you: null };

export function subscribeRoster( listener: () => void ): () => void {
    listeners.add( listener );
    return () => {
        listeners.delete( listener );
    };
}

export function currentRoster(): Roster {
    return roster;
}

export function setRoster( next: Roster ): void {
    if ( next.marigold === roster.marigold && next.cyan === roster.cyan && next.you === roster.you ) return;
    roster = next;
    for ( const listener of listeners ) listener();
}
