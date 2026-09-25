import assert from 'node:assert/strict';
import { test } from 'node:test';
import { interceptTime, leadPoint } from './lead.js';

test( 'a still target is hit at distance / speed', () => {
    assert.ok( Math.abs( interceptTime( 0, 0, 400, 0, 0, 0, 400 ) - 1 ) < 1e-9 );
} );

test( 'a bolt fired at the lead point meets a crossing target', () => {
    const shooter = { x: 0, y: 0, z: 0 };
    const target = { x: 0, y: 0, z: 300 };
    const vel = { x: 60, y: 0, z: 0 };
    const out = { x: 0, y: 0, z: 0 };
    assert.ok( leadPoint( shooter, target, vel, 420, out ) );
    const len = Math.hypot( out.x, out.y, out.z );
    const t = len / 420;
    assert.ok( Math.abs( target.x + vel.x * t - out.x ) < 1e-6 );
    assert.ok( out.x > 30 );
} );

test( 'a target faster than the bolt and running away cannot be led', () => {
    assert.equal(
        leadPoint( { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 100 }, { x: 0, y: 0, z: 500 }, 420, { x: 0, y: 0, z: 0 } ),
        false,
    );
} );
