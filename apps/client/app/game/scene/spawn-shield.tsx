import { useFrame } from '@react-three/fiber';
import type { Entity } from 'koota';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Vital } from '../ecs/traits';

const OPACITY = 0.22;
const PULSE = 8;

export function SpawnShield( {
    entity,
    radius,
    color,
}: {
    entity: Entity | undefined;
    radius: number;
    color: string;
} ) {
    const mesh = useMemo( () => {
        const material = new THREE.MeshBasicMaterial( {
            color: new THREE.Color( color ),
            transparent: true,
            opacity: OPACITY,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        } );
        const m = new THREE.Mesh( new THREE.IcosahedronGeometry( 1, 3 ), material );
        m.visible = false;
        return m;
    }, [ color ] );

    // JUSTIFIED EFFECT — releases the shield bubble's GPU geometry and material, which R3F does not own.
    useEffect(
        () => () => {
            mesh.geometry.dispose();
            ( mesh.material as THREE.Material ).dispose();
        },
        [ mesh ],
    );

    useFrame( ( state ) => {
        const protect = entity?.get( Vital )?.protect ?? 0;
        mesh.visible = protect > 0;
        if ( ! mesh.visible ) return;
        mesh.scale.setScalar( radius );
        const fade = Math.min( 1, protect * 2 ) * ( 0.8 + 0.2 * Math.sin( state.clock.elapsedTime * PULSE ) );
        ( mesh.material as THREE.MeshBasicMaterial ).opacity = OPACITY * fade;
    } );

    return <primitive object={ mesh } />;
}
