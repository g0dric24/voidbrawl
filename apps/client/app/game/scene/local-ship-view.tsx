import { useFrame } from '@react-three/fiber';
import { useQueryFirst, useTrait } from 'koota/react';
import { Suspense, useRef } from 'react';
import type * as THREE from 'three';
import { LocalPlayer, Pilot } from '../ecs/traits';
import { TEAM_COLORS } from '../team-colors';
import { viewPose } from '../view-pose';
import { ShipModel } from './ship-model';

export function LocalShipView() {
    const ref = useRef< THREE.Group >( null );
    const entity = useQueryFirst( LocalPlayer, Pilot );
    const pilot = useTrait( entity, Pilot );

    useFrame( () => {
        const g = ref.current;
        if ( ! g ) return;
        g.position.copy( viewPose.position );
        g.quaternion.copy( viewPose.quaternion );
    } );

    return (
        <group ref={ ref }>
            <Suspense fallback={ null }>
                { pilot ? <ShipModel classId={ pilot.classId } glow={ TEAM_COLORS[ pilot.team ] } /> : null }
            </Suspense>
        </group>
    );
}
