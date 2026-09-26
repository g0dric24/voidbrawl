import { addEffect } from '@react-three/fiber';
import { SHIP_CLASSES, type ShipClassId } from '@voidbrawl/shared';
import { type RefObject, useEffect, useRef } from 'react';
import { session } from '../../net/session';
import { LocalPlayer, Vital } from '../ecs/traits';
import { world } from '../ecs/world';
import { lastDeath } from '../fx/fx-store';

const WEAPON: Record< string, string > = { bolt: 'guns', seeker: 'seeker', mine: 'mine' };

interface VitalView {
    dead: boolean;
    respawnTimer: number;
    nextClassId: string;
    protect: number;
}

interface DeathRefs {
    root: RefObject< HTMLDivElement | null >;
    next: RefObject< HTMLSpanElement | null >;
    by: RefObject< HTMLSpanElement | null >;
}

function nextText( nextClassId: string ): string {
    return nextClassId in SHIP_CLASSES ? `Next ship: ${ SHIP_CLASSES[ nextClassId as ShipClassId ].name }` : '';
}

function byText(): string {
    if ( lastDeath.cause === 'crash' ) return 'You crashed';
    const killer = session.room?.state.players.get( lastDeath.killerId );
    if ( ! killer ) return '';
    return `Destroyed by ${ killer.name } · ${ WEAPON[ lastDeath.cause ] ?? 'guns' }`;
}

function setText( el: HTMLSpanElement | null, text: string ): void {
    if ( el && el.textContent !== text ) el.textContent = text;
}

function paint( root: HTMLDivElement, vital: VitalView ): void {
    root.dataset.dead = vital.dead ? 'true' : 'false';
    root.dataset.shielded = vital.protect > 0 ? 'true' : 'false';
    root.style.setProperty( '--respawn', `"${ Math.max( 0, vital.respawnTimer ).toFixed( 1 ) }"` );
}

function useDeathPaint( refs: DeathRefs ): void {
    // JUSTIFIED EFFECT — brackets a frame subscription to R3F's render loop, an outside-React system, to this mount.
    useEffect(
        () =>
            addEffect( () => {
                const vital = world.queryFirst( LocalPlayer, Vital )?.get( Vital );
                if ( ! vital || ! refs.root.current ) return;
                paint( refs.root.current, vital );
                setText( refs.next.current, nextText( vital.nextClassId ) );
                setText( refs.by.current, vital.dead ? byText() : '' );
            } ),
        [ refs ],
    );
}

export function DeathOverlay() {
    const root = useRef< HTMLDivElement >( null );
    const next = useRef< HTMLSpanElement >( null );
    const by = useRef< HTMLSpanElement >( null );
    const refs = useRef< DeathRefs >( { root, next, by } );
    useDeathPaint( refs.current );

    return (
        <div
            ref={ root }
            className="group fixed inset-0 flex flex-col items-center justify-start gap-3 pt-[20vh] [--respawn:'']"
        >
            <span className="text-[clamp(28px,5vh,52px)] font-bold tracking-[0.35em] text-danger opacity-0 group-data-[dead=true]:opacity-100 text-shadow-danger">
                Destroyed
            </span>
            <span
                ref={ by }
                className="text-[clamp(11px,1.8vh,15px)] tracking-[0.25em] text-readout opacity-0 group-data-[dead=true]:opacity-100"
            />
            <span className="text-[clamp(12px,2vh,18px)] tracking-[0.25em] text-readout opacity-0 group-data-[dead=true]:opacity-100 after:tabular-nums after:content-[var(--respawn)]">
                Respawning in{ ' ' }
            </span>
            <span ref={ next } className="text-[clamp(10px,1.6vh,14px)] tracking-[0.2em] text-marigold" />
            <span className="absolute top-[26%] text-[clamp(10px,1.6vh,14px)] font-semibold tracking-[0.3em] text-cyan opacity-0 group-data-[shielded=true]:opacity-100">
                Spawn shield
            </span>
        </div>
    );
}
