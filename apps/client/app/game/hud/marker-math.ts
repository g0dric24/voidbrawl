import * as THREE from 'three';

export interface ScreenPoint {
    x: number;
    y: number;
    onScreen: boolean;
    angle: number;
}

const _v = new THREE.Vector3();
const _toTarget = new THREE.Vector3();
const _forward = new THREE.Vector3();

export function toScreen(
    world: THREE.Vector3,
    camera: THREE.PerspectiveCamera,
    width: number,
    height: number,
    margin: number,
    out: ScreenPoint,
): ScreenPoint {
    _forward.set( 0, 0, -1 ).applyQuaternion( camera.quaternion );
    const inFront = _toTarget.subVectors( world, camera.position ).dot( _forward ) > 0;
    _v.copy( world ).project( camera );
    let nx = _v.x;
    let ny = _v.y;
    if ( ! inFront ) {
        nx = -nx;
        ny = -ny;
    }
    out.onScreen = inFront && Math.abs( nx ) <= 1 && Math.abs( ny ) <= 1;
    if ( out.onScreen ) {
        out.x = ( ( nx + 1 ) / 2 ) * width;
        out.y = ( ( 1 - ny ) / 2 ) * height;
        out.angle = 0;
        return out;
    }
    return clampToEdge( nx, ny, width, height, margin, out );
}

export function clampToEdge(
    nx: number,
    ny: number,
    width: number,
    height: number,
    margin: number,
    out: ScreenPoint,
): ScreenPoint {
    const hx = width / 2 - margin;
    const hy = height / 2 - margin;
    const dx = nx * ( width / 2 );
    const dy = -ny * ( height / 2 );
    const k = Math.min( hx / Math.max( Math.abs( dx ), 1e-6 ), hy / Math.max( Math.abs( dy ), 1e-6 ) );
    out.x = width / 2 + dx * k;
    out.y = height / 2 + dy * k;
    out.angle = Math.atan2( dy, dx );
    out.onScreen = false;
    return out;
}
