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
        <div className="pointer-events-none fixed inset-x-0 top-[clamp(10px,2vh,24px)] z-20 flex justify-center font-readout uppercase">
            <div className="flex items-stretch gap-1 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
                <span className="flex min-w-16 items-center justify-center bg-marigold px-4 font-display text-[clamp(22px,3.8vh,36px)] font-black text-void tabular-nums [clip-path:polygon(0_0,100%_0,calc(100%-12px)_100%,0_100%)]">
                    { match.score0 }
                </span>
                <span className="flex flex-col items-center justify-center bg-deep/90 px-5 py-1">
                    <span className="text-[10px] tracking-[0.3em] text-readout-dim">
                        Kill target { MODES[ match.mode ].target }
                    </span>
                    { match.suddenDeath ? (
                        <span className="font-display text-sm font-bold tracking-[0.2em] text-danger">
                            Sudden death
                        </span>
                    ) : (
                        <span
                            ref={ timer }
                            className="font-display text-base font-bold tracking-[0.15em] tabular-nums"
                        />
                    ) }
                </span>
                <span className="flex min-w-16 items-center justify-center bg-cyan px-4 font-display text-[clamp(22px,3.8vh,36px)] font-black text-void tabular-nums [clip-path:polygon(12px_0,100%_0,100%_100%,0_100%)]">
                    { match.score1 }
                </span>
            </div>
        </div>
    );
}
