import { addEffect } from '@react-three/fiber';
import { SEEKER, SHIP_CLASSES } from '@voidbrawl/shared';
import { type RefObject, useEffect, useRef } from 'react';
import { LocalPlayer, Pilot, Vital } from '../ecs/traits';
import { world } from '../ecs/world';

const MAX_PIPS = 3;
const PIPS = Array.from( { length: MAX_PIPS }, ( _, i ) => i );

interface Group {
    root: HTMLDivElement | null;
    pips: ( HTMLSpanElement | null )[];
}

function paintGroup( g: Group, have: number, cap: number ): void {
    g.pips.forEach( ( pip, i ) => {
        if ( pip ) pip.dataset.state = i >= cap ? 'hidden' : i < have ? 'full' : 'empty';
    } );
}

function useUtilityPaint( seeker: RefObject< Group >, mine: RefObject< Group > ): void {
    // JUSTIFIED EFFECT — brackets a frame subscription to R3F's render loop, an outside-React system, to this mount.
    useEffect(
        () =>
            addEffect( () => {
                const e = world.queryFirst( LocalPlayer, Pilot, Vital );
                const vital = e?.get( Vital );
                const pilot = e?.get( Pilot );
                if ( ! vital || ! pilot ) return;
                const ship = SHIP_CLASSES[ pilot.classId ];
                paintGroup( seeker.current, vital.seekers, ship.seekers );
                paintGroup( mine.current, vital.mines, ship.mines );
                const ready = 1 - vital.seekerCooldown / SEEKER.cooldown;
                seeker.current.root?.style.setProperty( '--ready', String( Math.max( 0, Math.min( 1, ready ) ) ) );
            } ),
        [ seeker, mine ],
    );
}

function newGroup(): Group {
    return { root: null, pips: [] };
}

export function UtilitySlots() {
    const seeker = useRef< Group >( newGroup() );
    const mine = useRef< Group >( newGroup() );
    useUtilityPaint( seeker, mine );

    const groups = [
        { ref: seeker, label: 'Seeker', keyName: 'RMB', tone: 'bg-seeker' },
        { ref: mine, label: 'Mine', keyName: 'F', tone: 'bg-mine' },
    ];

    return (
        <div className="absolute bottom-[3%] left-1/2 flex -translate-x-1/2 gap-3">
            { groups.map( ( g ) => (
                <div
                    key={ g.label }
                    ref={ ( el ) => {
                        g.ref.current.root = el;
                    } }
                    className="relative flex h-[30px] w-[150px] items-center gap-2 overflow-hidden border border-line bg-space/70 px-2 text-[10px] tracking-[0.18em] [--ready:1]"
                >
                    <div className="absolute inset-y-0 left-0 w-[calc(var(--ready)*100%)] bg-readout/5" />
                    <span className="font-bold text-readout-dim">{ g.keyName }</span>
                    <span className="flex-1 font-semibold text-readout">{ g.label }</span>
                    { PIPS.map( ( i ) => (
                        <span
                            key={ i }
                            ref={ ( el ) => {
                                g.ref.current.pips[ i ] = el;
                            } }
                            className={ `size-2 border border-readout-dim data-[state=empty]:bg-transparent data-[state=hidden]:hidden ${ g.tone }` }
                        />
                    ) ) }
                </div>
            ) ) }
        </div>
    );
}
