import type { Arena } from '@voidbrawl/shared';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

const PILLAR_COLOR = '#3b4148';
const SEAM_COLOR = '#c9d4df';
const SEAM_GLOW = 2.2;
const SEAM_WIDTH = 0.6;

const _o = new THREE.Object3D();

function buildPillars( arena: Arena ): { body: THREE.InstancedMesh; seams: THREE.InstancedMesh } {
    const count = arena.pillars.length;
    const body = new THREE.InstancedMesh(
        new THREE.BoxGeometry( 1, 1, 1 ),
        new THREE.MeshStandardMaterial( { color: PILLAR_COLOR, metalness: 0.85, roughness: 0.4 } ),
        count,
    );
    const seams = new THREE.InstancedMesh(
        new THREE.BoxGeometry( 1, 1, 1 ),
        new THREE.MeshBasicMaterial( { color: new THREE.Color( SEAM_COLOR ).multiplyScalar( SEAM_GLOW ) } ),
        count * 2,
    );
    arena.pillars.forEach( ( b, i ) => {
        const w = b.x1 - b.x0;
        const h = b.y1 - b.y0;
        const d = b.z1 - b.z0;
        const cx = ( b.x0 + b.x1 ) / 2;
        const cz = ( b.z0 + b.z1 ) / 2;
        _o.position.set( cx, ( b.y0 + b.y1 ) / 2, cz );
        _o.scale.set( w, h, d );
        _o.updateMatrix();
        body.setMatrixAt( i, _o.matrix );
        const out = new THREE.Vector3( cx, 0, cz ).normalize();
        for ( const [ k, side ] of [ 1, -1 ].entries() ) {
            _o.position.set( cx - out.x * ( w / 2 ) * 1.01, ( b.y0 + b.y1 ) / 2, cz - out.z * ( d / 2 ) * 1.01 );
            _o.position.addScaledVector( new THREE.Vector3( -out.z, 0, out.x ), side * w * 0.3 );
            _o.scale.set( SEAM_WIDTH, h * 0.92, SEAM_WIDTH );
            _o.updateMatrix();
            seams.setMatrixAt( i * 2 + k, _o.matrix );
        }
    } );
    body.instanceMatrix.needsUpdate = true;
    seams.instanceMatrix.needsUpdate = true;
    return { body, seams };
}

export function PillarRing( { arena }: { arena: Arena } ) {
    const { body, seams } = useMemo( () => buildPillars( arena ), [ arena ] );

    // JUSTIFIED EFFECT — brackets GPU geometry and materials we built ourselves, which R3F does not own.
    useEffect(
        () => () => {
            for ( const m of [ body, seams ] ) {
                m.geometry.dispose();
                ( m.material as THREE.Material ).dispose();
                m.dispose();
            }
        },
        [ body, seams ],
    );

    return (
        <group>
            <primitive object={ body } />
            <primitive object={ seams } />
        </group>
    );
}
