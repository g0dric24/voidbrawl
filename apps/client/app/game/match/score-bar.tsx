import { addEffect } from '@react-three/fiber';
import { MODES, PHASE } from '@voidbrawl/shared';
import { useEffect, useRef } from 'react';
import { session } from '../../net/session';
import { useMatch } from './use-match';

function clock( seconds: number ): string {
    const s = Math.max( 0, Math.ceil( seconds ) );
    return `${ Math.floor( s / 60 ) }:${ String( s % 60 ).padStart( 2, '0' ) }`;
}

export function ScoreBar() {
    const match = useMatch();
    const timer = useRef< HTMLSpanElement >( null );

    // JUSTIFIED EFFECT — brackets a frame subscription to R3F's render loop, an outside-React system, to this mount.
    useEffect(
        () =>
            addEffect( () => {
                if ( timer.current ) timer.current.textContent = clock( session.room?.state?.timeLeft ?? 0 );
            } ),
        [],
    );

    if ( match.phase !== PHASE.live && match.phase !== PHASE.countdown ) return null;

    return (
        <div className="pointer-events-none fixed inset-x-0 top-[clamp(12px,2.5vh,28px)] z-20 flex flex-col items-center gap-1 font-readout uppercase">
            <div className="flex items-baseline gap-5 text-shadow-readout">
                <span className="text-[clamp(26px,4.5vh,44px)] font-bold text-marigold tabular-nums">
                    { match.score0 }
                </span>
                <span className="text-xs tracking-[0.3em] text-readout-dim">to { MODES[ match.mode ].target }</span>
                <span className="text-[clamp(26px,4.5vh,44px)] font-bold text-cyan tabular-nums">{ match.score1 }</span>
            </div>
            { match.suddenDeath ? (
                <span className="text-sm font-bold tracking-[0.35em] text-danger text-shadow-danger">Sudden death</span>
            ) : (
                <span
                    ref={ timer }
                    className="text-sm tracking-[0.25em] text-readout tabular-nums text-shadow-readout"
                />
            ) }
        </div>
    );
}
