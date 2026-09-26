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
import { cameraScale, updateFollowCamera } from '../../game/camera/follow-camera';
import { LocalPlayer, Pilot, Prev, Sim, Vital } from '../../game/ecs/traits';
import { stepParticles } from '../../game/fx/fx-store';
import { readFlightInput } from '../../game/input/flight-input';
import { addTracer, stepTracers } from '../../game/local-tracers';
import { capturePrev, writeViewPose } from '../../game/pose-from-sim';
import { remoteInterpSystem } from '../../game/remote-interp';
import { TEAM_COLORS } from '../../game/team-colors';
import { isFrozen, isLive } from '../../net/match-store';
import type { Predictor } from '../../net/prediction';

const input = idleInput();

export function PlayLoop( { arena, predictor }: { arena: Arena; predictor: Predictor } ) {
    const world = useWorld();
    const advance = useMemo( () => createFixedStep( FIXED_DT ), [] );

    useFrame( ( state, delta ) => {
        remoteInterpSystem( world, performance.now() );
        stepParticles( delta );
        stepTracers( arena, delta );
        const entity = world.queryFirst( LocalPlayer, Sim, Prev, Pilot );
        const sim = entity?.get( Sim );
        const prev = entity?.get( Prev );
        const pilot = entity?.get( Pilot );
        if ( ! sim || ! prev || ! pilot ) return;
        const ship = SHIP_CLASSES[ pilot.classId ];
        const held = entity?.get( Vital )?.dead === true || isFrozen();
        let alpha = 1;
        if ( held ) {
            advance( delta, () => {} );
            capturePrev( sim, prev );
        } else {
            alpha = advance( delta, ( dt ) => {
                readFlightInput( ship.tuning, dt, input );
                input.fire = input.fire && isLive();
                const net = { ...input, seq: predictor.nextSeq() };
                predictor.record( net );
                capturePrev( sim, prev );
                stepPilot( sim, net, ship, arena, dt );
                if ( ! sim.shot ) return;
                const launch = launchBolt( sim, ship.tuning.hullRadius, ship.gun, 'local', pilot.team, 0 );
                addTracer( launch, ship.gun.boltLife, TEAM_COLORS[ pilot.team ] );
            } );
        }
        writeViewPose( prev, sim, alpha, ship.tuning, arena, delta );
        updateFollowCamera( state.camera as PerspectiveCamera, delta, arena.radius, cameraScale( ship.hitRadius ) );
    }, -2 );

    return null;
}
