import type { TeamId } from '../arena/arena.js';
import { type MatchMode, MODES } from './modes.js';

export interface TeamCounts {
    marigold: number;
    cyan: number;
}

export function countOf( counts: TeamCounts, team: TeamId ): number {
    return team === 0 ? counts.marigold : counts.cyan;
}

export function canJoinTeam( mode: MatchMode, counts: TeamCounts, team: TeamId ): boolean {
    return countOf( counts, team ) < MODES[ mode ].teamSize;
}

export function openTeam( mode: MatchMode, counts: TeamCounts ): TeamId | null {
    const first: TeamId = counts.cyan < counts.marigold ? 1 : 0;
    const second: TeamId = first === 0 ? 1 : 0;
    if ( canJoinTeam( mode, counts, first ) ) return first;
    return canJoinTeam( mode, counts, second ) ? second : null;
}

export function canStart( counts: TeamCounts ): boolean {
    return counts.marigold >= 1 && counts.cyan >= 1 && Math.abs( counts.marigold - counts.cyan ) <= 1;
}

export function forfeitWinner( counts: TeamCounts ): TeamId | null {
    if ( counts.marigold === 0 && counts.cyan > 0 ) return 1;
    if ( counts.cyan === 0 && counts.marigold > 0 ) return 0;
    return null;
}

export function scoringTeam( victimTeam: TeamId ): TeamId {
    return victimTeam === 0 ? 1 : 0;
}

export interface Scoreboard {
    score0: number;
    score1: number;
    timeLeft: number;
    suddenDeath: boolean;
}

export type Verdict = { over: false } | { over: true; winner: TeamId };

export function judge( mode: MatchMode, s: Scoreboard ): Verdict {
    const target = MODES[ mode ].target;
    if ( s.score0 >= target ) return { over: true, winner: 0 };
    if ( s.score1 >= target ) return { over: true, winner: 1 };
    if ( s.timeLeft > 0 && ! s.suddenDeath ) return { over: false };
    if ( s.score0 > s.score1 ) return { over: true, winner: 0 };
    if ( s.score1 > s.score0 ) return { over: true, winner: 1 };
    return { over: false };
}
