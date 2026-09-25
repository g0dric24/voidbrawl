import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { num } from '../../dev/tuning';

const MAX_POINTS = 120;

const _side = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _toCam = new THREE.Vector3();
const _tail = new THREE.Vector3();

export interface TrailSource {
    ship: THREE.Object3D | null;
    visible: boolean;
}

function buildGeometry(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( MAX_POINTS * 2 * 3 ), 3 ) );
    g.setAttribute( 'color', new THREE.BufferAttribute( new Float32Array( MAX_POINTS * 2 * 3 ), 3 ) );
    const index: number[] = [];
    for ( let i = 0; i < MAX_POINTS - 1; i++ ) {
        const a = i * 2;
        index.push( a, a + 1, a + 2, a + 1, a + 3, a + 2 );
    }
    g.setIndex( index );
    return g;
}

export function EngineTrail( { source, color, tail }: { source: TrailSource; color: string; tail: number } ) {
    const geometry = useMemo( buildGeometry, [] );
    const material = useMemo(
        () =>
            new THREE.MeshBasicMaterial( {
                vertexColors: true,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
            } ),
        [],
    );
    const history = useMemo( () => [] as THREE.Vector3[], [] );
    const tint = useMemo( () => new THREE.Color( color ), [ color ] );

    // JUSTIFIED EFFECT — brackets GPU geometry and material we built ourselves, which R3F does not own.
    useEffect(
        () => () => {
            geometry.dispose();
            material.dispose();
        },
        [ geometry, material ],
    );

    useFrame( ( state ) => {
        const ship = source.ship;
        const length = Math.min( MAX_POINTS, num( 'Trail.length' ) );
        if ( ! ship || ! source.visible ) {
            history.length = 0;
            geometry.setDrawRange( 0, 0 );
            return;
        }
        _tail.set( 0, 0, -tail ).applyQuaternion( ship.quaternion ).add( ship.position );
        history.unshift( _tail.clone() );
        if ( history.length > length ) history.length = length;
        const pos = geometry.getAttribute( 'position' ) as THREE.BufferAttribute;
        const col = geometry.getAttribute( 'color' ) as THREE.BufferAttribute;
        const width = num( 'Trail.width' );
        const glow = num( 'Trail.glow' );
        for ( let i = 0; i < history.length; i++ ) {
            const p = history[ i ];
            const next = history[ Math.min( i + 1, history.length - 1 ) ];
            const prev = history[ Math.max( i - 1, 0 ) ];
            _dir.subVectors( prev, next );
            _toCam.subVectors( state.camera.position, p );
            _side.crossVectors( _dir, _toCam ).normalize();
            const fade = 1 - i / history.length;
            _side.multiplyScalar( width * fade );
            pos.setXYZ( i * 2, p.x + _side.x, p.y + _side.y, p.z + _side.z );
            pos.setXYZ( i * 2 + 1, p.x - _side.x, p.y - _side.y, p.z - _side.z );
            const k = glow * fade * fade;
            col.setXYZ( i * 2, tint.r * k, tint.g * k, tint.b * k );
            col.setXYZ( i * 2 + 1, tint.r * k, tint.g * k, tint.b * k );
        }
        pos.needsUpdate = true;
        col.needsUpdate = true;
        geometry.setDrawRange( 0, Math.max( 0, history.length - 1 ) * 6 );
        geometry.computeBoundingSphere();
    } );

    return <mesh geometry={ geometry } material={ material } frustumCulled={ false } />;
}
