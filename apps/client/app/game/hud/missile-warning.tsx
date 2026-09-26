import type { Room } from '@colyseus/sdk';
import { addEffect } from '@react-three/fiber';
import type { MatchState } from '@voidbrawl/shared';
import { useEffect, useRef } from 'react';
import { session } from '../../net/session';

type Threat = '' | 'Locking on you' | 'Missile lock' | 'Missile incoming';

function incoming( room: Room< MatchState > ): boolean {
    for ( const m of room.state.missiles.values() ) if ( m.targetId === room.sessionId ) return true;
    return false;
}

function lockOn( room: Room< MatchState > ): number {
    let best = 0;
    room.state.players.forEach( ( p ) => {
        if ( p.lockId === room.sessionId && p.lockProgress > best ) best = p.lockProgress;
    } );
    return best;
}

function threat(): Threat {
    const room = session.room;
    if ( ! room?.state?.missiles ) return '';
    if ( incoming( room ) ) return 'Missile incoming';
    const lock = lockOn( room );
    if ( lock >= 1 ) return 'Missile lock';
    return lock > 0 ? 'Locking on you' : '';
}

export function MissileWarning() {
    const ref = useRef< HTMLSpanElement >( null );

    // JUSTIFIED EFFECT — brackets a frame subscription to R3F's render loop, an outside-React system, to this mount.
    useEffect(
        () =>
            addEffect( () => {
                const el = ref.current;
                if ( ! el ) return;
                const text = threat();
                if ( el.textContent !== text ) el.textContent = text;
            } ),
        [],
    );

    return (
        <span
            ref={ ref }
            className="absolute top-[30%] left-1/2 -translate-x-1/2 animate-pulse text-[clamp(12px,2vh,18px)] font-bold tracking-[0.4em] text-danger"
        />
    );
}
