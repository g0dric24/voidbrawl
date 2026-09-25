import type { World } from 'koota';
import * as THREE from 'three';
import { Interp, Remote, RemotePose, type Snapshot } from './ecs/traits';

export const RENDER_DELAY_MS = 100;
export const MAX_SNAPSHOTS = 60;

export interface SampledPose {
    position: THREE.Vector3;
    quaternion: THREE.Quaternion;
    velocity: THREE.Vector3;
}

const _a = new THREE.Quaternion();
const _b = new THREE.Quaternion();

export function pushSnapshot( buffer: Snapshot[], snap: Snapshot ): void {
    buffer.push( snap );
    if ( buffer.length > MAX_SNAPSHOTS ) buffer.shift();
}

function hold( pose: SampledPose, s: Snapshot ): void {
    pose.position.set( s.x, s.y, s.z );
    pose.quaternion.set( s.qx, s.qy, s.qz, s.qw );
    pose.velocity.set( s.vx, s.vy, s.vz );
}

function blend( pose: SampledPose, a: Snapshot, b: Snapshot, k: number ): void {
    pose.position.set( a.x + ( b.x - a.x ) * k, a.y + ( b.y - a.y ) * k, a.z + ( b.z - a.z ) * k );
    pose.velocity.set( a.vx + ( b.vx - a.vx ) * k, a.vy + ( b.vy - a.vy ) * k, a.vz + ( b.vz - a.vz ) * k );
    _a.set( a.qx, a.qy, a.qz, a.qw );
    _b.set( b.qx, b.qy, b.qz, b.qw );
    pose.quaternion.slerpQuaternions( _a, _b, k );
}

export function samplePose( buffer: readonly Snapshot[], renderTime: number, pose: SampledPose ): boolean {
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
        blend( pose, a, b, ( renderTime - a.t ) / ( b.t - a.t || 1 ) );
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
