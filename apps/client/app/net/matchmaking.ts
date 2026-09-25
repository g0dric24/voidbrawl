import type { Room } from '@colyseus/sdk';
import {
    type ArenaDescriptor,
    arenaReady,
    type JoinOptions,
    LOBBY_ROOM,
    MATCH_ROOM,
    type MatchMode,
    type MatchState,
    toArenaDescriptor,
} from '@voidbrawl/shared';
import { getClient } from './client';
import { attachLobbyStore } from './lobby-store';
import { session } from './session';

function enter( room: Room< MatchState > ): Room< MatchState > {
    session.room = room;
    return room;
}

export async function createMatch( mode: MatchMode, name: string ): Promise< Room< MatchState > > {
    leaveMatch();
    const options: JoinOptions = { name, mode };
    return enter( await getClient().create< MatchState >( MATCH_ROOM, options ) );
}

export function joinMatch( roomId: string, name: string ): Promise< Room< MatchState > > {
    if ( session.room?.roomId === roomId ) return Promise.resolve( session.room );
    if ( session.joining?.roomId === roomId ) return session.joining.room;
    leaveMatch();
    const options: JoinOptions = { name };
    const room = getClient()
        .joinById< MatchState >( roomId, options )
        .then( enter )
        .finally( () => {
            session.joining = null;
        } );
    session.joining = { roomId, room };
    return room;
}

export function leaveMatch(): void {
    session.room?.leave();
    session.room = null;
}

export async function joinLobby(): Promise< void > {
    if ( session.lobby ) return;
    const lobby = await getClient().joinOrCreate( LOBBY_ROOM );
    session.lobby = lobby;
    attachLobbyStore( lobby );
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
