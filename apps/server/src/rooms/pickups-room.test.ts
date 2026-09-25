import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, test } from 'node:test';
import type { ColyseusTestServer } from '@colyseus/testing';
import {
    DEFAULT_ARENA,
    HIT_MESSAGE,
    isPickupKind,
    KILL_MESSAGE,
    MINE,
    materializeArena,
    PAD_RESPAWN,
    PHASE,
    PICKUP,
    type PlayerState,
    SEEKER,
    SET_CLASS_MESSAGE,
    SHIP_CLASSES,
    USE_PICKUP_MESSAGE,
} from '@voidbrawl/shared';
import type { MatchRoom } from './match-room.js';
import { goLive, openMatch, playerOf, startTestServer, tick } from './test-server.test.js';

const ARENA = materializeArena( DEFAULT_ARENA );
const HOME = ARENA.bases[ 0 ].center;

function place( p: PlayerState, x: number, y: number, z: number ): void {
    p.x = x;
    p.y = y;
    p.z = z;
    p.vx = 0;
    p.vy = 0;
    p.vz = 0;
    p.protect = 0;
}

describe( 'pickups', () => {
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

    async function duel() {
        const { room, connections } = await openMatch( colyseus, 2, 'duel' );
        for ( const c of connections ) {
            c.onMessage( HIT_MESSAGE, () => {} );
            c.onMessage( KILL_MESSAGE, () => {} );
        }
        const me = playerOf( room, connections[ 0 ].sessionId );
        const foe = playerOf( room, connections[ 1 ].sessionId );
        return { room, connections, me, foe, meId: connections[ 0 ].sessionId, foeId: connections[ 1 ].sessionId };
    }

    function parkFoe( foe: PlayerState ): void {
        place( foe, ARENA.bases[ 1 ].center.x, ARENA.bases[ 1 ].center.y, ARENA.bases[ 1 ].center.z );
    }

    test( 'every pad is stocked when the room opens', async () => {
        const { room } = await duel();
        assert.equal( room.state.pads.length, ARENA.pads.length );
        for ( const pad of room.state.pads ) assert.ok( isPickupKind( pad.kind ) );
    } );

    test( 'flying through a pad in a live match takes its pickup, and the pad restocks later', async () => {
        const { room, me, foe } = await duel();
        parkFoe( foe );
        goLive( room );
        const kind = room.state.pads[ 0 ].kind;
        const pad = ARENA.pads[ 0 ];
        place( me, pad.x, pad.y, pad.z );
        tick( room, 1 );
        assert.equal( me.slot0, kind );
        assert.equal( room.state.pads[ 0 ].kind, PICKUP.none );
        place( me, HOME.x, HOME.y, HOME.z );
        tick( room, Math.ceil( PAD_RESPAWN * 60 ) + 1 );
        assert.ok( isPickupKind( room.state.pads[ 0 ].kind ) );
    } );

    test( 'pads give nothing in the lobby', async () => {
        const { room, me } = await duel();
        const pad = ARENA.pads[ 0 ];
        place( me, pad.x, pad.y, pad.z );
        tick( room, 1 );
        assert.equal( me.slot0, PICKUP.none );
    } );

    test( 'an Interceptor holds two pickups and a Fighter three', async () => {
        const { room, me, foe } = await duel();
        parkFoe( foe );
        goLive( room );
        me.classId = 'interceptor';
        me.slot0 = PICKUP.boost;
        me.slot1 = PICKUP.boost;
        const pad = ARENA.pads[ 0 ];
        place( me, pad.x, pad.y, pad.z );
        tick( room, 1 );
        assert.equal( me.slot2, PICKUP.none );
        assert.ok( isPickupKind( room.state.pads[ 0 ].kind ) );
        me.classId = 'fighter';
        tick( room, 1 );
        assert.ok( isPickupKind( me.slot2 ) );
    } );

    test( 'shield, health and boost apply at once through the use message', async () => {
        const { room, connections, me, foe } = await duel();
        parkFoe( foe );
        goLive( room );
        place( me, HOME.x, HOME.y, HOME.z );
        me.shield = 0;
        me.hull = 10;
        me.boost = 0;
        me.slot0 = PICKUP.shield;
        me.slot1 = PICKUP.health;
        me.slot2 = PICKUP.boost;
        for ( const slot of [ 0, 1, 2 ] ) {
            connections[ 0 ].send( USE_PICKUP_MESSAGE, slot );
            await room.waitForMessage( USE_PICKUP_MESSAGE );
        }
        assert.equal( me.shield, me.maxShield );
        assert.equal( me.hull, 10 + SHIP_CLASSES.fighter.hull / 2 );
        assert.equal( me.boost, 1 );
        assert.deepEqual( [ me.slot0, me.slot1, me.slot2 ], [ 0, 0, 0 ] );
    } );

    test( 'a seeker locks an enemy ahead and hits it', async () => {
        const { room, me, foe, meId } = await duel();
        goLive( room );
        place( me, HOME.x, HOME.y, HOME.z );
        place( foe, HOME.x + 20, HOME.y, HOME.z + 110 );
        const full = foe.hull + foe.shield;
        me.slot0 = PICKUP.seeker;
        room.use( meId, 0 );
        const [ missile ] = [ ...room.state.missiles.values() ];
        assert.equal(
            missile.targetId,
            [ ...room.state.players.keys() ].find( ( id ) => id !== meId ),
        );
        tick( room, 90 );
        assert.equal( room.state.missiles.size, 0 );
        assert.equal( foe.hull + foe.shield, full - SEEKER.damage );
    } );

    test( 'a mine arms, then blows up on the first enemy near it and credits the kill', async () => {
        const { room, me, foe, meId } = await duel();
        goLive( room );
        place( me, HOME.x, HOME.y, HOME.z );
        parkFoe( foe );
        me.slot0 = PICKUP.mine;
        room.use( meId, 0 );
        const [ mine ] = [ ...room.state.mines.values() ];
        assert.ok( mine.z < me.z );
        place( foe, mine.x, mine.y, mine.z + 10 );
        foe.hull = 1;
        foe.shield = 0;
        tick( room, Math.floor( MINE.armDelay * 60 ) - 5 );
        assert.equal( foe.dead, false );
        tick( room, 10 );
        assert.equal( foe.dead, true );
        assert.equal( me.kills, 1 );
        assert.equal( room.state.mines.size, 0 );
    } );

    test( 'a pilot keeps at most three mines out', async () => {
        const { room, me, foe, meId } = await duel();
        parkFoe( foe );
        goLive( room );
        place( me, HOME.x, HOME.y, HOME.z );
        for ( let i = 0; i < MINE.max + 2; i++ ) {
            me.slot0 = PICKUP.mine;
            room.use( meId, 0 );
        }
        assert.equal( room.state.mines.size, MINE.max );
    } );

    test( 'dying drops every held pickup', async () => {
        const { room, connections, me } = await duel();
        goLive( room );
        me.slot0 = PICKUP.seeker;
        me.slot1 = PICKUP.mine;
        connections[ 0 ].send( 'selfDestruct' );
        await room.waitForMessage( 'selfDestruct' );
        assert.deepEqual( [ me.slot0, me.slot1, me.slot2 ], [ 0, 0, 0 ] );
    } );

    test( 'picking a class in the lobby changes the ship at once', async () => {
        const { room, connections, me } = await duel();
        assert.equal( room.state.phase, PHASE.lobby );
        connections[ 0 ].send( SET_CLASS_MESSAGE, 'heavy' );
        await room.waitForMessage( SET_CLASS_MESSAGE );
        assert.equal( me.classId, 'heavy' );
        assert.equal( me.hull, SHIP_CLASSES.heavy.hull );
        assert.equal( me.regenDelay, SHIP_CLASSES.heavy.regenDelay );
    } );
} );

export type { MatchRoom };
