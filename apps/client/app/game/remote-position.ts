import type * as THREE from 'three';
import { NetId, Remote, RemotePose } from './ecs/traits';
import { world } from './ecs/world';

export function remotePosition( sessionId: string ): THREE.Vector3 | null {
    if ( ! sessionId ) return null;
    let found: THREE.Vector3 | null = null;
    world.query( Remote, NetId, RemotePose ).readEach( ( [ net, pose ] ) => {
        if ( net.sessionId === sessionId && pose.ready ) found = pose.position;
    } );
    return found;
}
