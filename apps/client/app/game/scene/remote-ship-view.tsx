import { useFrame } from '@react-three/fiber';
import type { Entity } from 'koota';
import { useTrait } from 'koota/react';
import { Suspense, useRef } from 'react';
import type * as THREE from 'three';
import { Pilot, RemotePose, Vital } from '../ecs/traits';
import { TEAM_COLORS } from '../team-colors';
import { ShipModel } from './ship-model';

export function RemoteShipView( { entity }: { entity: Entity } ) {
    const ref = useRef< THREE.Group >( null );
    const pilot = useTrait( entity, Pilot );

    useFrame( () => {
        const g = ref.current;
        const pose = entity.get( RemotePose );
        if ( ! g || ! pose ) return;
        g.visible = pose.ready && entity.get( Vital )?.dead !== true;
        g.position.copy( pose.position );
        g.quaternion.copy( pose.quaternion );
    } );

    if ( ! pilot ) return null;

    return (
        <group ref={ ref } visible={ false }>
            <Suspense fallback={ null }>
                <ShipModel classId={ pilot.classId } glow={ TEAM_COLORS[ pilot.team ] } />
            </Suspense>
        </group>
    );
}
