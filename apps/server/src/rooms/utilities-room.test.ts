import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, test } from 'node:test';
import type { ColyseusTestServer } from '@colyseus/testing';
import {
    DEFAULT_ARENA,
    DROP_MINE_MESSAGE,
    HIT_MESSAGE,
    INPUT_MESSAGE,
    idleInput,
    KILL_MESSAGE,
    MINE,
    materializeArena,
    type NetInput,
    PHASE,
    type PlayerState,
    RESPAWN_DELAY,
    SEEKER,
    SET_CLASS_MESSAGE,
    SHIP_CLASSES,
} from '@voidbrawl/shared';
import type { MatchRoom } from './match-room.js';
import { goLive, openMatch, playerOf, startTestServer, tick } from './test-server.test.js';
import { markDead } from './vitals-ops.js';

const ARENA = materializeArena( DEFAULT_ARENA );
const HOME = ARENA.bases[ 0 ].center;
const AWAY = ARENA.bases[ 1 ].center;
const LOCK_TICKS = Math.ceil( SEEKER.lockTime * 60 ) + 2;

function place( p: PlayerState, x: number, y: number, z: number ): void {
    p.x = x;
    p.y = y;
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

function lockInputs( from: number, held: number ): NetInput[] {
    const out: NetInput[] = [];
    for ( let i = 0; i < held; i++ ) out.push( { ...idleInput(), seq: from + i, lock: true } );
    out.push( { ...idleInput(), seq: from + held, lock: false } );
    return out;
}

describe( 'utilities', () => {
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
        const [ a, b ] = connections;
        return { room, a, b, me: playerOf( room, a.sessionId ), foe: playerOf( room, b.sessionId ) };
    }

    async function send( room: MatchRoom, client: { send( t: string, m?: unknown ): void }, t: string, m?: unknown ) {
        client.send( t, m );
        await room.waitForMessage( t );
    }

    test( 'every pilot spawns with the class kit, and a respawn refills it', async () => {
        const { room, me } = await duel();
        assert.equal( me.seekers, SHIP_CLASSES.fighter.seekers );
        assert.equal( me.mines, SHIP_CLASSES.fighter.mines );
        goLive( room );
        me.seekers = 0;
        me.mines = 0;
        markDead( me );
        tick( room, Math.ceil( RESPAWN_DELAY * 60 ) + 1 );
        assert.equal( me.dead, false );
        assert.equal( me.seekers, 3 );
        assert.equal( me.mines, 3 );
    } );

    test( 'a Heavy picked in the lobby carries 2 of each', async () => {
        const { room, a, me } = await duel();
        await send( room, a, SET_CLASS_MESSAGE, 'heavy' );
        assert.equal( me.seekers, 2 );
        assert.equal( me.mines, 2 );
    } );

    test( 'holding the lock on an enemy for the lock time, then releasing, fires a seeker that hits', async () => {
        const { room, a, me, foe } = await duel();
        goLive( room );
        place( me, HOME.x, HOME.y, HOME.z );
        place( foe, HOME.x + 15, HOME.y, HOME.z + 110 );
        const full = foe.hull + foe.shield;
        await send( room, a, INPUT_MESSAGE, { inputs: lockInputs( 1, LOCK_TICKS ) } );
        tick( room, LOCK_TICKS );
        assert.equal( me.lockProgress, 1 );
        assert.equal( room.state.missiles.size, 0 );
        tick( room, 1 );
        assert.equal( room.state.missiles.size, 1 );
        assert.equal( me.seekers, 2 );
        assert.ok( me.seekerCooldown > SEEKER.cooldown - 0.1 );
        tick( room, 90 );
        assert.equal( foe.hull + foe.shield, full - SEEKER.damage );
    } );

    test( 'releasing before the lock completes fires nothing', async () => {
        const { room, a, me, foe } = await duel();
        goLive( room );
        place( me, HOME.x, HOME.y, HOME.z );
        place( foe, HOME.x, HOME.y, HOME.z + 110 );
        await send( room, a, INPUT_MESSAGE, { inputs: lockInputs( 1, 10 ) } );
        tick( room, 11 );
        assert.equal( room.state.missiles.size, 0 );
        assert.equal( me.seekers, 3 );
        assert.equal( me.lockProgress, 0 );
    } );

    test( 'a seeker cannot lock while the cooldown runs', async () => {
        const { room, a, me, foe } = await duel();
        goLive( room );
        place( me, HOME.x, HOME.y, HOME.z );
        place( foe, HOME.x, HOME.y, HOME.z + 110 );
        me.seekerCooldown = 2;
        await send( room, a, INPUT_MESSAGE, { inputs: lockInputs( 1, 20 ) } );
        tick( room, 20 );
        assert.equal( me.lockProgress, 0 );
    } );

    test( 'a mine drops behind, uses one from the kit, and does nothing when the kit is empty', async () => {
        const { room, a, me, foe } = await duel();
        place( foe, AWAY.x, AWAY.y, AWAY.z );
        goLive( room );
        place( me, HOME.x, HOME.y, HOME.z );
        await send( room, a, DROP_MINE_MESSAGE );
        const [ mine ] = [ ...room.state.mines.values() ];
        assert.ok( mine.z < me.z );
        assert.equal( me.mines, 2 );
        me.mines = 0;
        await send( room, a, DROP_MINE_MESSAGE );
        assert.equal( room.state.mines.size, 1 );
    } );

    test( 'an armed mine blows up on an enemy and credits the kill', async () => {
        const { room, a, me, foe } = await duel();
        goLive( room );
        place( me, HOME.x, HOME.y, HOME.z );
        place( foe, AWAY.x, AWAY.y, AWAY.z );
        await send( room, a, DROP_MINE_MESSAGE );
        const [ mine ] = [ ...room.state.mines.values() ];
        place( foe, mine.x, mine.y, mine.z + 10 );
        foe.hull = MINE.damage - 1;
        foe.shield = 0;
        foe.shieldDelay = 99;
        tick( room, Math.floor( MINE.armDelay * 60 ) - 5 );
        assert.equal( foe.dead, false );
        tick( room, 10 );
        assert.equal( foe.dead, true );
        assert.equal( me.kills, 1 );
    } );

    test( 'a mine blows up on its own when the fuse runs out and hits enemies in the blast', async () => {
        const { room, a, me, foe } = await duel();
        goLive( room );
        place( me, HOME.x, HOME.y, HOME.z );
        place( foe, AWAY.x, AWAY.y, AWAY.z );
        await send( room, a, DROP_MINE_MESSAGE );
        const [ mine ] = [ ...room.state.mines.values() ];
        const gap = ( MINE.trigger + MINE.blast ) / 2 + SHIP_CLASSES.fighter.hitRadius;
        place( foe, mine.x + gap, mine.y, mine.z );
        foe.shieldDelay = 99;
        const full = foe.hull + foe.shield;
        tick( room, Math.floor( MINE.fuse * 60 ) - 2 );
        assert.equal( room.state.mines.size, 1 );
        assert.equal( foe.hull + foe.shield, full );
        tick( room, 3 );
        assert.equal( room.state.mines.size, 0 );
        assert.equal( foe.hull + foe.shield, full - MINE.damage );
    } );

    test( 'mines and seekers are ignored outside a live match', async () => {
        const { room, a } = await duel();
        assert.equal( room.state.phase, PHASE.lobby );
        await send( room, a, DROP_MINE_MESSAGE );
        assert.equal( room.state.mines.size, 0 );
    } );
} );
