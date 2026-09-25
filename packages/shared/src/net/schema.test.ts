import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Decoder, Encoder } from '@colyseus/schema';
import { DEFAULT_ARENA, materializeArena } from '../arena/arena.js';
import { FIXED_DT } from '../sim/fixed-step.js';
import { idleInput } from '../sim/input.js';
import { SHIP_CLASSES } from '../sim/ship-classes.js';
import { copyShip, emptyShip, spawnShip } from '../sim/ship-state.js';
import { stepShip } from '../sim/step.js';
import { applyArenaDescriptor, classOf, MatchState, PlayerState, toArenaDescriptor } from './schema.js';

const ARENA = materializeArena( DEFAULT_ARENA );

test( 'a PlayerState steps exactly like a plain ship state', () => {
    const plain = spawnShip( ARENA, 0, 0 );
    const player = new PlayerState();
    copyShip( player, plain );
    const input = { ...idleInput(), thrust: 1, yaw: 0.02, roll: 1 };
    for ( let i = 0; i < 120; i++ ) {
        stepShip( plain, input, SHIP_CLASSES.fighter.tuning, ARENA, FIXED_DT );
        stepShip( player, input, SHIP_CLASSES.fighter.tuning, ARENA, FIXED_DT );
    }
    for ( const key of Object.keys( emptyShip() ) as ( keyof typeof plain )[] ) {
        assert.ok( Object.is( player[ key ], plain[ key ] ), key );
    }
} );

test( 'match state survives an encode / decode round trip', () => {
    const state = new MatchState();
    applyArenaDescriptor( state.arena, DEFAULT_ARENA );
    const p = new PlayerState();
    p.name = 'Nova';
    p.team = 1;
    p.classId = 'heavy';
    p.x = 12.5;
    p.lastProcessedInput = 42;
    state.players.set( 'a', p );

    const encoder = new Encoder( state );
    const decoded = new MatchState();
    const decoder = new Decoder( decoded );
    decoder.decode( encoder.encodeAll() );

    assert.deepEqual( toArenaDescriptor( decoded.arena ), DEFAULT_ARENA );
    const got = decoded.players.get( 'a' );
    assert.ok( got );
    assert.equal( got.name, 'Nova' );
    assert.equal( got.team, 1 );
    assert.equal( got.classId, 'heavy' );
    assert.equal( got.x, 12.5 );
    assert.equal( got.lastProcessedInput, 42 );
} );

test( 'an unknown class id falls back to the default class', () => {
    assert.equal( classOf( { classId: 'battleship' } ), 'fighter' );
    assert.equal( classOf( { classId: 'interceptor' } ), 'interceptor' );
} );
