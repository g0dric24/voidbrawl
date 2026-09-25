import { type Arena, copyShip, SHIP_ORDER, spawnShip } from '@voidbrawl/shared';
import type { World } from 'koota';
import { useWorld } from 'koota/react';
import { useEffect } from 'react';
import { LocalPlayer, Pilot, Prev, Sim } from '../../game/ecs/traits';
import { attachKeyboard } from '../../game/input/keyboard';
import { attachMouse } from '../../game/input/mouse';
import { capturePrev } from '../../game/pose-from-sim';

function respawn( world: World, arena: Arena ): void {
    const ship = world.queryFirst( LocalPlayer, Sim, Prev, Pilot );
    const sim = ship?.get( Sim );
    const prev = ship?.get( Prev );
    const pilot = ship?.get( Pilot );
    if ( ! sim || ! prev || ! pilot ) return;
    copyShip( sim, spawnShip( arena, pilot.team, 0 ) );
    capturePrev( sim, prev );
}

function swapClass( world: World, code: string ): void {
    const classId = code.startsWith( 'Digit' ) ? SHIP_ORDER[ Number( code.slice( 5 ) ) - 1 ] : undefined;
    const ship = world.queryFirst( LocalPlayer, Pilot );
    const pilot = ship?.get( Pilot );
    if ( classId && ship && pilot ) ship.set( Pilot, { ...pilot, classId } );
}

export function SandboxShip( { arena }: { arena: Arena } ) {
    const world = useWorld();

    // JUSTIFIED EFFECT — syncs with an external system: the browser DOM keyboard (window keydown/keyup).
    useEffect( attachKeyboard, [] );

    // JUSTIFIED EFFECT — syncs with an external system: the DOM mouse and the Pointer Lock API.
    useEffect( attachMouse, [] );

    // JUSTIFIED EFFECT — syncs with an external system: the koota ECS world (module singleton) that owns the ship.
    useEffect( () => {
        const sim = spawnShip( arena, 0, 0 );
        const prev = { x: 0, y: 0, z: 0, qx: 0, qy: 0, qz: 0, qw: 1 };
        capturePrev( sim, prev );
        const ship = world.spawn( Sim( sim ), Prev( prev ), Pilot, LocalPlayer );
        return () => ship.destroy();
    }, [ world, arena ] );

    // JUSTIFIED EFFECT — syncs with an external system: DOM keyboard → respawn (R) and ship class hot-swap (1–3).
    useEffect( () => {
        const onKey = ( e: KeyboardEvent ) => {
            if ( e.repeat ) return;
            if ( e.code === 'KeyR' ) respawn( world, arena );
            else swapClass( world, e.code );
        };
        addEventListener( 'keydown', onKey );
        return () => removeEventListener( 'keydown', onKey );
    }, [ world, arena ] );

    return null;
}
