import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, beforeEach, describe, test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { Server } from '@colyseus/core';
import { ColyseusTestServer } from '@colyseus/testing';
import { WebSocketTransport } from '@colyseus/ws-transport';
import {
    DEFAULT_ARENA,
    FIXED_DT,
    INPUT_MESSAGE,
    idleInput,
    MATCH_ROOM,
    materializeArena,
    type NetInput,
    type PlayerState,
    RESPAWN_MESSAGE,
    SET_CLASS_MESSAGE,
    SHIP_CLASSES,
    spawnShip,
    stepShip,
    toArenaDescriptor,
} from '@voidbrawl/shared';
import { MatchRoom } from './match-room.js';

const ARENA = materializeArena( DEFAULT_ARENA );

function tick( room: MatchRoom, steps: number ): void {
    for ( let i = 0; i < steps; i++ ) room.fixedStep( FIXED_DT );
}

function playerOf( room: MatchRoom, sessionId: string ): PlayerState {
    const p = room.state.players.get( sessionId );
    assert.ok( p, `player ${ sessionId } is in the room` );
    return p;
}

function thrustInputs( from: number, count: number ): NetInput[] {
    return Array.from( { length: count }, ( _, i ) => ( {
        ...idleInput(),
        seq: from + i,
        thrust: 1,
        yaw: 0.01,
    } ) );
}

describe( 'MatchRoom', () => {
    let colyseus: ColyseusTestServer;

    before( async () => {
        const transport = new WebSocketTransport();
        const gameServer = new Server( { transport } );
        gameServer.define( MATCH_ROOM, MatchRoom );
        await gameServer.listen( 0 );
        const address = transport.server?.address() as AddressInfo | null;
        assert.ok( address && typeof address === 'object', 'the test server bound a TCP port' );
        ( gameServer as unknown as { port: number } ).port = address.port;
        colyseus = new ColyseusTestServer( gameServer );
    } );

    after( async () => {
        await colyseus.shutdown();
    } );

    beforeEach( async () => {
        await colyseus.cleanup();
    } );

    async function match( clients: number ) {
        const room = await colyseus.createRoom< MatchRoom >( MATCH_ROOM );
        room.setSimulationInterval();
        const connections = [];
        for ( let i = 0; i < clients; i++ ) connections.push( await colyseus.connectTo( room, { name: `P${ i }` } ) );
        return { room, connections };
    }

    test( 'the arena descriptor is in the state', async () => {
        const { room } = await match( 1 );
        assert.deepEqual( toArenaDescriptor( room.state.arena ), DEFAULT_ARENA );
    } );

    test( 'joiners alternate teams and spawn at their own base', async () => {
        const { room, connections } = await match( 4 );
        const teams = connections.map( ( c ) => playerOf( room, c.sessionId ).team );
        assert.deepEqual( teams, [ 0, 1, 0, 1 ] );
        for ( const c of connections ) {
            const p = playerOf( room, c.sessionId );
            const base = ARENA.bases[ p.team ].center;
            assert.ok( Math.abs( p.z - base.z ) < 1e-3 );
        }
        const [ a, , c ] = connections;
        const pa = playerOf( room, a.sessionId );
        const pc = playerOf( room, c.sessionId );
        assert.ok( pa.x !== pc.x || pa.y !== pc.y, 'teammates get different spawn points' );
    } );

    test( 'the server runs queued inputs through the shared sim and echoes the last seq', async () => {
        const { room, connections } = await match( 1 );
        const [ client ] = connections;
        const inputs = thrustInputs( 1, 30 );
        client.send( INPUT_MESSAGE, { inputs } );
        await room.waitForMessage( INPUT_MESSAGE );
        tick( room, 40 );

        const expected = spawnShip( ARENA, 0, 0 );
        for ( const input of inputs ) stepShip( expected, input, SHIP_CLASSES.fighter.tuning, ARENA, FIXED_DT );
        const p = playerOf( room, client.sessionId );
        assert.equal( p.lastProcessedInput, 30 );
        assert.equal( p.z, expected.z );
        assert.equal( p.qy, expected.qy );
        assert.ok( p.z > spawnShip( ARENA, 0, 0 ).z, 'thrust moved the ship toward the centre' );
    } );

    test( 'repeated or malformed inputs are dropped', async () => {
        const { room, connections } = await match( 1 );
        const [ client ] = connections;
        client.send( INPUT_MESSAGE, { inputs: thrustInputs( 1, 10 ) } );
        await room.waitForMessage( INPUT_MESSAGE );
        tick( room, 10 );
        const z = playerOf( room, client.sessionId ).z;

        client.send( INPUT_MESSAGE, { inputs: [ ...thrustInputs( 5, 3 ), { seq: 99, thrust: 'full' } ] } );
        await room.waitForMessage( INPUT_MESSAGE );
        tick( room, 10 );
        assert.equal( playerOf( room, client.sessionId ).z, z );
        assert.equal( playerOf( room, client.sessionId ).lastProcessedInput, 10 );
    } );

    test( 'a class switch accepts only known classes', async () => {
        const { room, connections } = await match( 1 );
        const [ client ] = connections;
        client.send( SET_CLASS_MESSAGE, 'battleship' );
        await room.waitForMessage( SET_CLASS_MESSAGE );
        assert.equal( playerOf( room, client.sessionId ).classId, 'fighter' );
        client.send( SET_CLASS_MESSAGE, 'heavy' );
        await room.waitForMessage( SET_CLASS_MESSAGE );
        assert.equal( playerOf( room, client.sessionId ).classId, 'heavy' );
    } );

    test( 'respawn returns the ship to its base at rest', async () => {
        const { room, connections } = await match( 1 );
        const [ client ] = connections;
        client.send( INPUT_MESSAGE, { inputs: thrustInputs( 1, 60 ) } );
        await room.waitForMessage( INPUT_MESSAGE );
        tick( room, 60 );
        client.send( RESPAWN_MESSAGE );
        await room.waitForMessage( RESPAWN_MESSAGE );
        const p = playerOf( room, client.sessionId );
        const spawn = spawnShip( ARENA, 0, 0 );
        assert.equal( p.z, spawn.z );
        assert.equal( p.vz, 0 );
    } );

    test( 'a leaving player is removed from the state', async () => {
        const { room, connections } = await match( 2 );
        const [ leaver ] = connections;
        await leaver.leave();
        // setTimeout: onLeave runs on the server after the socket closes; give it one event-loop turn.
        await delay( 50 );
        assert.equal( room.state.players.size, 1 );
    } );
} );
