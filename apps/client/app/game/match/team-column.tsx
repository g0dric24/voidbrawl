import { MODES, MOVE_PLAYER_MESSAGE, PICK_TEAM_MESSAGE, SHIP_CLASSES, type TeamId } from '@voidbrawl/shared';
import type { MatchView } from '../../net/match-store';
import { sendToRoom } from './send';

const TEAM_NAME = [ 'Marigold', 'Cyan' ] as const;
const TEAM_TEXT = [ 'text-marigold', 'text-cyan' ] as const;
const TEAM_BORDER = [ 'border-marigold', 'border-cyan' ] as const;

export function TeamColumn( { team, match }: { team: TeamId; match: MatchView } ) {
    const members = match.pilots.filter( ( p ) => p.team === team );
    const size = MODES[ match.mode ].teamSize;
    const you = match.pilots.find( ( p ) => p.id === match.youId );
    const host = match.youId === match.hostId;
    const canJoin = you !== undefined && you.team !== team && members.length < size;
    const other: TeamId = team === 0 ? 1 : 0;

    return (
        <div className={ `flex min-w-44 flex-1 flex-col gap-2 border-t-2 pt-3 ${ TEAM_BORDER[ team ] }` }>
            <div className="flex items-baseline justify-between">
                <span className={ `text-sm font-bold tracking-[0.25em] ${ TEAM_TEXT[ team ] }` }>
                    { TEAM_NAME[ team ] }
                </span>
                <span className="text-xs text-readout-dim tabular-nums">
                    { members.length } / { size }
                </span>
            </div>
            { members.map( ( p ) => (
                <div key={ p.id } className="flex items-center justify-between gap-2 text-sm normal-case">
                    <span className={ p.id === match.youId ? 'font-bold text-readout' : 'text-readout' }>
                        { p.name }
                        { p.id === match.hostId ? (
                            <span className="ml-2 text-[10px] text-readout-dim uppercase">host</span>
                        ) : null }
                    </span>
                    <span className="text-[10px] text-readout-dim uppercase">{ SHIP_CLASSES[ p.classId ].name }</span>
                    { host && p.id !== match.youId ? (
                        <button
                            type="button"
                            onClick={ () => sendToRoom( MOVE_PLAYER_MESSAGE, { sessionId: p.id, team: other } ) }
                            className="text-[10px] tracking-[0.2em] text-readout-dim uppercase hover:text-readout focus-visible:text-readout"
                        >
                            Move
                        </button>
                    ) : null }
                </div>
            ) ) }
            { Array.from( { length: Math.max( 0, size - members.length ) }, ( _, i ) => (
                <span key={ `open-${ team }-${ i }` } className="text-sm text-readout-dim/50">
                    open
                </span>
            ) ) }
            <button
                type="button"
                disabled={ ! canJoin }
                onClick={ () => sendToRoom( PICK_TEAM_MESSAGE, team ) }
                className={ `mt-1 border px-3 py-2 text-xs font-bold tracking-[0.25em] uppercase disabled:opacity-30 ${ TEAM_BORDER[ team ] } ${ TEAM_TEXT[ team ] } enabled:hover:bg-white/5` }
            >
                { you?.team === team ? 'Your side' : `Join ${ TEAM_NAME[ team ] }` }
            </button>
        </div>
    );
}
