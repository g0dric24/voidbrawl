export interface Vec3 {
    x: number;
    y: number;
    z: number;
}

export interface Orientation {
    qx: number;
    qy: number;
    qz: number;
    qw: number;
}

export function vec3(): Vec3 {
    return { x: 0, y: 0, z: 0 };
}

export function normalizeOrientation( o: Orientation ): void {
    const len = Math.sqrt( o.qx * o.qx + o.qy * o.qy + o.qz * o.qz + o.qw * o.qw );
    if ( len === 0 ) {
        o.qx = 0;
        o.qy = 0;
        o.qz = 0;
        o.qw = 1;
        return;
    }
    o.qx /= len;
    o.qy /= len;
    o.qz /= len;
    o.qw /= len;
}

export function rotateBody( o: Orientation, ax: number, ay: number, az: number ): void {
    const rx = ax * 0.5;
    const ry = ay * 0.5;
    const rz = az * 0.5;
    const { qx, qy, qz, qw } = o;
    o.qw = qw - qx * rx - qy * ry - qz * rz;
    o.qx = qw * rx + qx + qy * rz - qz * ry;
    o.qy = qw * ry - qx * rz + qy + qz * rx;
    o.qz = qw * rz + qx * ry - qy * rx + qz;
    normalizeOrientation( o );
}

export function rotateVector( o: Orientation, x: number, y: number, z: number, out: Vec3 ): Vec3 {
    const { qx, qy, qz, qw } = o;
    const tx = 2 * ( qy * z - qz * y );
    const ty = 2 * ( qz * x - qx * z );
    const tz = 2 * ( qx * y - qy * x );
    out.x = x + qw * tx + ( qy * tz - qz * ty );
    out.y = y + qw * ty + ( qz * tx - qx * tz );
    out.z = z + qw * tz + ( qx * ty - qy * tx );
    return out;
}

export function forwardOf( o: Orientation, out: Vec3 ): Vec3 {
    return rotateVector( o, 0, 0, 1, out );
}

export function upOf( o: Orientation, out: Vec3 ): Vec3 {
    return rotateVector( o, 0, 1, 0, out );
}

export function rightOf( o: Orientation, out: Vec3 ): Vec3 {
    return rotateVector( o, -1, 0, 0, out );
}
