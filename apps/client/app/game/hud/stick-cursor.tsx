import { addEffect } from '@react-three/fiber';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { aimMode, stickOffset, subscribeMouse } from '../input/mouse';

export function StickCursor() {
    const mode = useSyncExternalStore( subscribeMouse, aimMode, aimMode );
    const ref = useRef< HTMLDivElement >( null );

    // JUSTIFIED EFFECT — brackets a frame subscription to R3F's render loop, an outside-React system, to this mount.
    useEffect(
        () =>
            addEffect( () => {
                const { x, y } = stickOffset();
                ref.current?.style.setProperty( '--sx', `${ x }px` );
                ref.current?.style.setProperty( '--sy', `${ y }px` );
            } ),
        [],
    );

    if ( mode !== 'joystick' ) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center">
            <div className="absolute h-2 w-2 rounded-full border border-readout-dim" />
            <div
                ref={ ref }
                className="absolute h-3 w-3 translate-x-[var(--sx)] translate-y-[var(--sy)] rounded-full bg-marigold shadow-meter [--sx:0px] [--sy:0px]"
            />
        </div>
    );
}
