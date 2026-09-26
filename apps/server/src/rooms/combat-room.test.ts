import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import type { ColyseusTestServer } from '@colyseus/testing';
import {
    DEFAULT_ARENA,
    INPUT_MESSAGE,
    idleInput,
    KILL_MESSAGE,
    type KillMessage,
    materializeArena,
    type NetInput,
    type PlayerState,
    RESPAWN_DELAY,
    SET_CLASS_MESSAGE,
    SHIP_CLASSES,
    SPAWN_PROTECTION,
} from '@voidbrawl/shared';
import type { MatchRoom } from './match-room.js';
import { goLive, openMatch, playerOf, startTestServer, tick } from './test-server.test.js';
import { markDead } from './vitals-ops.js';

const ARENA = materializeArena( DEFAULT_ARENA );
const LANE_Z = ARENA.bases[ 0 ].center.z;

function fireInputs( from: number, count: number ): NetInput[] {
    return Array.from( { length: count }, ( _, i ) => ( { ...idleInput(), seq: from + i, fire: true } ) );
}

function place( p: PlayerState, z: number ): void {
    p.x = 0;
    p.y = 0;
    p.z = z;
    p.vx = 0;
    p.vy = 0;
    p.vz = 0;
    p.qx = 0;
    p.qy = 0;
    p.qz = 0;
    p.qw = 1;
    p.protect = 0;
}

async function shoot( room: MatchRoom, client: { send( t: string, m: unknown ): void }, from: number, count: number ) {
    client.send( INPUT_MESSAGE, { inputs: fireInputs( from, count ) } );
    await room.waitForMessage( INPUT_MESSAGE );
}

describe( 'MatchRoom combat', () => {
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

    test( 'bolts kill an enemy, credit the killer, and the victim respawns protected at its base', async () => {
        const { room, connections } = await openMatch( colyseus, 2 );
        goLive( room );
        const [ a, b ] = connections;
        const shooter = playerOf( room, a.sessionId );
        const victim = playerOf( room, b.sessionId );
        place( shooter, LANE_Z );
        place( victim, LANE_Z + 40 );
        const kills: KillMessage[] = [];
        b.onMessage( KILL_MESSAGE, ( m: KillMessage ) => kills.push( m ) );
        a.onMessage( KILL_MESSAGE, () => {} );
        a.onMessage( 'hit', () => {} );
        b.onMessage( 'hit', () => {} );

        await shoot( room, a, 1, 150 );
        tick( room, 170 );
        assert.equal( victim.dead, true );
        assert.equal( shooter.kills, 1 );
        assert.equal( victim.deaths, 1 );

        let waited = 0;
        while ( victim.dead && waited < 600 ) {
            tick( room, 1 );
            waited++;
        }
        assert.equal( victim.dead, false );
        assert.ok( waited <= Math.ceil( RESPAWN_DELAY * 60 ) + 1 );
        assert.equal( victim.hull, SHIP_CLASSES.fighter.hull );
        assert.equal( victim.shield, SHIP_CLASSES.fighter.shield );
        assert.ok( victim.protect > SPAWN_PROTECTION - 0.1 );
        assert.ok( Math.abs( victim.z - ARENA.bases[ 1 ].center.z ) < 1e-3 );
        for ( let i = 0; i < 20 && kills.length === 0; i++ ) {
            // setTimeout: the broadcast reaches the test client over a real socket; poll briefly for it.
            await delay( 10 );
        }
        assert.deepEqual( kills[ 0 ], { victimId: b.sessionId, killerId: a.sessionId, cause: 'bolt' } );
    } );

    test( 'teammates cannot hurt each other', async () => {
        const { room, connections } = await openMatch( colyseus, 3 );
        goLive( room );
        const [ a, , c ] = connections;
        const shooter = playerOf( room, a.sessionId );
        const mate = playerOf( room, c.sessionId );
        assert.equal( mate.team, shooter.team );
        place( shooter, LANE_Z );
        place( mate, LANE_Z + 40 );
        await shoot( room, a, 1, 60 );
        tick( room, 80 );
        assert.equal( mate.hull, SHIP_CLASSES.fighter.hull );
        assert.equal( mate.shield, SHIP_CLASSES.fighter.shield );
    } );

    test( 'spawn protection absorbs hits and stays on while the protected ship fires', async () => {
        const { room, connections } = await openMatch( colyseus, 2 );
        goLive( room );
        const [ a, b ] = connections;
        const shooter = playerOf( room, a.sessionId );
        const victim = playerOf( room, b.sessionId );
        place( shooter, LANE_Z );
        place( victim, LANE_Z + 40 );
        victim.protect = 5;
        a.onMessage( 'hit', () => {} );
        b.onMessage( 'hit', () => {} );
        await shoot( room, a, 1, 20 );
        tick( room, 30 );
        assert.equal( victim.shield, SHIP_CLASSES.fighter.shield );
        const left = victim.protect;
        await shoot( room, b, 1, 1 );
        tick( room, 1 );
        assert.ok( victim.protect > left - 0.05 );
    } );

    test( 'a pending class change applies at the respawn', async () => {
        const { room, connections } = await openMatch( colyseus, 1 );
        goLive( room );
        const [ a ] = connections;
        a.onMessage( KILL_MESSAGE, () => {} );
        a.send( SET_CLASS_MESSAGE, 'heavy' );
        await room.waitForMessage( SET_CLASS_MESSAGE );
        const p = playerOf( room, a.sessionId );
        markDead( p );
        tick( room, Math.ceil( RESPAWN_DELAY * 60 ) + 1 );
        assert.equal( p.dead, false );
        assert.equal( p.classId, 'heavy' );
        assert.equal( p.hull, SHIP_CLASSES.heavy.hull );
    } );

    test( 'ramming an asteroid at speed damages the ship', async () => {
        const { room, connections } = await openMatch( colyseus, 1 );
        goLive( room );
        const [ a ] = connections;
        const p = playerOf( room, a.sessionId );
        const rock = ARENA.asteroids[ 0 ];
        place( p, rock.z - rock.r - SHIP_CLASSES.fighter.tuning.hullRadius - 0.5 );
        p.x = rock.x;
        p.y = rock.y;
        p.vz = 80;
        a.send( INPUT_MESSAGE, { inputs: [ { ...idleInput(), seq: 1 } ] } );
        await room.waitForMessage( INPUT_MESSAGE );
        tick( room, 1 );
        assert.ok( p.shield < SHIP_CLASSES.fighter.shield );
    } );
} );
