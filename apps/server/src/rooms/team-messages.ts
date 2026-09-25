import type { Client, Room } from '@colyseus/core';
import { MOVE_PLAYER_MESSAGE, type MovePlayerMessage, PICK_TEAM_MESSAGE, type TeamId } from '@voidbrawl/shared';

function asTeam( v: unknown ): TeamId | null {
    return v === 0 || v === 1 ? v : null;
}

export function registerTeamMessages(
    room: Room,
    isHost: ( client: Client ) => boolean,
    move: ( sessionId: string, team: TeamId ) => boolean,
): void {
    room.onMessage( PICK_TEAM_MESSAGE, ( client, team: unknown ) => {
        const t = asTeam( team );
        if ( t !== null ) move( client.sessionId, t );
    } );
    room.onMessage< MovePlayerMessage >( MOVE_PLAYER_MESSAGE, ( client, msg ) => {
        const t = asTeam( msg?.team );
        if ( isHost( client ) && t !== null && typeof msg?.sessionId === 'string' ) move( msg.sessionId, t );
    } );
}
