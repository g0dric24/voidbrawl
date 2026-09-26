import { addAfterEffect } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { activeArena } from '../../net/active-arena';
import { LocalPlayer, Vital } from '../ecs/traits';
import { world } from '../ecs/world';
import { rockBetween } from '../line-of-sight';
import { remotePosition } from '../remote-position';
import { sceneCamera } from '../scene-camera';
import { type ScreenPoint, toScreen } from './marker-math';

const _sp: ScreenPoint = { x: 0, y: 0, onScreen: false, angle: 0 };

function paint( el: HTMLDivElement ): void {
    const vital = world.queryFirst( LocalPlayer, Vital )?.get( Vital );
    const camera = sceneCamera.current;
    const at = vital ? remotePosition( vital.lockId ) : null;
    const arena = activeArena();
    if ( ! vital || ! camera || ! at || ( arena && rockBetween( camera.position, at, arena ) ) ) {
        el.dataset.state = 'hidden';
        return;
    }
    toScreen( at, camera, window.innerWidth, window.innerHeight, 0, _sp );
    el.dataset.state = ! _sp.onScreen ? 'hidden' : vital.lockProgress >= 1 ? 'locked' : 'locking';
    el.style.setProperty( '--x', `${ _sp.x }px` );
    el.style.setProperty( '--y', `${ _sp.y }px` );
    el.style.setProperty( '--p', `${ Math.round( vital.lockProgress * 360 ) }deg` );
}

export function LockReticle() {
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
            data-state="hidden"
            className="group pointer-events-none fixed top-0 left-0 size-16 translate-x-[calc(var(--x)-50%)] translate-y-[calc(var(--y)-50%)] data-[state=hidden]:hidden [--p:0deg] [--x:-100px] [--y:-100px]"
        >
            <div className="absolute inset-0 rounded-full bg-[conic-gradient(var(--color-danger)_var(--p),transparent_0)] [mask:radial-gradient(circle,transparent_58%,#000_60%)] group-data-[state=locked]:animate-pulse" />
            <span className="absolute top-full left-1/2 mt-1 -translate-x-1/2 font-readout text-[10px] font-bold tracking-[0.3em] whitespace-nowrap text-danger opacity-0 group-data-[state=locked]:opacity-100">
                Locked · release
            </span>
        </div>
    );
}
