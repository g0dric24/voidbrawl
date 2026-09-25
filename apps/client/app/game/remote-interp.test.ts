import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { samplePose } from './remote-interp';

function snap( t: number, x: number, turn: number ) {
    const q = new THREE.Quaternion().setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), turn );
    return { t, x, y: 0, z: 0, qx: q.x, qy: q.y, qz: q.z, qw: q.w };
}

function pose() {
    return { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() };
}

describe( 'samplePose', () => {
    const buffer = [ snap( 0, 0, 0 ), snap( 50, 10, 0 ), snap( 100, 20, Math.PI / 2 ) ];

    it( 'interpolates position and rotation between the two straddling snapshots', () => {
        const p = pose();
        expect( samplePose( buffer, 75, p ) ).toBe( true );
        expect( p.position.x ).toBeCloseTo( 15 );
        const angle = 2 * Math.acos( p.quaternion.w );
        expect( angle ).toBeCloseTo( Math.PI / 4 );
    } );

    it( 'holds the newest snapshot instead of extrapolating past it', () => {
        const p = pose();
        samplePose( buffer, 400, p );
        expect( p.position.x ).toBe( 20 );
    } );

    it( 'holds the oldest snapshot before the buffer starts', () => {
        const p = pose();
        samplePose( buffer, -30, p );
        expect( p.position.x ).toBe( 0 );
    } );

    it( 'reports nothing to draw for an empty buffer', () => {
        expect( samplePose( [], 10, pose() ) ).toBe( false );
    } );
} );
