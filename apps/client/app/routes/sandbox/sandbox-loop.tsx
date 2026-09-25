import { useFrame } from '@react-three/fiber';
import { type Arena, createFixedStep, FIXED_DT, idleInput, stepShip } from '@voidbrawl/shared';
import { useWorld } from 'koota/react';
import { useMemo } from 'react';
import type { PerspectiveCamera } from 'three';
import { updateFollowCamera } from '../../game/camera/follow-camera';
import { LocalPlayer, Pilot, Prev, Sim } from '../../game/ecs/traits';
import { readFlightInput } from '../../game/input/flight-input';
import { liveTuning } from '../../game/local-tuning';
import { capturePrev, writeViewPose } from '../../game/pose-from-sim';

const input = idleInput();

export function SandboxLoop( { arena }: { arena: Arena } ) {
    const world = useWorld();
    const advance = useMemo( () => createFixedStep( FIXED_DT ), [] );

    useFrame( ( state, delta ) => {
        const entity = world.queryFirst( LocalPlayer, Sim, Prev, Pilot );
        if ( ! entity ) return;
        const sim = entity.get( Sim );
        const prev = entity.get( Prev );
        const pilot = entity.get( Pilot );
        if ( ! sim || ! prev || ! pilot ) return;
        const tuning = liveTuning( pilot.classId );
        const alpha = advance( delta, ( dt ) => {
            readFlightInput( tuning, dt, input );
            capturePrev( sim, prev );
            stepShip( sim, input, tuning, arena, dt );
        } );
        writeViewPose( prev, sim, alpha, tuning, arena, delta );
        updateFollowCamera( state.camera as PerspectiveCamera, delta, arena.radius );
    }, -2 );

    return null;
}
