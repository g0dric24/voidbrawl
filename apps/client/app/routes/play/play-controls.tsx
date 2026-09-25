import type { Room } from '@colyseus/sdk';
import { type MatchState, RESPAWN_MESSAGE, SET_CLASS_MESSAGE, SHIP_ORDER } from '@voidbrawl/shared';
import { useEffect } from 'react';
import { attachKeyboard } from '../../game/input/keyboard';
import { attachMouse } from '../../game/input/mouse';

export function PlayControls( { room }: { room: Room< MatchState > } ) {
    // JUSTIFIED EFFECT — syncs with an external system: the browser DOM keyboard (window keydown/keyup).
    useEffect( attachKeyboard, [] );

    // JUSTIFIED EFFECT — syncs with an external system: the DOM mouse and the Pointer Lock API.
    useEffect( attachMouse, [] );

    // JUSTIFIED EFFECT — syncs with an external system: DOM keyboard → respawn (R) and class switch (1–3) messages to the room.
    useEffect( () => {
        const onKey = ( e: KeyboardEvent ) => {
            if ( e.repeat ) return;
            if ( e.code === 'KeyR' ) {
                room.send( RESPAWN_MESSAGE );
                return;
            }
            const classId = e.code.startsWith( 'Digit' ) ? SHIP_ORDER[ Number( e.code.slice( 5 ) ) - 1 ] : undefined;
            if ( classId ) room.send( SET_CLASS_MESSAGE, classId );
        };
        addEventListener( 'keydown', onKey );
        return () => removeEventListener( 'keydown', onKey );
    }, [ room ] );

    return null;
}
