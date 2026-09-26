import { addAfterEffect } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { feedback } from '../fx/fx-store';
import { sceneCamera } from '../scene-camera';
import { type ScreenPoint, toScreen } from './marker-math';

const SHOW_MS = 1400;
const _sp: ScreenPoint = { x: 0, y: 0, onScreen: false, angle: 0 };

function paint( el: HTMLDivElement ): void {
    const age = performance.now() - feedback.damageFromAt;
    const camera = sceneCamera.current;
    if ( age > SHOW_MS || ! camera ) {
        el.style.setProperty( '--dmg', '0' );
        return;
    }
    const w = window.innerWidth;
    const h = window.innerHeight;
    toScreen( feedback.damageFrom, camera, w, h, 0, _sp );
    const angle = _sp.onScreen ? Math.atan2( _sp.y - h / 2, _sp.x - w / 2 ) : _sp.angle;
    el.style.setProperty( '--dmg', String( 1 - age / SHOW_MS ) );
    el.style.setProperty( '--angle', `${ angle }rad` );
}

export function DamageDirection() {
    const ref = useRef< HTMLDivElement >( null );

    // JUSTIFIED EFFECT — brackets a post-render subscription to R3F's frame loop, an outside-React system, to this mount.
    useEffect(
        () =>
            addAfterEffect( () => {
                if ( ref.current ) paint( ref.current );
            } ),
        [],
    );

    return (
        <div
            ref={ ref }
            className="pointer-events-none fixed top-1/2 left-1/2 size-[min(56vh,56vw)] -translate-x-1/2 -translate-y-1/2 rotate-(--angle) rounded-full border-[5px] border-transparent border-r-danger opacity-(--dmg) [--angle:0rad] [--dmg:0]"
        />
    );
}
