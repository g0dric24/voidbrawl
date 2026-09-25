import type { World } from 'koota';
import * as THREE from 'three';
import { Interp, Remote, RemotePose, type Snapshot } from './ecs/traits';

export const RENDER_DELAY_MS = 100;
export const MAX_SNAPSHOTS = 60;

const _a = new THREE.Quaternion();
const _b = new THREE.Quaternion();

export function pushSnapshot( buffer: Snapshot[], snap: Snapshot ): void {
    buffer.push( snap );
    if ( buffer.length > MAX_SNAPSHOTS ) buffer.shift();
}

function hold( pose: { position: THREE.Vector3; quaternion: THREE.Quaternion }, s: Snapshot ): void {
    pose.position.set( s.x, s.y, s.z );
    pose.quaternion.set( s.qx, s.qy, s.qz, s.qw );
}

export function samplePose(
    buffer: readonly Snapshot[],
    renderTime: number,
    pose: { position: THREE.Vector3; quaternion: THREE.Quaternion },
): boolean {
    if ( buffer.length === 0 ) return false;
    const first = buffer[ 0 ];
    const last = buffer[ buffer.length - 1 ];
    if ( renderTime <= first.t ) {
        hold( pose, first );
        return true;
    }
    if ( renderTime >= last.t ) {
        hold( pose, last );
        return true;
    }
    for ( let i = 0; i < buffer.length - 1; i++ ) {
        const a = buffer[ i ];
        const b = buffer[ i + 1 ];
        if ( renderTime < a.t || renderTime > b.t ) continue;
        const k = ( renderTime - a.t ) / ( b.t - a.t || 1 );
        pose.position.set( a.x + ( b.x - a.x ) * k, a.y + ( b.y - a.y ) * k, a.z + ( b.z - a.z ) * k );
        _a.set( a.qx, a.qy, a.qz, a.qw );
        _b.set( b.qx, b.qy, b.qz, b.qw );
        pose.quaternion.slerpQuaternions( _a, _b, k );
        return true;
    }
    return false;
}

export function remoteInterpSystem( world: World, now: number ): void {
    const renderTime = now - RENDER_DELAY_MS;
    world.query( Remote, Interp, RemotePose ).updateEach( ( [ interp, pose ] ) => {
        pose.ready = samplePose( interp.buffer, renderTime, pose );
    } );
}
