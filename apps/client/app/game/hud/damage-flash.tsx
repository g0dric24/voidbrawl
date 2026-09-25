import { addEffect } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { feedback } from '../fx/fx-store';

const FADE_MS = 450;

export function DamageFlash() {
    const ref = useRef< HTMLDivElement >( null );

    // JUSTIFIED EFFECT — brackets a frame subscription to R3F's render loop, an outside-React system, to this mount.
    useEffect(
        () =>
            addEffect( () => {
                const age = performance.now() - feedback.damageAt;
                ref.current?.style.setProperty( '--hurt', age < FADE_MS ? String( 1 - age / FADE_MS ) : '0' );
            } ),
        [],
    );

    return (
        <div
            ref={ ref }
            className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(255,75,62,0.55)_100%)] opacity-[var(--hurt)] [--hurt:0]"
        />
    );
}
