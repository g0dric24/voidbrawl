import { DEFAULT_CLASS, emptyShip, type ShipClassId, type TeamId } from '@voidbrawl/shared';
import { trait } from 'koota';
import * as THREE from 'three';

export const Sim = trait( () => emptyShip() );

export const Prev = trait( () => ( { x: 0, y: 0, z: 0, qx: 0, qy: 0, qz: 0, qw: 1 } ) );

export const Pilot = trait( { classId: DEFAULT_CLASS as ShipClassId, team: 0 as TeamId, name: '' } );

export const NetId = trait( { sessionId: '' } );

export const LocalPlayer = trait();

export const Remote = trait();

export interface Snapshot {
    t: number;
    x: number;
    y: number;
    z: number;
    qx: number;
    qy: number;
    qz: number;
    qw: number;
}

export const Interp = trait( () => ( { buffer: [] as Snapshot[] } ) );

export const RemotePose = trait( () => ( {
    position: new THREE.Vector3(),
    quaternion: new THREE.Quaternion(),
    ready: false,
} ) );
