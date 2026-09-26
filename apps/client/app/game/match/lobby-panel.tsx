import { canStart, MODES, PHASE, START_MESSAGE } from '@voidbrawl/shared';
import { useState } from 'react';
import { Link } from 'react-router';
import { ClassPicker } from './class-picker';
import { sendToRoom } from './send';
import { TeamColumn } from './team-column';
import { useMatch } from './use-match';

export function LobbyPanel() {
    const match = useMatch();
    const [ copied, setCopied ] = useState( false );
    if ( match.phase !== PHASE.lobby || ! match.youId ) return null;
    const host = match.youId === match.hostId;
    const counts = {
        marigold: match.pilots.filter( ( p ) => p.team === 0 ).length,
        cyan: match.pilots.filter( ( p ) => p.team === 1 ).length,
    };
    const ready = canStart( counts );
    const you = match.pilots.find( ( p ) => p.id === match.youId );

    const copyInvite = () => {
        void navigator.clipboard?.writeText( window.location.href ).then( () => setCopied( true ) );
    };

    return (
        <div className="fixed top-1/2 right-[clamp(16px,2.7vw,48px)] z-30 flex w-[min(440px,92vw)] -translate-y-1/2 flex-col gap-5 border border-line bg-deep/85 p-6 font-readout text-readout uppercase backdrop-blur-sm">
            <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold tracking-[0.3em] text-readout">
                    { MODES[ match.mode ].label } room
                </span>
                <button
                    type="button"
                    onClick={ copyInvite }
                    className="text-[11px] tracking-[0.2em] text-readout-dim hover:text-readout focus-visible:text-readout"
                >
                    { copied ? 'Link copied' : 'Copy invite link' }
                </button>
            </div>
            <div className="flex gap-6">
                <TeamColumn team={ 0 } match={ match } />
                <TeamColumn team={ 1 } match={ match } />
            </div>
            { you ? <ClassPicker current={ you.classId } next={ you.nextClassId } title="Your ship" /> : null }
            <span className="text-[11px] tracking-[0.18em] text-readout-dim normal-case">
                First to { MODES[ match.mode ].target } kills · 10 minutes · click the arena to fly while you wait
            </span>
            <div className="flex items-center justify-between gap-4">
                <Link to="/lobby" className="text-xs tracking-[0.25em] text-readout-dim hover:text-readout">
                    Leave
                </Link>
                { host ? (
                    <button
                        type="button"
                        disabled={ ! ready }
                        onClick={ () => sendToRoom( START_MESSAGE ) }
                        className="border border-marigold px-6 py-2 text-sm font-bold tracking-[0.3em] text-marigold disabled:opacity-30 enabled:hover:bg-marigold enabled:hover:text-void"
                    >
                        Start
                    </button>
                ) : (
                    <span className="text-xs tracking-[0.2em] text-readout-dim">Waiting for the host</span>
                ) }
            </div>
            { host && ! ready ? (
                <span className="text-[11px] tracking-[0.15em] text-readout-dim normal-case">
                    Both sides need a pilot, and sides can differ by at most one.
                </span>
            ) : null }
        </div>
    );
}
