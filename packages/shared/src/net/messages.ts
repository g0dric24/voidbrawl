import type { FlightInput } from '../sim/input.js';

export const MATCH_ROOM = 'match';

export const INPUT_MESSAGE = 'input';
export const SET_CLASS_MESSAGE = 'class';
export const RESPAWN_MESSAGE = 'respawn';

export interface NetInput extends FlightInput {
    seq: number;
}

export interface InputMessage {
    inputs: NetInput[];
}

export interface JoinOptions {
    name?: string;
}

export const MAX_NAME = 16;
