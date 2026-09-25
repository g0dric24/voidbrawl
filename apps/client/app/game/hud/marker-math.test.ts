import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { clampToEdge, toScreen } from './marker-math';

function camera() {
    const c = new THREE.PerspectiveCamera( 70, 16 / 9, 0.3, 4000 );
    c.position.set( 0, 0, 0 );
    c.lookAt( 0, 0, -1 );
    c.updateMatrixWorld();
    return c;
}

const out = { x: 0, y: 0, onScreen: false, angle: 0 };

describe( 'marker maths', () => {
    it( 'a ship straight ahead lands in the screen centre', () => {
        toScreen( new THREE.Vector3( 0, 0, -100 ), camera(), 1600, 900, 40, out );
        expect( out.onScreen ).toBe( true );
        expect( out.x ).toBeCloseTo( 800 );
        expect( out.y ).toBeCloseTo( 450 );
    } );

    it( 'a ship behind and to the right is pinned to the right edge, never shown as if in front', () => {
        toScreen( new THREE.Vector3( 30, 0, 100 ), camera(), 1600, 900, 40, out );
        expect( out.onScreen ).toBe( false );
        expect( out.x ).toBeCloseTo( 1560 );
    } );

    it( 'edge clamping keeps the arrow inside the margin and points outward', () => {
        clampToEdge( 3, 0, 1600, 900, 40, out );
        expect( out.x ).toBeCloseTo( 1560 );
        expect( out.y ).toBeCloseTo( 450 );
        expect( out.angle ).toBeCloseTo( 0 );
    } );
} );
