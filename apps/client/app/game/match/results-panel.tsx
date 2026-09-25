import { PHASE, PLAY_AGAIN_MESSAGE, type TeamId } from '@voidbrawl/shared';
import { Link } from 'react-router';
import { sendToRoom } from './send';
import { useMatch } from './use-match';

const TEAM_NAME = [ 'Marigold', 'Cyan' ] as const;
const TEAM_TEXT = [ 'text-marigold', 'text-cyan' ] as const;

export function ResultsPanel() {
    const match = useMatch();
    if ( match.phase !== PHASE.results ) return null;
    const winner = match.winner === 1 ? 1 : 0;
    const host = match.youId === match.hostId;
    const rows = [ ...match.pilots ].sort( ( a, b ) => b.kills - a.kills || a.deaths - b.deaths );

    return (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-void/70 font-readout text-readout uppercase backdrop-blur-sm">
            <div className="flex w-[min(520px,92vw)] flex-col gap-6 border border-line bg-deep/90 p-8">
                <div className="flex flex-col items-center gap-2">
                    <span
                        className={ `text-[clamp(28px,5vh,48px)] font-bold tracking-[0.3em] ${ TEAM_TEXT[ winner ] }` }
                    >
                        { TEAM_NAME[ winner ] } wins
                    </span>
                    <span className="text-lg tabular-nums">
                        <span className="text-marigold">{ match.score0 }</span>
                        <span className="px-3 text-readout-dim">—</span>
                        <span className="text-cyan">{ match.score1 }</span>
                    </span>
                </div>
                <div className="grid grid-cols-[1fr_auto_auto] gap-x-6 gap-y-1 text-sm normal-case">
                    <span className="text-[11px] tracking-[0.2em] text-readout-dim uppercase">Pilot</span>
                    <span className="text-[11px] tracking-[0.2em] text-readout-dim uppercase">Kills</span>
                    <span className="text-[11px] tracking-[0.2em] text-readout-dim uppercase">Deaths</span>
                    { rows.map( ( p ) => (
                        <div key={ p.id } className="contents">
                            <span className={ TEAM_TEXT[ p.team as TeamId ] }>
                                { p.name }
                                { p.id === match.youId ? ' (you)' : '' }
                            </span>
                            <span className="text-right tabular-nums">{ p.kills }</span>
                            <span className="text-right tabular-nums">{ p.deaths }</span>
                        </div>
                    ) ) }
                </div>
                <div className="flex items-center justify-between">
                    <Link to="/lobby" className="text-xs tracking-[0.25em] text-readout-dim hover:text-readout">
                        Leave
                    </Link>
                    { host ? (
                        <button
                            type="button"
                            onClick={ () => sendToRoom( PLAY_AGAIN_MESSAGE ) }
                            className="border border-marigold px-6 py-2 text-sm font-bold tracking-[0.3em] text-marigold hover:bg-marigold hover:text-void"
                        >
                            Play again
                        </button>
                    ) : (
                        <span className="text-xs tracking-[0.2em] text-readout-dim">Waiting for the host</span>
                    ) }
                </div>
            </div>
        </div>
    );
}
