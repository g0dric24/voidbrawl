import type { Asteroid } from '@voidbrawl/shared';
import * as THREE from 'three';
import { asteroidGeometry } from './asteroid-geometry';

export const ROCK_VARIANTS = 6;
const ROCK_DETAIL = 8;
const VISUAL_TO_COLLIDER = 0.95;
const SPIN_FLOOR = 0.02;
const SPIN_RANGE = 0.08;

function hash( n: number ): number {
    let h = Math.imul( n ^ 0x5bd1e995, 0x27d4eb2d );
    h ^= h >>> 15;
    h = Math.imul( h, 0x85ebca6b );
    h ^= h >>> 13;
    return ( h >>> 0 ) / 0x1_0000_0000;
}

const _o = new THREE.Object3D();

export function buildAsteroidMeshes( rocks: readonly Asteroid[], material: THREE.Material ): THREE.InstancedMesh[] {
    const meshes: THREE.InstancedMesh[] = [];
    for ( let v = 0; v < ROCK_VARIANTS; v++ ) {
        const members = rocks.filter( ( r ) => r.id % ROCK_VARIANTS === v );
        const geometry = asteroidGeometry( v * 104_729 + 17, ROCK_DETAIL );
        const spin = new Float32Array( members.length * 4 );
        const mesh = new THREE.InstancedMesh( geometry, material, members.length );
        members.forEach( ( r, i ) => {
            _o.position.set( r.x, r.y, r.z );
            _o.rotation.set( hash( r.id * 3 ) * 6.283, hash( r.id * 3 + 1 ) * 6.283, hash( r.id * 3 + 2 ) * 6.283 );
            _o.scale.setScalar( r.r / VISUAL_TO_COLLIDER );
            _o.updateMatrix();
            mesh.setMatrixAt( i, _o.matrix );
            const ax = hash( r.id * 7 ) * 2 - 1;
            const ay = hash( r.id * 7 + 1 ) * 2 - 1;
            const az = hash( r.id * 7 + 2 ) * 2 - 1;
            const len = Math.hypot( ax, ay, az ) || 1;
            spin[ i * 4 ] = ax / len;
            spin[ i * 4 + 1 ] = ay / len;
            spin[ i * 4 + 2 ] = az / len;
            spin[ i * 4 + 3 ] = ( SPIN_FLOOR + SPIN_RANGE * hash( r.id * 7 + 3 ) ) * ( hash( r.id ) > 0.5 ? 1 : -1 );
        } );
        geometry.setAttribute( 'aRockSpin', new THREE.InstancedBufferAttribute( spin, 4 ) );
        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingSphere();
        meshes.push( mesh );
    }
    return meshes;
}
