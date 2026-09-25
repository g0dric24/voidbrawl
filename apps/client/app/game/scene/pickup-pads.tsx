import { useFrame } from '@react-three/fiber';
import { type Arena, isPickupKind, PAD_RADIUS } from '@voidbrawl/shared';
import { Fragment, useMemo } from 'react';
import * as THREE from 'three';
import { session } from '../../net/session';
import { PICKUP_COLORS } from '../pickup-colors';
import { flushInstances, glowInstances } from './instanced';
import { useDisposeInstanced } from './use-dispose-instanced';

const CORE_GLOW = 3;
const HALO_COLOR = new THREE.Color( '#8fa3b8' ).multiplyScalar( 0.35 );
const SPIN = 1.4;
const BOB = 0.8;

const _o = new THREE.Object3D();
const _c = new THREE.Color();

function drawPads( core: THREE.InstancedMesh, halo: THREE.InstancedMesh, arena: Arena, t: number ): void {
    const pads = session.room?.state?.pads;
    let n = 0;
    arena.pads.forEach( ( p, i ) => {
        _o.position.set( p.x, p.y, p.z );
        _o.rotation.set( 0, 0, 0 );
        _o.scale.setScalar( 1 );
        _o.updateMatrix();
        halo.setMatrixAt( i, _o.matrix );
        halo.setColorAt( i, HALO_COLOR );
        const kind = pads?.at( i )?.kind;
        if ( ! isPickupKind( kind ) ) return;
        _o.position.y += Math.sin( t * BOB + i ) * 0.8;
        _o.rotation.set( t * SPIN * 0.6, t * SPIN + i, 0 );
        _o.updateMatrix();
        core.setMatrixAt( n, _o.matrix );
        core.setColorAt( n, _c.set( PICKUP_COLORS[ kind ] ).multiplyScalar( CORE_GLOW ) );
        n++;
    } );
    flushInstances( halo, arena.pads.length );
    flushInstances( core, n );
}

export function PickupPads( { arena }: { arena: Arena } ) {
    const meshes = useMemo(
        () => [
            glowInstances( new THREE.OctahedronGeometry( PAD_RADIUS * 0.6 ), arena.pads.length ),
            glowInstances(
                new THREE.IcosahedronGeometry( PAD_RADIUS * 1.4, 1 ),
                arena.pads.length,
                new THREE.MeshBasicMaterial( { wireframe: true, transparent: true, opacity: 0.5 } ),
            ),
        ],
        [ arena ],
    );
    useDisposeInstanced( meshes );
    const [ core, halo ] = meshes;

    useFrame( ( state ) => drawPads( core, halo, arena, state.clock.elapsedTime ) );

    return (
        <Fragment>
            <primitive object={ core } />
            <primitive object={ halo } />
        </Fragment>
    );
}
