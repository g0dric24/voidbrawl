import type { Room } from '@colyseus/sdk';
import { type MatchMode, type MatchState, PHASE, type Phase, type ShipClassId, type TeamId } from '@voidbrawl/shared';

export interface PilotRow {
    id: string;
    name: string;
    team: TeamId;
    classId: ShipClassId;
    kills: number;
    deaths: number;
}

export interface MatchView {
    phase: Phase;
    mode: MatchMode;
    hostId: string;
    youId: string;
    score0: number;
    score1: number;
    suddenDeath: boolean;
    winner: number;
    pilots: PilotRow[];
}

const EMPTY: MatchView = {
    phase: PHASE.lobby,
    mode: 'duel',
    hostId: '',
    youId: '',
    score0: 0,
    score1: 0,
    suddenDeath: false,
    winner: -1,
    pilots: [],
};

let view: MatchView = EMPTY;
let key = '';
const listeners = new Set< () => void >();

export function subscribeMatch( listener: () => void ): () => void {
    listeners.add( listener );
    return () => {
        listeners.delete( listener );
    };
}

export function currentMatch(): MatchView {
    return view;
}

function publish( next: MatchView ): void {
    const nextKey = JSON.stringify( next );
    if ( nextKey === key ) return;
    key = nextKey;
    view = next;
    for ( const listener of listeners ) listener();
}

function read( room: Room< MatchState > ): MatchView {
    const s = room.state;
    const pilots: PilotRow[] = [];
    s.players.forEach( ( p, id ) => {
        pilots.push( {
            id,
            name: p.name,
            team: p.team as TeamId,
            classId: p.classId,
            kills: p.kills,
            deaths: p.deaths,
        } );
    } );
    return {
        phase: s.phase,
        mode: s.mode,
        hostId: s.hostId,
        youId: room.sessionId,
        score0: s.score0,
        score1: s.score1,
        suddenDeath: s.suddenDeath,
        winner: s.winner,
        pilots,
    };
}

export function attachMatchStore( room: Room< MatchState > ): () => void {
    const onChange = () => publish( read( room ) );
    room.onStateChange( onChange );
    onChange();
    return () => {
        room.onStateChange.remove( onChange );
        publish( EMPTY );
    };
}

export function isLive(): boolean {
    return view.phase === PHASE.live;
}

export function isFrozen(): boolean {
    return view.phase === PHASE.countdown || view.phase === PHASE.results;
}
