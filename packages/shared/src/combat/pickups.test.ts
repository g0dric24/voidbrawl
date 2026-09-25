import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BASE_CLEARANCE, DEFAULT_ARENA, materializeArena, PAD_CLEAR, PAD_PAIRS } from '../arena/arena.js';
import { FIXED_DT } from '../sim/fixed-step.js';
import { emptyShip } from '../sim/ship-state.js';
import type { BoltTarget } from './bolt.js';
import { isPickupKind, PICKUP, rollPickup, SEEKER } from './pickups.js';
import { acquireTarget, launchSeeker, steerSeeker } from './seeker.js';

const ARENA = materializeArena( DEFAULT_ARENA );

function target( id: string, team: 0 | 1, x: number, y: number, z: number ): BoltTarget {
    return { id, team, x, y, z, radius: 6 };
}

test( 'every roll lands on a real pickup and every kind can come up', () => {
    const seen = new Set< number >();
    for ( let r = 0; r < 1; r += 0.01 ) {
        const kind = rollPickup( r );
        assert.ok( isPickupKind( kind ) );
        seen.add( kind );
    }
    assert.equal( seen.size, 5 );
} );

test( 'pads come in mirrored pairs, clear of rocks and bases', () => {
    assert.equal( ARENA.pads.length, PAD_PAIRS * 2 );
    for ( let i = 0; i < ARENA.pads.length; i += 2 ) {
        const a = ARENA.pads[ i ];
        const b = ARENA.pads[ i + 1 ];
        assert.deepEqual( { x: b.x, y: b.y, z: b.z }, { x: a.x, y: a.y, z: -a.z } );
    }
    for ( const p of ARENA.pads ) {
        for ( const r of ARENA.asteroids ) {
            const d = Math.hypot( p.x - r.x, p.y - r.y, p.z - r.z );
            assert.ok( d >= r.r + PAD_CLEAR );
        }
        for ( const base of ARENA.bases ) {
            assert.ok( Math.hypot( p.x - base.center.x, p.y - base.center.y, p.z - base.center.z ) >= BASE_CLEARANCE );
        }
    }
} );

test( 'the same descriptor places the same pads', () => {
    assert.deepEqual( materializeArena( DEFAULT_ARENA ).pads, ARENA.pads );
} );

test( 'a seeker locks the nearest enemy inside its cone and range only', () => {
    const me = emptyShip();
    const targets = [
        target( 'mate', 0, 0, 0, 50 ),
        target( 'far', 1, 0, 0, SEEKER.range + 20 ),
        target( 'wide', 1, 60, 0, 60 ),
        target( 'near', 1, 5, 0, 120 ),
        target( 'nearer', 1, 0, 3, 90 ),
    ];
    assert.equal( acquireTarget( me, 0, targets ), 'nearer' );
    assert.equal( acquireTarget( me, 0, [ targets[ 1 ], targets[ 2 ] ] ), '' );
} );

test( 'a seeker turns toward its target no faster than its turn rate', () => {
    const m = launchSeeker( emptyShip(), 4 );
    const side = { x: 200, y: 0, z: 0 };
    steerSeeker( m, side, FIXED_DT );
    const speed = Math.hypot( m.vx, m.vy, m.vz );
    const turned = Math.acos( m.vz / speed );
    assert.ok( Math.abs( turned - SEEKER.turnRate * FIXED_DT ) < 1e-6 );
    assert.ok( Math.abs( speed - SEEKER.speed ) < 1e-6 );
} );

test( 'a seeker with no target flies straight', () => {
    const m = launchSeeker( emptyShip(), 4 );
    for ( let i = 0; i < 30; i++ ) steerSeeker( m, null, FIXED_DT );
    assert.equal( m.x, 0 );
    assert.ok( m.z > 80 );
} );

test( 'the empty slot value is not a pickup', () => {
    assert.equal( isPickupKind( PICKUP.none ), false );
} );
