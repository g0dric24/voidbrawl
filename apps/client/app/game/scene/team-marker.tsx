import { useFrame } from '@react-three/fiber';
import type { TeamId } from '@voidbrawl/shared';
import { useRef } from 'react';
import type * as THREE from 'three';
import { TEAM_COLORS } from '../team-colors';

const SCREEN_SIZE = 0.012;
const MIN_SCALE = 3;

export function TeamMarker( { team }: { team: TeamId } ) {
    const ref = useRef< THREE.Mesh >( null );

    useFrame( ( state ) => {
        const m = ref.current;
        const ship = m?.parent;
        if ( ! m || ! ship ) return;
        m.quaternion.copy( ship.quaternion ).invert().multiply( state.camera.quaternion );
        m.scale.setScalar( Math.max( MIN_SCALE, state.camera.position.distanceTo( ship.position ) * SCREEN_SIZE ) );
    } );

    return (
        <mesh ref={ ref } renderOrder={ 5 }>
            <ringGeometry args={ [ 0.85, 1, 40 ] } />
            <meshBasicMaterial color={ TEAM_COLORS[ team ] } transparent opacity={ 0.85 } depthWrite={ false } />
        </mesh>
    );
}
