import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FIXED_DT } from '../sim/fixed-step.js';
import { SHIP_CLASSES, SHIP_ORDER } from '../sim/ship-classes.js';
import { emptyShip } from '../sim/ship-state.js';
import type { BoltTarget } from './bolt.js';
import { acquireTarget, launchSeeker, steerSeeker } from './seeker.js';
import { type LockState, SEEKER, stepLock } from './utilities.js';

function target( id: string, team: 0 | 1, x: number, y: number, z: number ): BoltTarget {
    return { id, team, x, y, z, radius: 6 };
}

function lock(): LockState {
    return { lockId: '', lockProgress: 0 };
}

test( 'the Fighter carries 3 of each utility and every other class 2', () => {
    for ( const id of SHIP_ORDER ) {
        const want = id === 'fighter' ? 3 : 2;
        assert.equal( SHIP_CLASSES[ id ].seekers, want );
        assert.equal( SHIP_CLASSES[ id ].mines, want );
    }
} );

test( 'a seeker alone cannot kill a ship at full health', () => {
    for ( const id of SHIP_ORDER ) {
        const ship = SHIP_CLASSES[ id ];
        assert.ok( SEEKER.damage < ship.hull + ship.shield );
    }
} );

test( 'a lock fills over the lock time on one target', () => {
    const s = lock();
    const ticks = Math.round( SEEKER.lockTime / FIXED_DT );
    for ( let i = 0; i < ticks - 1; i++ ) stepLock( s, 'a', FIXED_DT );
    assert.ok( s.lockProgress < 1 );
    stepLock( s, 'a', FIXED_DT );
    assert.equal( s.lockProgress, 1 );
} );

test( 'a lock starts over when the target changes, and drops when there is none', () => {
    const s = lock();
    for ( let i = 0; i < 20; i++ ) stepLock( s, 'a', FIXED_DT );
    stepLock( s, 'b', FIXED_DT );
    assert.equal( s.lockId, 'b' );
    assert.ok( s.lockProgress < 0.1 );
    stepLock( s, '', FIXED_DT );
    assert.deepEqual( s, lock() );
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
    steerSeeker( m, { x: 200, y: 0, z: 0 }, FIXED_DT );
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
