import type { Arena, Box } from '../arena/arena.js';
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

function clamp( v: number, lo: number, hi: number ): number {
    return v < lo ? lo : v > hi ? hi : v;
}

function pushOutOfInside( s: ShipState, b: Box, hull: number, restitution: number ): void {
    const exits = [
        [ s.x - b.x0, -1, 0, 0 ],
        [ b.x1 - s.x, 1, 0, 0 ],
        [ s.y - b.y0, 0, -1, 0 ],
        [ b.y1 - s.y, 0, 1, 0 ],
        [ s.z - b.z0, 0, 0, -1 ],
        [ b.z1 - s.z, 0, 0, 1 ],
    ];
    let best = exits[ 0 ];
    for ( const e of exits ) if ( e[ 0 ] < best[ 0 ] ) best = e;
    const [ depth, nx, ny, nz ] = best;
    s.x += nx * ( depth + hull );
    s.y += ny * ( depth + hull );
    s.z += nz * ( depth + hull );
    bounce( s, nx, ny, nz, restitution );
}

function collideBox( s: ShipState, b: Box, hull: number, restitution: number ): void {
    const cx = clamp( s.x, b.x0, b.x1 );
    const cy = clamp( s.y, b.y0, b.y1 );
    const cz = clamp( s.z, b.z0, b.z1 );
    const dx = s.x - cx;
    const dy = s.y - cy;
    const dz = s.z - cz;
    const d2 = dx * dx + dy * dy + dz * dz;
    if ( d2 >= hull * hull ) return;
    if ( d2 === 0 ) {
        pushOutOfInside( s, b, hull, restitution );
        return;
    }
    const d = Math.sqrt( d2 );
    const nx = dx / d;
    const ny = dy / d;
    const nz = dz / d;
    s.x = cx + nx * hull;
    s.y = cy + ny * hull;
    s.z = cz + nz * hull;
    bounce( s, nx, ny, nz, restitution );
}

export function collidePillars( s: ShipState, arena: Arena, hull: number, restitution: number ): void {
    for ( const b of arena.pillars ) collideBox( s, b, hull, restitution );
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
