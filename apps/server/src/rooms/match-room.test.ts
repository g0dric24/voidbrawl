import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import type { ColyseusTestServer } from '@colyseus/testing';
import {
    DEFAULT_ARENA,
    FIXED_DT,
    INPUT_MESSAGE,
    idleInput,
    materializeArena,
    type NetInput,
    SET_CLASS_MESSAGE,
    SHIP_CLASSES,
    spawnShip,
    stepShip,
    toArenaDescriptor,
} from '@voidbrawl/shared';
import { goLive, openMatch, playerOf, startTestServer, tick } from './test-server.test.js';

const ARENA = materializeArena( DEFAULT_ARENA );

function thrustInputs( from: number, count: number ): NetInput[] {
    return Array.from( { length: count }, ( _, i ) => ( { ...idleInput(), seq: from + i, thrust: 1, yaw: 0.01 } ) );
}

describe( 'MatchRoom flight', () => {
    let colyseus: ColyseusTestServer;

    before( async () => {
        colyseus = await startTestServer();
    } );

    after( async () => {
        await colyseus.shutdown();
    } );

    beforeEach( async () => {
        await colyseus.cleanup();
    } );

    test( 'the arena descriptor is in the state', async () => {
        const { room } = await openMatch( colyseus, 1 );
        assert.deepEqual( toArenaDescriptor( room.state.arena ), DEFAULT_ARENA );
    } );

    test( 'joiners alternate teams, spawn at their own base, and start with full vitals', async () => {
        const { room, connections } = await openMatch( colyseus, 4 );
        const teams = connections.map( ( c ) => playerOf( room, c.sessionId ).team );
        assert.deepEqual( teams, [ 0, 1, 0, 1 ] );
        for ( const c of connections ) {
            const p = playerOf( room, c.sessionId );
            assert.ok( Math.abs( p.z - ARENA.bases[ p.team ].center.z ) < 1e-3 );
            assert.equal( p.hull, SHIP_CLASSES.fighter.hull );
            assert.equal( p.shield, SHIP_CLASSES.fighter.shield );
        }
        const [ a, , c ] = connections;
        const pa = playerOf( room, a.sessionId );
        const pc = playerOf( room, c.sessionId );
        assert.ok( pa.x !== pc.x || pa.y !== pc.y, 'teammates get different spawn points' );
    } );

    test( 'the server runs queued inputs through the shared sim and echoes the last seq', async () => {
        const { room, connections } = await openMatch( colyseus, 1 );
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
        const { room, connections } = await openMatch( colyseus, 1 );
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

    test( 'a class switch in a live match accepts only known classes and waits for the next spawn', async () => {
        const { room, connections } = await openMatch( colyseus, 1 );
        goLive( room );
        const [ client ] = connections;
        client.send( SET_CLASS_MESSAGE, 'battleship' );
        await room.waitForMessage( SET_CLASS_MESSAGE );
        assert.equal( playerOf( room, client.sessionId ).nextClassId, '' );
        client.send( SET_CLASS_MESSAGE, 'heavy' );
        await room.waitForMessage( SET_CLASS_MESSAGE );
        const p = playerOf( room, client.sessionId );
        assert.equal( p.classId, 'fighter' );
        assert.equal( p.nextClassId, 'heavy' );
    } );

    test( 'a leaving player is removed from the state', async () => {
        const { room, connections } = await openMatch( colyseus, 2 );
        const [ leaver ] = connections;
        await leaver.leave();
        // setTimeout: onLeave runs on the server after the socket closes; give it one event-loop turn.
        await delay( 50 );
        assert.equal( room.state.players.size, 1 );
    } );
} );
