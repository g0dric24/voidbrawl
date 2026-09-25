import type { Orientation, Vec3 } from '../sim/quat.js';
import { mulberry32 } from '../sim/rng.js';

export type TeamId = 0 | 1;

export interface ArenaDescriptor {
    mapId: 'rockfield';
    seed: number;
}

export interface Asteroid {
    id: number;
    x: number;
    y: number;
    z: number;
    r: number;
}

export interface Base {
    team: TeamId;
    center: Vec3;
    facing: Orientation;
    spawns: readonly Vec3[];
}

export interface Arena {
    radius: number;
    asteroids: readonly Asteroid[];
    bases: readonly [ Base, Base ];
}

export const ARENA_RADIUS = 600;
export const BASE_INSET = 70;
export const BASE_CLEARANCE = 140;
export const ASTEROID_COUNT = 150;
export const ASTEROID_MIN_R = 5;
export const ASTEROID_MAX_R = 45;
export const ASTEROID_GAP = 22;
export const ASTEROID_FILL = 0.92;
export const SPAWN_SPACING = 28;
export const SPAWN_COLUMNS = 4;
export const SPAWN_ROWS = 2;
const MAX_ATTEMPTS = 40_000;

export const DEFAULT_ARENA: ArenaDescriptor = { mapId: 'rockfield', seed: 20260925 };

function spawnGrid( center: Vec3 ): Vec3[] {
    const out: Vec3[] = [];
    for ( let row = 0; row < SPAWN_ROWS; row++ ) {
        for ( let col = 0; col < SPAWN_COLUMNS; col++ ) {
            out.push( {
                x: center.x + ( col - ( SPAWN_COLUMNS - 1 ) / 2 ) * SPAWN_SPACING,
                y: center.y + ( row - ( SPAWN_ROWS - 1 ) / 2 ) * SPAWN_SPACING,
                z: center.z,
            } );
        }
    }
    return out;
}

function makeBase( team: TeamId, radius: number ): Base {
    const z = team === 0 ? -( radius - BASE_INSET ) : radius - BASE_INSET;
    const center = { x: 0, y: 0, z };
    const facing = team === 0 ? { qx: 0, qy: 0, qz: 0, qw: 1 } : { qx: 0, qy: 1, qz: 0, qw: 0 };
    return { team, center, facing, spawns: spawnGrid( center ) };
}

function clearOfBases( x: number, y: number, z: number, r: number, bases: readonly Base[] ): boolean {
    for ( const b of bases ) {
        const dx = x - b.center.x;
        const dy = y - b.center.y;
        const dz = z - b.center.z;
        const min = BASE_CLEARANCE + r;
        if ( dx * dx + dy * dy + dz * dz < min * min ) return false;
    }
    return true;
}

function clearOfRocks( x: number, y: number, z: number, r: number, rocks: readonly Asteroid[] ): boolean {
    for ( const a of rocks ) {
        const dx = x - a.x;
        const dy = y - a.y;
        const dz = z - a.z;
        const min = r + a.r + ASTEROID_GAP;
        if ( dx * dx + dy * dy + dz * dz < min * min ) return false;
    }
    return true;
}

function placeAsteroids( seed: number, radius: number, bases: readonly Base[] ): Asteroid[] {
    const rand = mulberry32( seed );
    const rocks: Asteroid[] = [];
    const span = radius * ASTEROID_FILL;
    for ( let attempt = 0; attempt < MAX_ATTEMPTS && rocks.length < ASTEROID_COUNT; attempt++ ) {
        const u = rand();
        const r = ASTEROID_MIN_R + ( ASTEROID_MAX_R - ASTEROID_MIN_R ) * u * u * Math.sqrt( u );
        const x = ( rand() * 2 - 1 ) * span;
        const y = ( rand() * 2 - 1 ) * span;
        const z = ( rand() * 2 - 1 ) * span;
        const reach = span - r;
        if ( x * x + y * y + z * z > reach * reach ) continue;
        if ( ! clearOfBases( x, y, z, r, bases ) ) continue;
        if ( ! clearOfRocks( x, y, z, r, rocks ) ) continue;
        rocks.push( { id: rocks.length, x, y, z, r } );
    }
    return rocks;
}

export function materializeArena( descriptor: ArenaDescriptor ): Arena {
    const radius = ARENA_RADIUS;
    const bases = [ makeBase( 0, radius ), makeBase( 1, radius ) ] as const;
    return {
        radius,
        asteroids: placeAsteroids( descriptor.seed, radius, bases ),
        bases,
    };
}
