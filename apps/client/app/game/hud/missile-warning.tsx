import { addEffect } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { session } from '../../net/session';

function lockedOn(): boolean {
    const room = session.room;
    if ( ! room?.state?.missiles ) return false;
    for ( const m of room.state.missiles.values() ) if ( m.targetId === room.sessionId ) return true;
    return false;
}

export function MissileWarning() {
    const ref = useRef< HTMLSpanElement >( null );

    // JUSTIFIED EFFECT — brackets a frame subscription to R3F's render loop, an outside-React system, to this mount.
    useEffect(
        () =>
            addEffect( () => {
                if ( ref.current ) ref.current.dataset.on = lockedOn() ? 'true' : 'false';
            } ),
        [],
    );

    return (
        <span
            ref={ ref }
            className="absolute top-[30%] left-1/2 -translate-x-1/2 invisible animate-pulse text-[clamp(12px,2vh,18px)] font-bold tracking-[0.4em] text-danger data-[on=true]:visible"
        >
            Missile lock
        </span>
    );
}
