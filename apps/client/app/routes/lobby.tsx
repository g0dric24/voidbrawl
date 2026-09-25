import { type MatchMode, MODE_ORDER, MODES, PHASE } from '@voidbrawl/shared';
import { useState, useSyncExternalStore } from 'react';
import { Link, useNavigate } from 'react-router';
import { callSign, setCallSign } from '../net/call-sign';
import { lobbyRooms, subscribeLobby } from '../net/lobby-store';
import { createMatch, joinLobby, leaveMatch } from '../net/matchmaking';
import type { Route } from './+types/lobby';

const PHASE_LABEL = [ 'In lobby', 'Starting', 'In match', 'Finished' ];

export function meta() {
    return [
        { title: 'VOIDBRAWL — Rooms' },
        { name: 'description', content: 'Create or join a 1v1, 2v2 or 4v4 room' },
    ];
}

export async function clientLoader( { request }: Route.ClientLoaderArgs ) {
    leaveMatch();
    const unavailable = new URL( request.url ).searchParams.get( 'room' ) === 'unavailable';
    try {
        await joinLobby();
        return { online: true, unavailable };
    } catch {
        return { online: false, unavailable };
    }
}

const BUTTON =
    'border border-marigold px-5 py-2 text-sm font-bold tracking-[0.3em] text-marigold uppercase hover:bg-marigold hover:text-void focus-visible:bg-marigold focus-visible:text-void focus-visible:outline-none disabled:opacity-30';

export default function Lobby( { loaderData }: Route.ComponentProps ) {
    const rooms = useSyncExternalStore( subscribeLobby, lobbyRooms, lobbyRooms );
    const [ name, setName ] = useState( callSign );
    const [ busy, setBusy ] = useState( false );
    const navigate = useNavigate();

    const create = async ( mode: MatchMode ) => {
        setBusy( true );
        try {
            const room = await createMatch( mode, setCallSign( name ) );
            navigate( `/game/${ room.roomId }` );
        } finally {
            setBusy( false );
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center gap-10 overflow-y-auto bg-void px-4 py-[8vh] font-readout text-readout uppercase">
            <Link to="/" className="text-[clamp(28px,5vw,56px)] font-bold tracking-[0.3em] text-marigold">
                VOIDBRAWL
            </Link>
            { ! loaderData.online ? (
                <p className="text-sm tracking-[0.2em] text-danger">
                    Game server not reachable — is <code className="normal-case">pnpm dev</code> running?
                </p>
            ) : null }
            { loaderData.unavailable ? (
                <p className="text-sm tracking-[0.2em] text-danger">That room is full or no longer exists.</p>
            ) : null }
            <label className="flex flex-col items-center gap-2 text-xs tracking-[0.3em] text-readout-dim">
                Call sign
                <input
                    value={ name }
                    maxLength={ 16 }
                    onChange={ ( e ) => setName( e.target.value ) }
                    onBlur={ () => setName( setCallSign( name ) ) }
                    className="w-64 border border-line bg-deep px-3 py-2 text-center text-base tracking-[0.15em] text-readout normal-case focus-visible:border-marigold focus-visible:outline-none"
                />
            </label>
            <section className="flex flex-col items-center gap-3">
                <span className="text-xs tracking-[0.3em] text-readout-dim">Create a room</span>
                <div className="flex flex-wrap justify-center gap-4">
                    { MODE_ORDER.map( ( mode ) => (
                        <button
                            key={ mode }
                            type="button"
                            disabled={ busy || ! loaderData.online }
                            onClick={ () => void create( mode ) }
                            className={ BUTTON }
                        >
                            { MODES[ mode ].label }
                        </button>
                    ) ) }
                </div>
            </section>
            <section className="flex w-[min(640px,100%)] flex-col gap-3">
                <span className="text-xs tracking-[0.3em] text-readout-dim">Open rooms</span>
                { rooms.length === 0 ? (
                    <span className="text-sm tracking-[0.15em] text-readout-dim normal-case">
                        No rooms yet — create one and share the invite link.
                    </span>
                ) : null }
                { rooms.map( ( r ) => {
                    const meta = r.metadata;
                    const full = r.clients >= r.maxClients;
                    return (
                        <div
                            key={ r.roomId }
                            className="flex items-center justify-between gap-4 border border-line bg-deep/60 px-4 py-3"
                        >
                            <span className="w-14 font-bold text-marigold">
                                { meta ? MODES[ meta.mode ].label : '?' }
                            </span>
                            <span className="flex-1 truncate text-sm normal-case">{ meta?.hostName || 'Room' }</span>
                            <span className="text-xs text-readout-dim tabular-nums">
                                { r.clients } / { r.maxClients }
                            </span>
                            <span className="w-24 text-right text-[11px] tracking-[0.15em] text-readout-dim">
                                { PHASE_LABEL[ meta?.phase ?? PHASE.lobby ] }
                            </span>
                            <button
                                type="button"
                                disabled={ full }
                                onClick={ () => {
                                    setCallSign( name );
                                    navigate( `/game/${ r.roomId }` );
                                } }
                                className={ BUTTON }
                            >
                                { full ? 'Full' : 'Join' }
                            </button>
                        </div>
                    );
                } ) }
            </section>
            <Link to="/sandbox" className="text-xs tracking-[0.3em] text-readout-dim hover:text-readout">
                Flight sandbox
            </Link>
        </main>
    );
}
