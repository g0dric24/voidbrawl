import { useFrame } from '@react-three/fiber';
import {
    type Arena,
    createFixedStep,
    FIXED_DT,
    idleInput,
    launchBolt,
    SHIP_CLASSES,
    stepPilot,
} from '@voidbrawl/shared';
import { useWorld } from 'koota/react';
import { useMemo } from 'react';
import type { PerspectiveCamera } from 'three';
import { updateFollowCamera } from '../../game/camera/follow-camera';
import { LocalPlayer, Pilot, Prev, Sim } from '../../game/ecs/traits';
import { stepParticles } from '../../game/fx/fx-store';
import { readFlightInput } from '../../game/input/flight-input';
import { addTracer, stepTracers } from '../../game/local-tracers';
import { liveTuning } from '../../game/local-tuning';
import { capturePrev, writeViewPose } from '../../game/pose-from-sim';
import { TEAM_COLORS } from '../../game/team-colors';

const input = idleInput();

export function SandboxLoop( { arena }: { arena: Arena } ) {
    const world = useWorld();
    const advance = useMemo( () => createFixedStep( FIXED_DT ), [] );

    useFrame( ( state, delta ) => {
        stepParticles( delta );
        stepTracers( arena, delta );
        const entity = world.queryFirst( LocalPlayer, Sim, Prev, Pilot );
        const sim = entity?.get( Sim );
        const prev = entity?.get( Prev );
        const pilot = entity?.get( Pilot );
        if ( ! sim || ! prev || ! pilot ) return;
        const ship = { ...SHIP_CLASSES[ pilot.classId ], tuning: liveTuning( pilot.classId ) };
        const alpha = advance( delta, ( dt ) => {
            readFlightInput( ship.tuning, dt, input );
            capturePrev( sim, prev );
            stepPilot( sim, input, ship, arena, dt );
            if ( ! sim.shot ) return;
            const launch = launchBolt( sim, ship.tuning.hullRadius, ship.gun, 'local', pilot.team, 0 );
            addTracer( launch, ship.gun.boltLife, TEAM_COLORS[ pilot.team ] );
        } );
        writeViewPose( prev, sim, alpha, ship.tuning, arena, delta );
        updateFollowCamera( state.camera as PerspectiveCamera, delta, arena.radius );
    }, -2 );

    return null;
}
