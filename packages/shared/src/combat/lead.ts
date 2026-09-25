import type { Vec3 } from '../sim/quat.js';

export function interceptTime(
    rx: number,
    ry: number,
    rz: number,
    vx: number,
    vy: number,
    vz: number,
    speed: number,
): number {
    const a = vx * vx + vy * vy + vz * vz - speed * speed;
    const b = 2 * ( rx * vx + ry * vy + rz * vz );
    const c = rx * rx + ry * ry + rz * rz;
    if ( Math.abs( a ) < 1e-9 ) return b < 0 ? -c / b : -1;
    const disc = b * b - 4 * a * c;
    if ( disc < 0 ) return -1;
    const root = Math.sqrt( disc );
    const t1 = ( -b - root ) / ( 2 * a );
    const t2 = ( -b + root ) / ( 2 * a );
    const t = t1 > 0 && t2 > 0 ? Math.min( t1, t2 ) : Math.max( t1, t2 );
    return t > 0 ? t : -1;
}

export function leadPoint( shooter: Vec3, target: Vec3, targetVel: Vec3, boltSpeed: number, out: Vec3 ): boolean {
    const rx = target.x - shooter.x;
    const ry = target.y - shooter.y;
    const rz = target.z - shooter.z;
    const t = interceptTime( rx, ry, rz, targetVel.x, targetVel.y, targetVel.z, boltSpeed );
    if ( t < 0 ) return false;
    out.x = target.x + targetVel.x * t;
    out.y = target.y + targetVel.y * t;
    out.z = target.z + targetVel.z * t;
    return true;
}
