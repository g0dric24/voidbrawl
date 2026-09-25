import type { Room } from '@colyseus/sdk';
import { type MatchState, SELF_DESTRUCT_MESSAGE, USE_PICKUP_MESSAGE } from '@voidbrawl/shared';
import { useEffect } from 'react';
import { typingTarget } from '../../dev/typing-target';
import { attachKeyboard } from '../../game/input/keyboard';
import { attachMouse } from '../../game/input/mouse';

const SLOT_KEYS: Record< string, number > = { Digit1: 0, Digit2: 1, Digit3: 2 };

export function PlayControls( { room }: { room: Room< MatchState > } ) {
    // JUSTIFIED EFFECT — syncs with an external system: the browser DOM keyboard (window keydown/keyup).
    useEffect( attachKeyboard, [] );

    // JUSTIFIED EFFECT — syncs with an external system: the DOM mouse and the Pointer Lock API.
    useEffect( attachMouse, [] );

    // JUSTIFIED EFFECT — syncs with an external system: DOM keyboard → self-destruct (K) and pickup-slot (1–3) messages to the room.
    useEffect( () => {
        const onKey = ( e: KeyboardEvent ) => {
            if ( e.repeat || typingTarget( e.target ) ) return;
            if ( e.code === 'KeyK' ) {
                room.send( SELF_DESTRUCT_MESSAGE );
                return;
            }
            const slot = SLOT_KEYS[ e.code ];
            if ( slot !== undefined ) room.send( USE_PICKUP_MESSAGE, slot );
        };
        addEventListener( 'keydown', onKey );
        return () => removeEventListener( 'keydown', onKey );
    }, [ room ] );

    return null;
}
