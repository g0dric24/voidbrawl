import type { Arena, Box, TeamId } from '../arena/arena.js';
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
    | { kind: 'pillar'; id: number; t: number }
    | { kind: 'wall'; t: number };

function slab( p: number, d: number, lo: number, hi: number, span: [ number, number ] ): boolean {
    if ( d === 0 ) return p >= lo && p <= hi;
    let a = ( lo - p ) / d;
    let b = ( hi - p ) / d;
    if ( a > b ) [ a, b ] = [ b, a ];
    if ( a > span[ 0 ] ) span[ 0 ] = a;
    if ( b < span[ 1 ] ) span[ 1 ] = b;
    return span[ 0 ] <= span[ 1 ];
}

export function segmentBox(
    p: { x: number; y: number; z: number },
    dx: number,
    dy: number,
    dz: number,
    box: Box,
    pad: number,
): number {
    const span: [ number, number ] = [ 0, 1 ];
    if ( ! slab( p.x, dx, box.x0 - pad, box.x1 + pad, span ) ) return -1;
    if ( ! slab( p.y, dy, box.y0 - pad, box.y1 + pad, span ) ) return -1;
    if ( ! slab( p.z, dz, box.z0 - pad, box.z1 + pad, span ) ) return -1;
    return span[ 0 ];
}

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

interface Ray {
    p: { x: number; y: number; z: number };
    dx: number;
    dy: number;
    dz: number;
}

function earlier( best: BoltHit | null, next: BoltHit ): BoltHit | null {
    if ( next.t < 0 ) return best;
    return best === null || next.t < best.t ? next : best;
}

function sphereHit( r: Ray, cx: number, cy: number, cz: number, radius: number ): number {
    return segmentSphere( r.p.x, r.p.y, r.p.z, r.dx, r.dy, r.dz, cx, cy, cz, radius + BOLT_RADIUS );
}

function obstacleHit( r: Ray, arena: Arena ): BoltHit | null {
    let best: BoltHit | null = null;
    const wall = exitSphere( r.p.x, r.p.y, r.p.z, r.dx, r.dy, r.dz, arena.radius );
    if ( wall >= 0 ) best = { kind: 'wall', t: wall };
    for ( const a of arena.asteroids )
        best = earlier( best, { kind: 'rock', id: a.id, t: sphereHit( r, a.x, a.y, a.z, a.r ) } );
    for ( const box of arena.pillars ) {
        best = earlier( best, {
            kind: 'pillar',
            id: box.id,
            t: segmentBox( r.p, r.dx, r.dy, r.dz, box, BOLT_RADIUS ),
        } );
    }
    return best;
}

export function sweepBolt(
    b: BoltLaunch,
    from: number,
    to: number,
    arena: Arena,
    ships: readonly BoltTarget[],
): BoltHit | null {
    const r: Ray = {
        p: boltPosition( b, from ),
        dx: b.vx * ( to - from ),
        dy: b.vy * ( to - from ),
        dz: b.vz * ( to - from ),
    };
    let best = obstacleHit( r, arena );
    for ( const s of ships ) {
        if ( s.id === b.ownerId || s.team === b.team ) continue;
        best = earlier( best, { kind: 'ship', id: s.id, t: sphereHit( r, s.x, s.y, s.z, s.radius ) } );
    }
    return best;
}
