import type { Room } from '@colyseus/sdk';
import type { MatchState } from '@voidbrawl/shared';
import { session } from '../net/session';

export const THREAT = { none: 0, locking: 1, locked: 2, incoming: 3 } as const;

export type ThreatLevel = ( typeof THREAT )[ keyof typeof THREAT ];

export const THREAT_TEXT: Record< ThreatLevel, string > = {
    0: '',
    1: 'Locking on you',
    2: 'Missile lock',
    3: 'Missile incoming',
};

function incoming( room: Room< MatchState > ): boolean {
    for ( const m of room.state.missiles.values() ) if ( m.targetId === room.sessionId ) return true;
    return false;
}

function lockOn( room: Room< MatchState > ): number {
    let best = 0;
    room.state.players.forEach( ( p ) => {
        if ( p.lockId === room.sessionId && p.lockProgress > best ) best = p.lockProgress;
    } );
    return best;
}

export function threatLevel(): ThreatLevel {
    const room = session.room;
    if ( ! room?.state?.missiles ) return THREAT.none;
    if ( incoming( room ) ) return THREAT.incoming;
    const lock = lockOn( room );
    if ( lock >= 1 ) return THREAT.locked;
    return lock > 0 ? THREAT.locking : THREAT.none;
}
