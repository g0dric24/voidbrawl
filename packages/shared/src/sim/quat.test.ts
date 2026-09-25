import assert from 'node:assert/strict';
import { test } from 'node:test';
import { forwardOf, type Orientation, rightOf, rotateBody, upOf, vec3 } from './quat.js';

function identity(): Orientation {
    return { qx: 0, qy: 0, qz: 0, qw: 1 };
}

function length( o: Orientation ): number {
    return Math.sqrt( o.qx * o.qx + o.qy * o.qy + o.qz * o.qz + o.qw * o.qw );
}

test( 'identity axes: forward +z, up +y, right -x', () => {
    const o = identity();
    assert.deepEqual( forwardOf( o, vec3() ), { x: 0, y: 0, z: 1 } );
    assert.deepEqual( upOf( o, vec3() ), { x: 0, y: 1, z: 0 } );
    assert.deepEqual( rightOf( o, vec3() ), { x: -1, y: 0, z: 0 } );
} );

test( 'rotateBody keeps the quaternion unit length over many steps', () => {
    const o = identity();
    for ( let i = 0; i < 10_000; i++ ) rotateBody( o, 0.013, -0.021, 0.034 );
    assert.ok( Math.abs( length( o ) - 1 ) < 1e-12 );
} );

test( 'rotation is in the body frame: after a roll, a yaw turns around the rolled up axis', () => {
    const o = identity();
    for ( let i = 0; i < 90; i++ ) rotateBody( o, 0, 0, Math.PI / 180 );
    const up = upOf( o, vec3() );
    for ( let i = 0; i < 30; i++ ) rotateBody( o, 0, -Math.PI / 180, 0 );
    const f = forwardOf( o, vec3() );
    assert.ok( Math.abs( f.x * up.x + f.y * up.y + f.z * up.z ) < 1e-9 );
    assert.ok( Math.abs( f.y ) > 0.45 );
} );
