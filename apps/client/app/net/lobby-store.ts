import type { Room, RoomAvailable } from '@colyseus/sdk';
import type { RoomMeta } from '@voidbrawl/shared';

export type LobbyRow = RoomAvailable< RoomMeta >;

let rooms: LobbyRow[] = [];
const listeners = new Set< () => void >();
let attached: Room | null = null;

function set( next: LobbyRow[] ): void {
    rooms = next;
    for ( const notify of listeners ) notify();
}

export function attachLobbyStore( lobby: Room ): void {
    if ( attached === lobby ) return;
    attached = lobby;
    lobby.onMessage( 'rooms', ( list: LobbyRow[] ) => set( list ) );
    lobby.onMessage( '+', ( [ , room ]: [ string, LobbyRow ] ) =>
        set( [ ...rooms.filter( ( r ) => r.roomId !== room.roomId ), room ] ),
    );
    lobby.onMessage( '-', ( roomId: string ) => set( rooms.filter( ( r ) => r.roomId !== roomId ) ) );
}

export function subscribeLobby( listener: () => void ): () => void {
    listeners.add( listener );
    return () => {
        listeners.delete( listener );
    };
}

export function lobbyRooms(): LobbyRow[] {
    return rooms;
}
