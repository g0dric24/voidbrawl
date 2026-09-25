import type { Arena } from '../arena/arena.js';
import type { ShipState } from './ship-state.js';

function bounce( s: ShipState, nx: number, ny: number, nz: number, restitution: number ): void {
    const vn = s.vx * nx + s.vy * ny + s.vz * nz;
    if ( vn >= 0 ) return;
    const k = ( 1 + restitution ) * vn;
    s.vx -= k * nx;
    s.vy -= k * ny;
    s.vz -= k * nz;
    if ( -vn > s.impact ) s.impact = -vn;
}

export function collideAsteroids( s: ShipState, arena: Arena, hull: number, restitution: number ): void {
    for ( const a of arena.asteroids ) {
        const dx = s.x - a.x;
        const dy = s.y - a.y;
        const dz = s.z - a.z;
        const min = a.r + hull;
        const d2 = dx * dx + dy * dy + dz * dz;
        if ( d2 >= min * min ) continue;
        const d = Math.sqrt( d2 );
        const nx = d > 0 ? dx / d : 0;
        const ny = d > 0 ? dy / d : 1;
        const nz = d > 0 ? dz / d : 0;
        s.x = a.x + nx * min;
        s.y = a.y + ny * min;
        s.z = a.z + nz * min;
        bounce( s, nx, ny, nz, restitution );
    }
}

export function collideBoundary( s: ShipState, arena: Arena, hull: number, restitution: number ): void {
    const d2 = s.x * s.x + s.y * s.y + s.z * s.z;
    const max = arena.radius - hull;
    if ( d2 <= max * max ) return;
    const d = Math.sqrt( d2 );
    const nx = s.x / d;
    const ny = s.y / d;
    const nz = s.z / d;
    s.x = nx * max;
    s.y = ny * max;
    s.z = nz * max;
    bounce( s, -nx, -ny, -nz, restitution );
}
