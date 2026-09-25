import { addEffect } from '@react-three/fiber';
import { isPickupKind, MAX_SLOTS, PICKUP_NAMES, SHIP_CLASSES } from '@voidbrawl/shared';
import { type RefObject, useEffect, useRef } from 'react';
import { LocalPlayer, Pilot, Vital } from '../ecs/traits';
import { world } from '../ecs/world';
import { PICKUP_COLORS } from '../pickup-colors';

const SLOT_INDEXES = Array.from( { length: MAX_SLOTS }, ( _, i ) => i );

function paintSlot( el: HTMLDivElement, kind: number, open: boolean ): void {
    const key = `${ open ? 1 : 0 }:${ kind }`;
    if ( el.dataset.key === key ) return;
    el.dataset.key = key;
    el.dataset.open = open ? 'true' : 'false';
    const label = el.lastElementChild as HTMLElement;
    const full = isPickupKind( kind );
    label.textContent = full ? PICKUP_NAMES[ kind ] : '';
    el.style.setProperty( '--kind', full ? PICKUP_COLORS[ kind ] : 'transparent' );
}

function useSlotPaint( refs: RefObject< ( HTMLDivElement | null )[] > ): void {
    // JUSTIFIED EFFECT — brackets a frame subscription to R3F's render loop, an outside-React system, to this mount.
    useEffect(
        () =>
            addEffect( () => {
                const e = world.queryFirst( LocalPlayer, Pilot, Vital );
                const vital = e?.get( Vital );
                const pilot = e?.get( Pilot );
                if ( ! vital || ! pilot ) return;
                const kinds = [ vital.slot0, vital.slot1, vital.slot2 ];
                const cap = SHIP_CLASSES[ pilot.classId ].slots;
                refs.current.forEach( ( el, i ) => {
                    if ( el ) paintSlot( el, kinds[ i ], i < cap );
                } );
            } ),
        [ refs ],
    );
}

export function PickupSlots() {
    const refs = useRef< ( HTMLDivElement | null )[] >( [] );
    useSlotPaint( refs );

    return (
        <div className="absolute bottom-[3%] left-1/2 flex -translate-x-1/2 gap-2">
            { SLOT_INDEXES.map( ( i ) => (
                <div
                    key={ i }
                    ref={ ( el ) => {
                        refs.current[ i ] = el;
                    } }
                    className="flex h-[34px] w-[92px] items-center gap-2 border border-line bg-space/70 px-2 text-[10px] tracking-[0.18em] [--kind:transparent] data-[open=false]:hidden"
                >
                    <span className="font-bold text-readout-dim">{ i + 1 }</span>
                    <span className="font-semibold text-[var(--kind)]" />
                </div>
            ) ) }
        </div>
    );
}
