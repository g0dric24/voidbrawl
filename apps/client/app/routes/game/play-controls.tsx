import type { Room } from '@colyseus/sdk';
import { DROP_MINE_MESSAGE, type MatchState } from '@voidbrawl/shared';
import { useEffect } from 'react';
import { typingTarget } from '../../dev/typing-target';
import { attachKeyboard } from '../../game/input/keyboard';
import { attachMouse } from '../../game/input/mouse';

export function PlayControls( { room }: { room: Room< MatchState > } ) {
    // JUSTIFIED EFFECT — syncs with an external system: the browser DOM keyboard (window keydown/keyup).
    useEffect( attachKeyboard, [] );

    // JUSTIFIED EFFECT — syncs with an external system: the DOM mouse and the Pointer Lock API.
    useEffect( attachMouse, [] );

    // JUSTIFIED EFFECT — syncs with an external system: DOM keyboard → drop-mine (F) messages to the room.
    useEffect( () => {
        const onKey = ( e: KeyboardEvent ) => {
            if ( e.repeat || typingTarget( e.target ) ) return;
            if ( e.code === 'KeyF' ) room.send( DROP_MINE_MESSAGE );
        };
        addEventListener( 'keydown', onKey );
        return () => removeEventListener( 'keydown', onKey );
    }, [ room ] );

    return null;
}
