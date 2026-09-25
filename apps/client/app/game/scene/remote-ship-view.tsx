import { useFrame } from '@react-three/fiber';
import type { Entity } from 'koota';
import { useTrait } from 'koota/react';
import { Suspense, useRef } from 'react';
import type * as THREE from 'three';
import { Pilot, RemotePose } from '../ecs/traits';
import { ShipModel } from './ship-model';
import { TeamMarker } from './team-marker';

export function RemoteShipView( { entity }: { entity: Entity } ) {
    const ref = useRef< THREE.Group >( null );
    const pilot = useTrait( entity, Pilot );

    useFrame( () => {
        const g = ref.current;
        const pose = entity.get( RemotePose );
        if ( ! g || ! pose ) return;
        g.visible = pose.ready;
        g.position.copy( pose.position );
        g.quaternion.copy( pose.quaternion );
    } );

    if ( ! pilot ) return null;

    return (
        <group ref={ ref } visible={ false }>
            <Suspense fallback={ null }>
                <ShipModel classId={ pilot.classId } />
            </Suspense>
            <TeamMarker team={ pilot.team } />
        </group>
    );
}
