import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { NebulaBaker } from './nebula-baker';

export function NebulaSky( { radius }: { radius: number } ) {
    const baker = useMemo( () => new NebulaBaker( radius ), [ radius ] );

    // JUSTIFIED EFFECT — releases GPU render targets the baker allocates; a remount re-bakes them.
    useEffect( () => () => baker.dispose(), [ baker ] );

    useFrame( ( state ) => baker.update( state.gl, state.clock.elapsedTime ), -1 );

    return <primitive object={ baker.background } />;
}
