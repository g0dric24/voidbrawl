import { addEffect } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { feedback } from '../fx/fx-store';

const SHOW_MS = 160;

export function HitMarker() {
    const ref = useRef< HTMLDivElement >( null );

    // JUSTIFIED EFFECT — brackets a frame subscription to R3F's render loop, an outside-React system, to this mount.
    useEffect(
        () =>
            addEffect( () => {
                const age = performance.now() - feedback.hitMarkerAt;
                ref.current?.style.setProperty( '--hit', age < SHOW_MS ? String( 1 - age / SHOW_MS ) : '0' );
            } ),
        [],
    );

    return (
        <div ref={ ref } className="fixed inset-0 flex items-center justify-center opacity-[var(--hit)] [--hit:0]">
            <div className="relative h-7 w-7">
                <div className="absolute top-1/2 left-0 h-[2px] w-full -translate-y-1/2 rotate-45 bg-readout" />
                <div className="absolute top-1/2 left-0 h-[2px] w-full -translate-y-1/2 -rotate-45 bg-readout" />
            </div>
        </div>
    );
}
