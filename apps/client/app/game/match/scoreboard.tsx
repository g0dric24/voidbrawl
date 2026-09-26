import { addEffect } from '@react-three/fiber';
import { PHASE, SHIP_CLASSES, type TeamId } from '@voidbrawl/shared';
import { useEffect, useRef } from 'react';
import { isHeld } from '../input/keyboard';
import { useMatch } from './use-match';

const TEAM_NAME = [ 'Marigold', 'Cyan' ] as const;
const TEAM_TEXT = [ 'text-marigold', 'text-cyan' ] as const;
const TEAMS: readonly TeamId[] = [ 0, 1 ];

export function Scoreboard() {
    const match = useMatch();
    const ref = useRef< HTMLDivElement >( null );

    // JUSTIFIED EFFECT — brackets a frame subscription to R3F's render loop, an outside-React system, to this mount.
    useEffect(
        () =>
            addEffect( () => {
                if ( ref.current ) ref.current.dataset.open = isHeld( 'Tab' ) ? 'true' : 'false';
            } ),
        [],
    );

    if ( match.phase !== PHASE.live && match.phase !== PHASE.countdown ) return null;
    const scores = [ match.score0, match.score1 ];

    return (
        <div
            ref={ ref }
            className="fixed inset-0 z-30 hidden items-center justify-center bg-void/50 font-readout text-readout uppercase data-[open=true]:flex"
        >
            <div className="grid w-[min(720px,94vw)] grid-cols-2 gap-6 border border-line bg-deep/90 p-6">
                { TEAMS.map( ( team ) => (
                    <div key={ team } className="flex flex-col gap-2">
                        <div
                            className={ `flex items-baseline justify-between font-bold tracking-[0.3em] ${ TEAM_TEXT[ team ] }` }
                        >
                            <span>{ TEAM_NAME[ team ] }</span>
                            <span className="text-2xl tabular-nums">{ scores[ team ] }</span>
                        </div>
                        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 gap-y-1 text-sm normal-case">
                            <span className="text-[10px] tracking-[0.2em] text-readout-dim uppercase">Pilot</span>
                            <span className="text-[10px] tracking-[0.2em] text-readout-dim uppercase">Ship</span>
                            <span className="text-[10px] tracking-[0.2em] text-readout-dim uppercase">K</span>
                            <span className="text-[10px] tracking-[0.2em] text-readout-dim uppercase">D</span>
                            { match.pilots
                                .filter( ( p ) => p.team === team )
                                .sort( ( a, b ) => b.kills - a.kills || a.deaths - b.deaths )
                                .map( ( p ) => (
                                    <div key={ p.id } className="contents">
                                        <span className={ p.id === match.youId ? 'font-bold' : '' }>{ p.name }</span>
                                        <span className="text-readout-dim">{ SHIP_CLASSES[ p.classId ].name }</span>
                                        <span className="text-right tabular-nums">{ p.kills }</span>
                                        <span className="text-right tabular-nums">{ p.deaths }</span>
                                    </div>
                                ) ) }
                        </div>
                    </div>
                ) ) }
            </div>
        </div>
    );
}
