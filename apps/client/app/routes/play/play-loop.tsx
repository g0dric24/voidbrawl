import { useFrame } from '@react-three/fiber';
import { type Arena, createFixedStep, FIXED_DT, idleInput, SHIP_CLASSES, stepShip } from '@voidbrawl/shared';
import { useWorld } from 'koota/react';
import { useMemo } from 'react';
import type { PerspectiveCamera } from 'three';
import { updateFollowCamera } from '../../game/camera/follow-camera';
import { LocalPlayer, Pilot, Prev, Sim } from '../../game/ecs/traits';
import { readFlightInput } from '../../game/input/flight-input';
import { capturePrev, writeViewPose } from '../../game/pose-from-sim';
import { remoteInterpSystem } from '../../game/remote-interp';
import type { Predictor } from '../../net/prediction';

const input = idleInput();

export function PlayLoop( { arena, predictor }: { arena: Arena; predictor: Predictor } ) {
    const world = useWorld();
    const advance = useMemo( () => createFixedStep( FIXED_DT ), [] );

    useFrame( ( state, delta ) => {
        remoteInterpSystem( world, performance.now() );
        const entity = world.queryFirst( LocalPlayer, Sim, Prev, Pilot );
        const sim = entity?.get( Sim );
        const prev = entity?.get( Prev );
        const pilot = entity?.get( Pilot );
        if ( ! sim || ! prev || ! pilot ) return;
        const tuning = SHIP_CLASSES[ pilot.classId ].tuning;
        const alpha = advance( delta, ( dt ) => {
            readFlightInput( tuning, dt, input );
            const net = { ...input, seq: predictor.nextSeq() };
            predictor.record( net );
            capturePrev( sim, prev );
            stepShip( sim, net, tuning, arena, dt );
        } );
        writeViewPose( prev, sim, alpha, tuning, arena, delta );
        updateFollowCamera( state.camera as PerspectiveCamera, delta, arena.radius );
    }, -2 );

    return null;
}
