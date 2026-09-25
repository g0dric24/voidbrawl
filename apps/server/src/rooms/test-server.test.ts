import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { Server } from '@colyseus/core';
import { ColyseusTestServer } from '@colyseus/testing';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { FIXED_DT, MATCH_ROOM, type PlayerState } from '@voidbrawl/shared';
import { MatchRoom } from './match-room.js';

export async function startTestServer(): Promise< ColyseusTestServer > {
    const transport = new WebSocketTransport();
    const gameServer = new Server( { transport } );
    gameServer.define( MATCH_ROOM, MatchRoom );
    await gameServer.listen( 0 );
    const address = transport.server?.address() as AddressInfo | null;
    assert.ok( address && typeof address === 'object', 'the test server bound a TCP port' );
    ( gameServer as unknown as { port: number } ).port = address.port;
    return new ColyseusTestServer( gameServer );
}

export async function openMatch( colyseus: ColyseusTestServer, clients: number ) {
    const room = await colyseus.createRoom< MatchRoom >( MATCH_ROOM );
    room.setSimulationInterval();
    const connections = [];
    for ( let i = 0; i < clients; i++ ) connections.push( await colyseus.connectTo( room, { name: `P${ i }` } ) );
    return { room, connections };
}

export function tick( room: MatchRoom, steps: number ): void {
    for ( let i = 0; i < steps; i++ ) room.fixedStep( FIXED_DT );
}

export function playerOf( room: MatchRoom, sessionId: string ): PlayerState {
    const p = room.state.players.get( sessionId );
    assert.ok( p, `player ${ sessionId } is in the room` );
    return p;
}
