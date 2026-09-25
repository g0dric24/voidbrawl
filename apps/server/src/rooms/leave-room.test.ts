import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, test } from 'node:test';
import type { ColyseusTestServer } from '@colyseus/testing';
import { PHASE } from '@voidbrawl/shared';
import type { MatchRoom } from './match-room.js';
import { goLive, openMatch, playerOf, startTestServer } from './test-server.test.js';

async function until( room: MatchRoom, done: () => boolean ): Promise< void > {
    for ( let i = 0; i < 40 && ! done(); i++ ) await room.waitForNextPatch();
}

describe( 'leaving a match', () => {
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

    test( 'in a 1v1 the pilot who stays wins when the other leaves', async () => {
        const { room, connections } = await openMatch( colyseus, 2, 'duel' );
        const [ stays, leaves ] = connections;
        goLive( room );
        await leaves.leave();
        await until( room, () => room.state.phase === PHASE.results );
        assert.equal( room.state.phase, PHASE.results );
        assert.equal( room.state.forfeit, true );
        assert.equal( room.state.winner, playerOf( room, stays.sessionId ).team );
    } );

    test( 'in a 2v2 the match goes on after one leaver and ends when the side is empty', async () => {
        const { room, connections } = await openMatch( colyseus, 4, 'squad' );
        const team = ( i: number ) => playerOf( room, connections[ i ].sessionId ).team;
        const side = connections.filter( ( _c, i ) => team( i ) === 0 );
        assert.equal( side.length, 2 );
        goLive( room );

        await side[ 0 ].leave();
        await until( room, () => room.state.players.size === 3 );
        assert.equal( room.state.phase, PHASE.live );

        await side[ 1 ].leave();
        await until( room, () => room.state.phase === PHASE.results );
        assert.equal( room.state.phase, PHASE.results );
        assert.equal( room.state.winner, 1 );
        assert.equal( room.state.forfeit, true );
    } );

    test( 'a leaver in the lobby ends nothing', async () => {
        const { room, connections } = await openMatch( colyseus, 2, 'duel' );
        await connections[ 1 ].leave();
        await until( room, () => room.state.players.size === 1 );
        assert.equal( room.state.phase, PHASE.lobby );
        assert.equal( room.state.forfeit, false );
    } );
} );
