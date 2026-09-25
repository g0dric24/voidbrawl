export type MatchMode = 'duel' | 'squad' | 'team';

export interface ModeRules {
    id: MatchMode;
    label: string;
    teamSize: number;
    target: number;
}

export const MODES: Record< MatchMode, ModeRules > = {
    duel: { id: 'duel', label: '1v1', teamSize: 1, target: 10 },
    squad: { id: 'squad', label: '2v2', teamSize: 2, target: 20 },
    team: { id: 'team', label: '4v4', teamSize: 4, target: 40 },
};

export const MODE_ORDER: readonly MatchMode[] = [ 'duel', 'squad', 'team' ];
export const TIME_LIMIT = 600;
export const COUNTDOWN = 3;

export function isMatchMode( v: unknown ): v is MatchMode {
    return typeof v === 'string' && v in MODES;
}

export const PHASE = { lobby: 0, countdown: 1, live: 2, results: 3 } as const;
export type Phase = ( typeof PHASE )[ keyof typeof PHASE ];
