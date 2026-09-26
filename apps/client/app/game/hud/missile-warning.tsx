import { addEffect } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { THREAT_TEXT, threatLevel } from '../threat';

export function MissileWarning() {
    const ref = useRef< HTMLSpanElement >( null );

    // JUSTIFIED EFFECT — brackets a frame subscription to R3F's render loop, an outside-React system, to this mount.
    useEffect(
        () =>
            addEffect( () => {
                const el = ref.current;
                if ( ! el ) return;
                const text = THREAT_TEXT[ threatLevel() ];
                if ( el.textContent !== text ) el.textContent = text;
            } ),
        [],
    );

    return (
        <span
            ref={ ref }
            className="absolute top-[30%] left-1/2 -translate-x-1/2 animate-pulse text-[clamp(12px,2vh,18px)] font-bold tracking-[0.4em] text-danger"
        />
    );
}
