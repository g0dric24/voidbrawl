import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { num } from '../../dev/tuning';
import { viewPose } from '../view-pose';
import { NEBULA_LIGHT } from './nebula-baker';

const KEY_DISTANCE = 50;

export function SceneLighting() {
    const key = useRef< THREE.DirectionalLight >( null );

    useFrame( ( state ) => {
        state.scene.environment = NEBULA_LIGHT.environment;
        state.scene.environmentIntensity = num( 'Environment.intensity' );
        state.scene.environmentRotation.y = THREE.MathUtils.degToRad( num( 'Environment.rotation' ) );
        const light = key.current;
        if ( ! light ) return;
        light.color.copy( NEBULA_LIGHT.color );
        light.intensity = num( 'Ship.keyLight' );
        light.target.position.copy( viewPose.position );
        light.position.copy( viewPose.position ).addScaledVector( NEBULA_LIGHT.direction, KEY_DISTANCE );
        light.target.updateMatrixWorld();
    } );

    return <directionalLight ref={ key } />;
}
