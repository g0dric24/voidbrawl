import assert from 'node:assert/strict';
import { test } from 'node:test';
import { forwardOf, vec3 } from '../sim/quat.js';
import { SHIP_CLASSES } from '../sim/ship-classes.js';
import { spawnShip } from '../sim/ship-state.js';
import {
    ASTEROID_COUNT,
    ASTEROID_GAP,
    BASE_CLEARANCE,
    CENTER_CLEAR,
    DEFAULT_ARENA,
    materializeArena,
} from './arena.js';

test( 'the same descriptor materializes the same arena', () => {
    assert.deepEqual( materializeArena( DEFAULT_ARENA ), materializeArena( DEFAULT_ARENA ) );
} );

test( 'a different seed gives a different field', () => {
    const a = materializeArena( DEFAULT_ARENA );
    const b = materializeArena( { ...DEFAULT_ARENA, seed: DEFAULT_ARENA.seed + 1 } );
    assert.notDeepEqual( a.asteroids, b.asteroids );
} );

test( 'the field is filled, inside the arena, and leaves the centre open for fighting', () => {
    const arena = materializeArena( DEFAULT_ARENA );
    assert.equal( arena.asteroids.length, ASTEROID_COUNT );
    for ( const a of arena.asteroids ) {
        const d = Math.sqrt( a.x * a.x + a.y * a.y + a.z * a.z );
        assert.ok( d + a.r <= arena.radius );
        assert.ok( d - a.r >= CENTER_CLEAR );
    }
} );

test( 'the widest ship fits through every gap between rocks', () => {
    const widest = Math.max( ...Object.values( SHIP_CLASSES ).map( ( c ) => c.tuning.hullRadius ) );
    assert.ok( ASTEROID_GAP > 2 * widest );
} );

test( 'every hit sphere covers its ship', () => {
    for ( const c of Object.values( SHIP_CLASSES ) ) assert.ok( c.hitRadius > c.tuning.hullRadius );
} );

test( 'asteroids never overlap and keep a flyable gap', () => {
    const rocks = materializeArena( DEFAULT_ARENA ).asteroids;
    for ( let i = 0; i < rocks.length; i++ ) {
        for ( let j = i + 1; j < rocks.length; j++ ) {
            const a = rocks[ i ];
            const b = rocks[ j ];
            const d = Math.sqrt( ( a.x - b.x ) ** 2 + ( a.y - b.y ) ** 2 + ( a.z - b.z ) ** 2 );
            assert.ok( d >= a.r + b.r + ASTEROID_GAP - 1e-9 );
        }
    }
} );

test( 'bases are clear of rocks and every spawn clears the largest hull', () => {
    const arena = materializeArena( DEFAULT_ARENA );
    const hull = Math.max( ...Object.values( SHIP_CLASSES ).map( ( c ) => c.tuning.hullRadius ) );
    for ( const base of arena.bases ) {
        for ( const a of arena.asteroids ) {
            const d = Math.sqrt(
                ( a.x - base.center.x ) ** 2 + ( a.y - base.center.y ) ** 2 + ( a.z - base.center.z ) ** 2,
            );
            assert.ok( d >= BASE_CLEARANCE + a.r );
        }
        for ( const p of base.spawns ) {
            assert.ok( Math.sqrt( p.x * p.x + p.y * p.y + p.z * p.z ) + hull < arena.radius );
        }
    }
} );

test( 'each team spawns facing the arena centre', () => {
    const arena = materializeArena( DEFAULT_ARENA );
    for ( const team of [ 0, 1 ] as const ) {
        const s = spawnShip( arena, team, 0 );
        assert.equal( Math.sign( forwardOf( s, vec3() ).z ), -Math.sign( s.z ) );
    }
} );
