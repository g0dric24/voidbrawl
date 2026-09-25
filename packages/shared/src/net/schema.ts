import { MapSchema, Schema, type } from '@colyseus/schema';
import type { ArenaDescriptor, TeamId } from '../arena/arena.js';
import type { BoltLaunch } from '../combat/bolt.js';
import type { Vitals } from '../combat/vitals.js';
import { type MatchMode, PHASE, type Phase, TIME_LIMIT } from '../match/modes.js';
import { DEFAULT_CLASS, isShipClassId, type ShipClassId } from '../sim/ship-classes.js';
import type { ShipState } from '../sim/ship-state.js';

export class PlayerState extends Schema implements ShipState, Vitals {
    @type( 'float32' ) x = 0;
    @type( 'float32' ) y = 0;
    @type( 'float32' ) z = 0;
    @type( 'float32' ) vx = 0;
    @type( 'float32' ) vy = 0;
    @type( 'float32' ) vz = 0;
    @type( 'float32' ) qx = 0;
    @type( 'float32' ) qy = 0;
    @type( 'float32' ) qz = 0;
    @type( 'float32' ) qw = 1;
    @type( 'float32' ) rollRate = 0;
    @type( 'float32' ) boost = 1;
    @type( 'float32' ) impact = 0;

    @type( 'uint32' ) lastProcessedInput = 0;
    @type( 'boolean' ) connected = true;
    @type( 'string' ) name = '';
    @type( 'uint8' ) team: TeamId = 0;
    @type( 'string' ) classId: ShipClassId = DEFAULT_CLASS;

    @type( 'float32' ) heat = 0;
    @type( 'float32' ) cooldown = 0;
    @type( 'boolean' ) overheated = false;
    shot = false;

    @type( 'float32' ) hull = 0;
    @type( 'float32' ) shield = 0;
    @type( 'float32' ) protect = 0;
    @type( 'boolean' ) dead = false;
    @type( 'float32' ) respawnTimer = 0;
    @type( 'uint16' ) kills = 0;
    @type( 'uint16' ) deaths = 0;
    @type( 'string' ) nextClassId: ShipClassId | '' = '';
    maxShield = 0;
    shieldDelay = 0;
}

export class Bolt extends Schema implements BoltLaunch {
    @type( 'float32' ) x0 = 0;
    @type( 'float32' ) y0 = 0;
    @type( 'float32' ) z0 = 0;
    @type( 'float32' ) vx = 0;
    @type( 'float32' ) vy = 0;
    @type( 'float32' ) vz = 0;
    @type( 'float64' ) t0 = 0;
    @type( 'string' ) ownerId = '';
    @type( 'uint8' ) team: TeamId = 0;
    @type( 'float64' ) tEnd = 0;
    @type( 'boolean' ) struck = false;
}

export class ArenaDescriptorState extends Schema {
    @type( 'string' ) mapId: ArenaDescriptor[ 'mapId' ] = 'rockfield';
    @type( 'uint32' ) seed = 0;
}

export class MatchState extends Schema {
    @type( ArenaDescriptorState ) arena = new ArenaDescriptorState();
    @type( { map: PlayerState } ) players = new MapSchema< PlayerState >();
    @type( 'float64' ) time = 0;
    @type( { map: Bolt } ) bolts = new MapSchema< Bolt >();

    @type( 'uint8' ) phase: Phase = PHASE.lobby;
    @type( 'string' ) mode: MatchMode = 'duel';
    @type( 'string' ) hostId = '';
    @type( 'uint16' ) score0 = 0;
    @type( 'uint16' ) score1 = 0;
    @type( 'float32' ) timeLeft = TIME_LIMIT;
    @type( 'float32' ) countdown = 0;
    @type( 'boolean' ) suddenDeath = false;
    @type( 'int8' ) winner = -1;
    @type( 'boolean' ) forfeit = false;
}

export interface RoomMeta {
    hostName: string;
    mode: MatchMode;
    phase: Phase;
    players: number;
    capacity: number;
}

export function applyArenaDescriptor( state: ArenaDescriptorState, d: ArenaDescriptor ): void {
    state.mapId = d.mapId;
    state.seed = d.seed;
}

export function toArenaDescriptor( state: ArenaDescriptorState ): ArenaDescriptor {
    return { mapId: 'rockfield', seed: state.seed };
}

export function arenaReady( state: ArenaDescriptorState | undefined ): boolean {
    return !! state && state.seed !== 0;
}

export function classOf( p: { classId: string } ): ShipClassId {
    return isShipClassId( p.classId ) ? p.classId : DEFAULT_CLASS;
}
