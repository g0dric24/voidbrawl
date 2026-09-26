import type { Arena } from '@voidbrawl/shared';
import type * as THREE from 'three';

export function rockBetween( from: THREE.Vector3, to: THREE.Vector3, arena: Arena ): boolean {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dz = to.z - from.z;
    const len2 = dx * dx + dy * dy + dz * dz;
    if ( len2 === 0 ) return false;
    for ( const a of arena.asteroids ) {
        const t = ( ( a.x - from.x ) * dx + ( a.y - from.y ) * dy + ( a.z - from.z ) * dz ) / len2;
        if ( t <= 0 || t >= 1 ) continue;
        const px = from.x + dx * t - a.x;
        const py = from.y + dy * t - a.y;
        const pz = from.z + dz * t - a.z;
        if ( px * px + py * py + pz * pz < a.r * a.r ) return true;
    }
    return false;
}
