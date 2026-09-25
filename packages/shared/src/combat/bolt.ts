import type { Arena, TeamId } from '../arena/arena.js';
import { forwardOf, vec3 } from '../sim/quat.js';
import type { ShipState } from '../sim/ship-state.js';
import type { GunTuning } from './gun.js';

export const BOLT_RADIUS = 0.3;
const MUZZLE_GAP = 1;

export interface BoltLaunch {
    x0: number;
    y0: number;
    z0: number;
    vx: number;
    vy: number;
    vz: number;
    t0: number;
    ownerId: string;
    team: TeamId;
}

const _f = vec3();

export function launchBolt(
    ship: ShipState,
    hullRadius: number,
    gun: GunTuning,
    ownerId: string,
    team: TeamId,
    t0: number,
): BoltLaunch {
    const f = forwardOf( ship, _f );
    const along = ship.vx * f.x + ship.vy * f.y + ship.vz * f.z;
    const speed = gun.boltSpeed + ( along > 0 ? along : 0 );
    const muzzle = hullRadius + MUZZLE_GAP;
    return {
        x0: ship.x + f.x * muzzle,
        y0: ship.y + f.y * muzzle,
        z0: ship.z + f.z * muzzle,
        vx: f.x * speed,
        vy: f.y * speed,
        vz: f.z * speed,
        t0,
        ownerId,
        team,
    };
}

export function boltPosition( b: BoltLaunch, t: number, out = vec3() ) {
    const dt = t - b.t0;
    out.x = b.x0 + b.vx * dt;
    out.y = b.y0 + b.vy * dt;
    out.z = b.z0 + b.vz * dt;
    return out;
}

export interface BoltTarget {
    id: string;
    team: TeamId;
    x: number;
    y: number;
    z: number;
    radius: number;
}

export type BoltHit =
    | { kind: 'ship'; id: string; t: number }
    | { kind: 'rock'; id: number; t: number }
    | { kind: 'wall'; t: number };

function segmentSphere(
    px: number,
    py: number,
    pz: number,
    dx: number,
    dy: number,
    dz: number,
    cx: number,
    cy: number,
    cz: number,
    r: number,
): number {
    const mx = px - cx;
    const my = py - cy;
    const mz = pz - cz;
    const c = mx * mx + my * my + mz * mz - r * r;
    if ( c <= 0 ) return 0;
    const a = dx * dx + dy * dy + dz * dz;
    const b = mx * dx + my * dy + mz * dz;
    if ( b >= 0 || a === 0 ) return -1;
    const disc = b * b - a * c;
    if ( disc < 0 ) return -1;
    const t = ( -b - Math.sqrt( disc ) ) / a;
    return t <= 1 ? t : -1;
}

function exitSphere( px: number, py: number, pz: number, dx: number, dy: number, dz: number, r: number ): number {
    const a = dx * dx + dy * dy + dz * dz;
    if ( a === 0 ) return -1;
    const b = px * dx + py * dy + pz * dz;
    const c = px * px + py * py + pz * pz - r * r;
    if ( c > 0 ) return 0;
    const t = ( -b + Math.sqrt( b * b - a * c ) ) / a;
    return t >= 0 && t <= 1 ? t : -1;
}

export function sweepBolt(
    b: BoltLaunch,
    from: number,
    to: number,
    arena: Arena,
    ships: readonly BoltTarget[],
): BoltHit | null {
    const p = boltPosition( b, from );
    const dx = b.vx * ( to - from );
    const dy = b.vy * ( to - from );
    const dz = b.vz * ( to - from );
    let best: BoltHit | null = null;
    const wall = exitSphere( p.x, p.y, p.z, dx, dy, dz, arena.radius );
    if ( wall >= 0 ) best = { kind: 'wall', t: wall };
    for ( const a of arena.asteroids ) {
        const t = segmentSphere( p.x, p.y, p.z, dx, dy, dz, a.x, a.y, a.z, a.r + BOLT_RADIUS );
        if ( t >= 0 && ( best === null || t < best.t ) ) best = { kind: 'rock', id: a.id, t };
    }
    for ( const s of ships ) {
        if ( s.id === b.ownerId || s.team === b.team ) continue;
        const t = segmentSphere( p.x, p.y, p.z, dx, dy, dz, s.x, s.y, s.z, s.radius + BOLT_RADIUS );
        if ( t >= 0 && ( best === null || t < best.t ) ) best = { kind: 'ship', id: s.id, t };
    }
    return best;
}
