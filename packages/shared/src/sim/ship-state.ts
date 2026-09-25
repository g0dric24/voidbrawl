import type { Arena, TeamId } from '../arena/arena.js';
import type { Orientation } from './quat.js';

export interface ShipState extends Orientation {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    rollRate: number;
    boost: number;
    impact: number;
}

export function emptyShip(): ShipState {
    return {
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        qx: 0,
        qy: 0,
        qz: 0,
        qw: 1,
        rollRate: 0,
        boost: 1,
        impact: 0,
    };
}

export function spawnShip( arena: Arena, team: TeamId, slot: number ): ShipState {
    const base = arena.bases[ team ];
    const spawn = base.spawns[ ( ( slot % base.spawns.length ) + base.spawns.length ) % base.spawns.length ];
    return {
        ...emptyShip(),
        x: spawn.x,
        y: spawn.y,
        z: spawn.z,
        qx: base.facing.qx,
        qy: base.facing.qy,
        qz: base.facing.qz,
        qw: base.facing.qw,
    };
}

export function copyShip( into: ShipState, from: ShipState ): void {
    into.x = from.x;
    into.y = from.y;
    into.z = from.z;
    into.vx = from.vx;
    into.vy = from.vy;
    into.vz = from.vz;
    into.qx = from.qx;
    into.qy = from.qy;
    into.qz = from.qz;
    into.qw = from.qw;
    into.rollRate = from.rollRate;
    into.boost = from.boost;
    into.impact = from.impact;
}
