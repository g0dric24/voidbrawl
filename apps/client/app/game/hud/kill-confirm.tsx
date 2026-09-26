import { addEffect } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { feedback } from '../fx/fx-store';

const SHOW_MS = 1200;

export function KillConfirm() {
    const ref = useRef< HTMLSpanElement >( null );

    // JUSTIFIED EFFECT — brackets a frame subscription to R3F's render loop, an outside-React system, to this mount.
    useEffect(
        () =>
            addEffect( () => {
                const age = performance.now() - feedback.killAt;
                const t = age < SHOW_MS ? age / SHOW_MS : 1;
                ref.current?.style.setProperty( '--kill', String( 1 - t ) );
                ref.current?.style.setProperty( '--pop', String( 1 + 0.4 * Math.max( 0, 1 - t * 6 ) ) );
            } ),
        [],
    );

    return (
        <span
            ref={ ref }
            className="absolute top-[58%] left-1/2 -translate-x-1/2 scale-(--pop) text-[clamp(14px,2.4vh,22px)] font-bold tracking-[0.4em] text-marigold opacity-(--kill) [--kill:0] [--pop:1] text-shadow-readout"
        >
            +1 Kill
        </span>
    );
}
