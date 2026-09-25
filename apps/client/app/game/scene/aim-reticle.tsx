import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type * as THREE from 'three';
import { num } from '../../dev/tuning';
import { MARIGOLD } from '../team-colors';
import { viewPose } from '../view-pose';

const SCREEN_SIZE = 0.018;

export function AimReticle() {
    const ref = useRef< THREE.Group >( null );

    useFrame( ( state ) => {
        const g = ref.current;
        if ( ! g ) return;
        g.position.copy( viewPose.position ).addScaledVector( viewPose.forward, num( 'Reticle.distance' ) );
        g.quaternion.copy( state.camera.quaternion );
        g.scale.setScalar( g.position.distanceTo( state.camera.position ) * SCREEN_SIZE );
    } );

    return (
        <group ref={ ref }>
            <mesh renderOrder={ 10 }>
                <ringGeometry args={ [ 0.8, 1, 48 ] } />
                <meshBasicMaterial color={ MARIGOLD } depthTest={ false } transparent opacity={ 0.9 } />
            </mesh>
            <mesh renderOrder={ 10 }>
                <circleGeometry args={ [ 0.12, 16 ] } />
                <meshBasicMaterial color={ MARIGOLD } depthTest={ false } transparent />
            </mesh>
        </group>
    );
}
