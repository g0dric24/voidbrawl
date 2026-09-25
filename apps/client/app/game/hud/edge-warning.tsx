import { addEffect } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { viewPose } from '../view-pose';

const WARN_AT = 40;

export function EdgeWarning() {
    const ref = useRef< HTMLDivElement >( null );
    const textRef = useRef< HTMLSpanElement >( null );

    // JUSTIFIED EFFECT — brackets a frame subscription to R3F's render loop, an outside-React system, to this mount.
    useEffect(
        () =>
            addEffect( () => {
                const el = ref.current;
                if ( ! el ) return;
                const near = viewPose.outside || viewPose.edgeDistance < WARN_AT;
                el.style.setProperty( '--shown', near ? '1' : '0' );
                if ( textRef.current ) {
                    textRef.current.textContent = viewPose.outside
                        ? 'Outside the arena — turn back'
                        : `Arena edge ${ Math.max( 0, Math.round( viewPose.edgeDistance ) ) }u`;
                }
            } ),
        [],
    );

    return (
        <div
            ref={ ref }
            className="absolute inset-x-0 top-[18%] flex justify-center opacity-[var(--shown)] transition-opacity duration-200 [--shown:0]"
        >
            <span
                ref={ textRef }
                className="text-[clamp(14px,2.4vh,24px)] font-bold tracking-[0.25em] text-danger text-shadow-danger"
            />
        </div>
    );
}
