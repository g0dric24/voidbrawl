import type { Room } from '@colyseus/sdk';
import {
    type ArenaDescriptor,
    arenaReady,
    type JoinOptions,
    MATCH_ROOM,
    type MatchState,
    toArenaDescriptor,
} from '@voidbrawl/shared';
import { getClient } from './client';
import { session } from './session';

export function joinMatch( name: string ): Promise< Room< MatchState > > {
    if ( session.room ) return Promise.resolve( session.room );
    if ( session.joining ) return session.joining;
    const options: JoinOptions = { name };
    session.joining = getClient()
        .joinOrCreate< MatchState >( MATCH_ROOM, options )
        .then( ( room ) => {
            session.room = room;
            return room;
        } )
        .finally( () => {
            session.joining = null;
        } );
    return session.joining;
}

export function leaveMatch(): void {
    session.room?.leave();
    session.room = null;
}

export function waitForArena( room: Room< MatchState > ): Promise< ArenaDescriptor > {
    const ready = (): boolean => arenaReady( room.state?.arena );
    if ( ready() ) return Promise.resolve( toArenaDescriptor( room.state.arena ) );
    return new Promise( ( resolve ) => {
        const handler = (): void => {
            if ( ! ready() ) return;
            room.onStateChange.remove( handler );
            resolve( toArenaDescriptor( room.state.arena ) );
        };
        room.onStateChange( handler );
    } );
}
