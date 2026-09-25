import { addEffect } from '@react-three/fiber';
import { PHASE } from '@voidbrawl/shared';
import { useEffect, useRef } from 'react';
import { session } from '../../net/session';
import { useMatch } from './use-match';

export function CountdownOverlay() {
    const match = useMatch();
    const ref = useRef< HTMLSpanElement >( null );

    // JUSTIFIED EFFECT — brackets a frame subscription to R3F's render loop, an outside-React system, to this mount.
    useEffect(
        () =>
            addEffect( () => {
                const left = session.room?.state?.countdown ?? 0;
                if ( ref.current ) ref.current.textContent = String( Math.max( 1, Math.ceil( left ) ) );
            } ),
        [],
    );

    if ( match.phase !== PHASE.countdown ) return null;

    return (
        <div className="pointer-events-none fixed inset-0 z-30 flex flex-col items-center justify-center gap-2 font-readout uppercase">
            <span className="text-sm tracking-[0.4em] text-readout-dim">Get ready</span>
            <span ref={ ref } className="text-[clamp(64px,14vh,140px)] font-bold text-marigold tabular-nums">
                3
            </span>
        </div>
    );
}
