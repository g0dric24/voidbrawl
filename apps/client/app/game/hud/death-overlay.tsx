import { addEffect } from '@react-three/fiber';
import { SHIP_CLASSES, type ShipClassId } from '@voidbrawl/shared';
import { type RefObject, useEffect, useRef } from 'react';
import { LocalPlayer, Vital } from '../ecs/traits';
import { world } from '../ecs/world';

interface VitalView {
    dead: boolean;
    respawnTimer: number;
    nextClassId: string;
    protect: number;
}

function nextText( nextClassId: string ): string {
    return nextClassId in SHIP_CLASSES ? `Next ship: ${ SHIP_CLASSES[ nextClassId as ShipClassId ].name }` : '';
}

function paint( root: HTMLDivElement, vital: VitalView ): void {
    root.dataset.dead = vital.dead ? 'true' : 'false';
    root.dataset.shielded = vital.protect > 0 ? 'true' : 'false';
    root.style.setProperty( '--respawn', `"${ Math.max( 0, vital.respawnTimer ).toFixed( 1 ) }"` );
}

function useDeathPaint( root: RefObject< HTMLDivElement | null >, next: RefObject< HTMLSpanElement | null > ): void {
    // JUSTIFIED EFFECT — brackets a frame subscription to R3F's render loop, an outside-React system, to this mount.
    useEffect(
        () =>
            addEffect( () => {
                const vital = world.queryFirst( LocalPlayer, Vital )?.get( Vital );
                if ( ! vital || ! root.current ) return;
                paint( root.current, vital );
                if ( next.current ) next.current.textContent = nextText( vital.nextClassId );
            } ),
        [ root, next ],
    );
}

export function DeathOverlay() {
    const ref = useRef< HTMLDivElement >( null );
    const nextRef = useRef< HTMLSpanElement >( null );
    useDeathPaint( ref, nextRef );

    return (
        <div
            ref={ ref }
            className="group fixed inset-0 flex flex-col items-center justify-start gap-3 pt-[20vh] [--respawn:'']"
        >
            <span className="text-[clamp(28px,5vh,52px)] font-bold tracking-[0.35em] text-danger opacity-0 group-data-[dead=true]:opacity-100 text-shadow-danger">
                Destroyed
            </span>
            <span className="text-[clamp(12px,2vh,18px)] tracking-[0.25em] text-readout opacity-0 group-data-[dead=true]:opacity-100 after:tabular-nums after:content-[var(--respawn)]">
                Respawning in{ ' ' }
            </span>
            <span ref={ nextRef } className="text-[clamp(10px,1.6vh,14px)] tracking-[0.2em] text-marigold" />
            <span className="absolute top-[26%] text-[clamp(10px,1.6vh,14px)] font-semibold tracking-[0.3em] text-cyan opacity-0 group-data-[shielded=true]:opacity-100">
                Spawn shield
            </span>
        </div>
    );
}
