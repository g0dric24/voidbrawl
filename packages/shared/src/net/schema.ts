import { MapSchema, Schema, type } from '@colyseus/schema';
import type { ArenaDescriptor, TeamId } from '../arena/arena.js';
import { DEFAULT_CLASS, isShipClassId, type ShipClassId } from '../sim/ship-classes.js';
import type { ShipState } from '../sim/ship-state.js';

export class PlayerState extends Schema implements ShipState {
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
}

export class ArenaDescriptorState extends Schema {
    @type( 'string' ) mapId: ArenaDescriptor[ 'mapId' ] = 'rockfield';
    @type( 'uint32' ) seed = 0;
}

export class MatchState extends Schema {
    @type( ArenaDescriptorState ) arena = new ArenaDescriptorState();
    @type( { map: PlayerState } ) players = new MapSchema< PlayerState >();
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
