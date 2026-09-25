import { DEFAULT_CLASS, emptyShip, type ShipClassId, type TeamId } from '@voidbrawl/shared';
import { trait } from 'koota';
import * as THREE from 'three';

export const Sim = trait( () => emptyShip() );

export const Prev = trait( () => ( { x: 0, y: 0, z: 0, qx: 0, qy: 0, qz: 0, qw: 1 } ) );

export const Pilot = trait( { classId: DEFAULT_CLASS as ShipClassId, team: 0 as TeamId, name: '' } );

export const NetId = trait( { sessionId: '' } );

export const Vital = trait( {
    hull: 0,
    shield: 0,
    dead: false,
    protect: 0,
    respawnTimer: 0,
    nextClassId: '',
    kills: 0,
    deaths: 0,
    slot0: 0,
    slot1: 0,
    slot2: 0,
} );

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
    vx: number;
    vy: number;
    vz: number;
}

export const Interp = trait( () => ( { buffer: [] as Snapshot[] } ) );

export const RemotePose = trait( () => ( {
    position: new THREE.Vector3(),
    quaternion: new THREE.Quaternion(),
    velocity: new THREE.Vector3(),
    ready: false,
} ) );
