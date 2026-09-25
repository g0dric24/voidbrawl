import os from 'node:os';
import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { MATCH_ROOM } from '@voidbrawl/shared';
import { MatchRoom } from './rooms/match-room.js';

const port = Number( process.env.PORT || 2567 );
const host = process.env.HOST ?? '0.0.0.0';
const clientPort = process.env.CLIENT_PORT ?? '5173';

function lanAddress(): string {
    for ( const ifaces of Object.values( os.networkInterfaces() ) ) {
        for ( const i of ifaces ?? [] ) {
            if ( i.family === 'IPv4' && ! i.internal ) return i.address;
        }
    }
    return 'localhost';
}

const gameServer = new Server( { transport: new WebSocketTransport() } );

gameServer.define( MATCH_ROOM, MatchRoom );

gameServer
    .listen( port, host )
    .then( () => {
        const ip = lanAddress();
        console.log( `[voidbrawl] server up on ws://${ ip }:${ port } (bound ${ host })` );
        console.log( `[voidbrawl] players join at → http://${ ip }:${ clientPort }/play` );
    } )
    .catch( ( err: unknown ) => {
        console.error( '[voidbrawl] server failed to start', err );
        process.exit( 1 );
    } );
