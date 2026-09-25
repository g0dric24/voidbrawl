import type { TeamId } from '../arena/arena.js';
import { forwardOf, type Vec3, vec3 } from '../sim/quat.js';
import type { ShipState } from '../sim/ship-state.js';
import type { BoltTarget } from './bolt.js';
import { SEEKER } from './pickups.js';

export interface SeekerFlight {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
}

const _f = vec3();
const _d = vec3();
const _w = vec3();
const _p = vec3();

function unitInto( out: Vec3, x: number, y: number, z: number ): number {
    const len = Math.sqrt( x * x + y * y + z * z );
    if ( len === 0 ) return 0;
    out.x = x / len;
    out.y = y / len;
    out.z = z / len;
    return len;
}

export function acquireTarget( shooter: ShipState, team: TeamId, targets: readonly BoltTarget[] ): string {
    const f = forwardOf( shooter, _f );
    let best = '';
    let bestDist: number = SEEKER.range;
    for ( const t of targets ) {
        if ( t.team === team ) continue;
        const dx = t.x - shooter.x;
        const dy = t.y - shooter.y;
        const dz = t.z - shooter.z;
        const dist = Math.sqrt( dx * dx + dy * dy + dz * dz );
        if ( dist === 0 || dist > bestDist ) continue;
        if ( ( dx * f.x + dy * f.y + dz * f.z ) / dist < SEEKER.coneCos ) continue;
        best = t.id;
        bestDist = dist;
    }
    return best;
}

export function launchSeeker( shooter: ShipState, hullRadius: number ): SeekerFlight {
    const f = forwardOf( shooter, _f );
    const muzzle = hullRadius + SEEKER.muzzle;
    return {
        x: shooter.x + f.x * muzzle,
        y: shooter.y + f.y * muzzle,
        z: shooter.z + f.z * muzzle,
        vx: f.x * SEEKER.speed,
        vy: f.y * SEEKER.speed,
        vz: f.z * SEEKER.speed,
    };
}

function heading( m: SeekerFlight, x: number, y: number, z: number ): void {
    m.vx = x * SEEKER.speed;
    m.vy = y * SEEKER.speed;
    m.vz = z * SEEKER.speed;
}

function turnToward( m: SeekerFlight, target: Vec3, dt: number ): void {
    if ( unitInto( _d, m.vx, m.vy, m.vz ) === 0 ) return;
    if ( unitInto( _w, target.x - m.x, target.y - m.y, target.z - m.z ) === 0 ) return;
    const turn = SEEKER.turnRate * dt;
    const along = _d.x * _w.x + _d.y * _w.y + _d.z * _w.z;
    const side = unitInto( _p, _w.x - along * _d.x, _w.y - along * _d.y, _w.z - along * _d.z );
    if ( along >= Math.cos( turn ) || side === 0 ) {
        heading( m, _w.x, _w.y, _w.z );
        return;
    }
    const c = Math.cos( turn );
    const s = Math.sin( turn );
    heading( m, _d.x * c + _p.x * s, _d.y * c + _p.y * s, _d.z * c + _p.z * s );
}

export function steerSeeker( m: SeekerFlight, target: Vec3 | null, dt: number ): void {
    if ( target ) turnToward( m, target, dt );
    m.x += m.vx * dt;
    m.y += m.vy * dt;
    m.z += m.vz * dt;
}
