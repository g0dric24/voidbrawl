import {
    type Arena,
    COUNTDOWN,
    forfeitWinner,
    judge,
    type MatchState,
    PHASE,
    type PlayerState,
    scoringTeam,
    type TeamCounts,
    type TeamId,
    TIME_LIMIT,
} from '@voidbrawl/shared';
import { revive } from './vitals-ops.js';

function others( state: MatchState, p: PlayerState ): PlayerState[] {
    return [ ...state.players.values() ].filter( ( o ) => o !== p );
}

export function sendToBase( state: MatchState, p: PlayerState, arena: Arena ): void {
    revive( p, arena, others( state, p ) );
    p.protect = 0;
}

export function sendAllToBase( state: MatchState, arena: Arena ): void {
    const placed: PlayerState[] = [];
    state.players.forEach( ( p ) => {
        revive( p, arena, placed );
        p.protect = 0;
        placed.push( p );
    } );
}

export function startCountdown( state: MatchState, arena: Arena ): void {
    sendAllToBase( state, arena );
    state.players.forEach( ( p ) => {
        p.kills = 0;
        p.deaths = 0;
    } );
    state.bolts.clear();
    state.score0 = 0;
    state.score1 = 0;
    state.timeLeft = TIME_LIMIT;
    state.suddenDeath = false;
    state.winner = -1;
    state.forfeit = false;
    state.countdown = COUNTDOWN;
    state.phase = PHASE.countdown;
}

export function returnToLobby( state: MatchState, arena: Arena ): void {
    state.bolts.clear();
    sendAllToBase( state, arena );
    state.phase = PHASE.lobby;
}

function finish( state: MatchState, winner: TeamId ): void {
    state.winner = winner;
    state.phase = PHASE.results;
}

export function endIfSideEmpty( state: MatchState, counts: TeamCounts ): boolean {
    if ( state.phase !== PHASE.countdown && state.phase !== PHASE.live ) return false;
    const winner = forfeitWinner( counts );
    if ( winner === null ) return false;
    state.bolts.clear();
    state.forfeit = true;
    finish( state, winner );
    return true;
}

function verdict( state: MatchState ): void {
    const v = judge( state.mode, state );
    if ( v.over ) finish( state, v.winner );
    else if ( state.timeLeft <= 0 ) state.suddenDeath = true;
}

export function stepClock( state: MatchState, dt: number ): void {
    if ( state.phase === PHASE.countdown ) {
        state.countdown = Math.max( 0, state.countdown - dt );
        if ( state.countdown === 0 ) state.phase = PHASE.live;
        return;
    }
    if ( state.phase !== PHASE.live || state.suddenDeath ) return;
    state.timeLeft = Math.max( 0, state.timeLeft - dt );
    if ( state.timeLeft === 0 ) verdict( state );
}

export function awardDeath( state: MatchState, victimTeam: TeamId ): void {
    if ( state.phase !== PHASE.live ) return;
    if ( scoringTeam( victimTeam ) === 0 ) state.score0 += 1;
    else state.score1 += 1;
    verdict( state );
}
