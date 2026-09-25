import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import type { ColyseusTestServer } from '@colyseus/testing';
import {
    COUNTDOWN,
    DEFAULT_ARENA,
    KILL_MESSAGE,
    MODES,
    MOVE_PLAYER_MESSAGE,
    materializeArena,
    PHASE,
    PICK_TEAM_MESSAGE,
    PLAY_AGAIN_MESSAGE,
    START_MESSAGE,
} from '@voidbrawl/shared';
import type { MatchRoom } from './match-room.js';
import { openMatch, playerOf, startTestServer, tick } from './test-server.test.js';
import { markDead } from './vitals-ops.js';

const ARENA = materializeArena( DEFAULT_ARENA );

function killPlayer( room: MatchRoom, sessionId: string ): void {
    const p = playerOf( room, sessionId );
    markDead( p );
    ( room as unknown as { announceKill( v: string, k: string, c: string ): void } ).announceKill(
        sessionId,
        '',
        'crash',
    );
}

async function send( room: MatchRoom, client: { send( t: string, m?: unknown ): void }, type: string, msg?: unknown ) {
    client.send( type, msg );
    await room.waitForMessage( type );
}

describe( 'MatchRoom flow', () => {
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

    test( 'the room takes its mode and capacity from the creator, and the first joiner is host', async () => {
        const { room, connections } = await openMatch( colyseus, 2, 'squad' );
        assert.equal( room.state.mode, 'squad' );
        assert.equal( room.maxClients, MODES.squad.teamSize * 2 );
        assert.equal( room.state.hostId, connections[ 0 ].sessionId );
        assert.equal( room.state.phase, PHASE.lobby );
    } );

    test( 'a full duel refuses a third pilot', async () => {
        const { room } = await openMatch( colyseus, 2, 'duel' );
        await assert.rejects( colyseus.connectTo( room, { name: 'extra' } ) );
    } );

    test( 'players pick a side up to the team size and move to that base', async () => {
        const { room, connections } = await openMatch( colyseus, 3, 'squad' );
        const [ a, b, c ] = connections;
        assert.equal( playerOf( room, c.sessionId ).team, 0 );
        await send( room, a, PICK_TEAM_MESSAGE, 1 );
        assert.equal( playerOf( room, a.sessionId ).team, 1 );
        assert.ok( Math.abs( playerOf( room, a.sessionId ).z - ARENA.bases[ 1 ].center.z ) < 1e-3 );
        await send( room, c, PICK_TEAM_MESSAGE, 1 );
        assert.equal( playerOf( room, c.sessionId ).team, 0, 'cyan already holds two' );
        assert.equal( playerOf( room, b.sessionId ).team, 1 );
    } );

    test( 'only the host can move players or start, and only with both teams present', async () => {
        const { room, connections } = await openMatch( colyseus, 2, 'squad' );
        const [ host, guest ] = connections;
        await send( room, guest, MOVE_PLAYER_MESSAGE, { sessionId: host.sessionId, team: 1 } );
        assert.equal( playerOf( room, host.sessionId ).team, 0 );
        await send( room, host, MOVE_PLAYER_MESSAGE, { sessionId: guest.sessionId, team: 0 } );
        assert.equal( playerOf( room, guest.sessionId ).team, 0 );
        await send( room, host, START_MESSAGE );
        assert.equal( room.state.phase, PHASE.lobby, 'cyan is empty' );
        await send( room, host, MOVE_PLAYER_MESSAGE, { sessionId: guest.sessionId, team: 1 } );
        await send( room, guest, START_MESSAGE );
        assert.equal( room.state.phase, PHASE.lobby, 'guest is not host' );
        await send( room, host, START_MESSAGE );
        assert.equal( room.state.phase, PHASE.countdown );
    } );

    test( 'countdown → live → first to the target wins → play again returns to the lobby', async () => {
        const { room, connections } = await openMatch( colyseus, 2, 'duel' );
        const [ host, guest ] = connections;
        for ( const c of connections ) c.onMessage( KILL_MESSAGE, () => {} );
        await send( room, host, START_MESSAGE );
        tick( room, Math.ceil( COUNTDOWN * 60 ) + 1 );
        assert.equal( room.state.phase, PHASE.live );
        for ( let i = 0; i < MODES.duel.target; i++ ) {
            killPlayer( room, guest.sessionId );
            playerOf( room, guest.sessionId ).dead = false;
        }
        assert.equal( room.state.score0, MODES.duel.target );
        assert.equal( room.state.phase, PHASE.results );
        assert.equal( room.state.winner, 0 );
        await send( room, host, PLAY_AGAIN_MESSAGE );
        assert.equal( room.state.phase, PHASE.lobby );
    } );

    test( 'a tie at the time limit goes to sudden death, and the next point wins', async () => {
        const { room, connections } = await openMatch( colyseus, 2, 'duel' );
        const [ host, guest ] = connections;
        for ( const c of connections ) c.onMessage( KILL_MESSAGE, () => {} );
        await send( room, host, START_MESSAGE );
        tick( room, Math.ceil( COUNTDOWN * 60 ) + 1 );
        room.state.timeLeft = 0.01;
        tick( room, 2 );
        assert.equal( room.state.suddenDeath, true );
        assert.equal( room.state.phase, PHASE.live );
        killPlayer( room, host.sessionId );
        assert.equal( room.state.phase, PHASE.results );
        assert.equal( room.state.winner, 1 );
        assert.equal( playerOf( room, guest.sessionId ).team, 1 );
    } );

    test( 'the host role passes on when the host leaves', async () => {
        const { room, connections } = await openMatch( colyseus, 2, 'duel' );
        const [ host, guest ] = connections;
        await host.leave();
        // setTimeout: onLeave runs on the server after the socket closes; give it one event-loop turn.
        await delay( 50 );
        assert.equal( room.state.hostId, guest.sessionId );
    } );
} );
