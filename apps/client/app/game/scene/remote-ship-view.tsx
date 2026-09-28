import { useFrame } from '@react-three/fiber';
import { SHIP_CLASSES } from '@voidbrawl/shared';
import type { Entity } from 'koota';
import { useTrait } from 'koota/react';
import { Fragment, Suspense, useMemo, useRef } from 'react';
import type * as THREE from 'three';
import { Pilot, RemotePose, Vital } from '../ecs/traits';
import { TEAM_COLORS } from '../team-colors';
import { EngineTrail, type TrailSource } from './engine-trail';
import { ShipModel } from './ship-model';
import { SHIP_VISUALS } from './ship-visuals';
import { SpawnShield } from './spawn-shield';
import { WingBeacons } from './wing-beacons';

const WING_SPAN = 0.95;

export function RemoteShipView( { entity }: { entity: Entity } ) {
    const ref = useRef< THREE.Group >( null );
    const pilot = useTrait( entity, Pilot );
    const trail = useMemo< TrailSource >( () => ( { ship: null, visible: false } ), [] );

    useFrame( () => {
        const g = ref.current;
        const pose = entity.get( RemotePose );
        if ( ! g || ! pose ) return;
        g.visible = pose.ready && entity.get( Vital )?.dead !== true;
        g.position.copy( pose.position );
        g.quaternion.copy( pose.quaternion );
        trail.ship = g;
        trail.visible = g.visible;
    } );

    if ( ! pilot ) return null;
    const color = TEAM_COLORS[ pilot.team ];

    return (
        <Fragment>
            <group ref={ ref } visible={ false }>
                <Suspense fallback={ null }>
                    <ShipModel classId={ pilot.classId } glow={ color } />
                </Suspense>
                <WingBeacons span={ SHIP_CLASSES[ pilot.classId ].tuning.hullRadius * WING_SPAN } color={ color } />
                <SpawnShield entity={ entity } radius={ SHIP_CLASSES[ pilot.classId ].hitRadius } color={ color } />
            </group>
            <EngineTrail source={ trail } color={ color } tail={ SHIP_VISUALS[ pilot.classId ].tail } />
        </Fragment>
    );
}
