import type { FlightInput } from '../sim/input.js';

export const MATCH_ROOM = 'match';

export const INPUT_MESSAGE = 'input';
export const SET_CLASS_MESSAGE = 'class';
export const SELF_DESTRUCT_MESSAGE = 'selfDestruct';
export const HIT_MESSAGE = 'hit';
export const KILL_MESSAGE = 'kill';
export const LOBBY_ROOM = 'lobby';
export const PICK_TEAM_MESSAGE = 'pickTeam';
export const MOVE_PLAYER_MESSAGE = 'movePlayer';
export const START_MESSAGE = 'start';
export const PLAY_AGAIN_MESSAGE = 'playAgain';
export const USE_PICKUP_MESSAGE = 'usePickup';

export interface NetInput extends FlightInput {
    seq: number;
}

export interface InputMessage {
    inputs: NetInput[];
}

export interface JoinOptions {
    name?: string;
    mode?: string;
    bot?: boolean;
}

export interface MovePlayerMessage {
    sessionId: string;
    team: number;
}

export interface HitMessage {
    victimId: string;
    shooterId: string;
    x: number;
    y: number;
    z: number;
    shield: number;
    hull: number;
}

export type DeathCause = 'bolt' | 'seeker' | 'mine' | 'crash' | 'self';

export interface KillMessage {
    victimId: string;
    killerId: string;
    cause: DeathCause;
}

export const MAX_NAME = 16;
