import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, test } from 'node:test';
import type { ColyseusTestServer } from '@colyseus/testing';
import {
    COUNTDOWN,
    DEFAULT_ARENA,
    FIXED_DT,
    HIT_MESSAGE,
    KILL_MESSAGE,
    MATCH_ROOM,
    MatchState,
    materializeArena,
    PHASE,
    PlayerState,
    SHIP_CLASSES,
    START_MESSAGE,
} from '@voidbrawl/shared';
import type { MatchRoom } from '../rooms/match-room.js';
import { playerOf, startTestServer, tick } from '../rooms/test-server.test.js';
import { botInput, createBrain, isBot } from './bot-pilot.js';

const ARENA = materializeArena( DEFAULT_ARENA );

function botOf( room: MatchRoom ): PlayerState {
    const id = [ ...room.state.players.keys() ].find( isBot );
    assert.ok( id, 'the room has a bot' );
    return playerOf( room, id );
}

describe( 'practice bot', () => {
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

    async function practice() {
        const room = await colyseus.createRoom< MatchRoom >( MATCH_ROOM, { mode: 'duel', bot: true } );
        room.setSimulationInterval();
        const human = await colyseus.connectTo( room, { name: 'Me' } );
        human.onMessage( HIT_MESSAGE, () => {} );
        human.onMessage( KILL_MESSAGE, () => {} );
        return { room, human };
    }

    test( 'a practice room is a 1v1 with the bot on cyan and the human as host on marigold', async () => {
        const { room, human } = await practice();
        assert.equal( room.state.mode, 'duel' );
        assert.equal( botOf( room ).team, 1 );
        assert.equal( playerOf( room, human.sessionId ).team, 0 );
        assert.equal( room.state.hostId, human.sessionId );
    } );

    test( 'the bot turns its nose toward a target on its right', () => {
        const state = new MatchState();
        const bot = new PlayerState();
        bot.team = 1;
        const target = new PlayerState();
        target.team = 0;
        target.x = -200;
        target.z = 200;
        state.players.set( 'bot:1', bot );
        state.players.set( 'me', target );
        const input = botInput( bot, createBrain(), state, { ...ARENA, asteroids: [] }, FIXED_DT );
        assert.ok( input.yaw > 0 );
    } );

    test( 'once the match is live the bot hunts and hits a stationary pilot', async () => {
        const { room, human } = await practice();
        human.send( START_MESSAGE );
        await room.waitForMessage( START_MESSAGE );
        tick( room, Math.ceil( COUNTDOWN * 60 ) + 1 );
        assert.equal( room.state.phase, PHASE.live );
        const bot = botOf( room );
        const me = playerOf( room, human.sessionId );
        me.x = bot.x + 60;
        me.y = bot.y + 30;
        me.z = bot.z - 220;
        me.protect = 0;
        const full = SHIP_CLASSES.fighter.hull + SHIP_CLASSES.fighter.shield;
        tick( room, 60 * 8 );
        assert.ok( me.deaths > 0 || me.hull + me.shield < full, 'the bot landed hits' );
    } );
} );
