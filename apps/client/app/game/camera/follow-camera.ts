import { SHIP_CLASSES } from '@voidbrawl/shared';
import * as THREE from 'three';
import { num } from '../../dev/tuning';
import { sceneCamera } from '../scene-camera';
import { viewPose } from '../view-pose';

const WALL_MARGIN = 2;

const _offset = new THREE.Vector3();
const _target = new THREE.Vector3();
const _desired = new THREE.Vector3();

export function keepInside( position: THREE.Vector3, radius: number ): void {
    const max = radius - WALL_MARGIN;
    if ( position.lengthSq() > max * max ) position.setLength( max );
}

export function cameraScale( hitRadius: number ): number {
    return hitRadius / SHIP_CLASSES.fighter.hitRadius;
}

export function updateFollowCamera(
    camera: THREE.PerspectiveCamera,
    delta: number,
    arenaRadius: number,
    scale: number,
): void {
    sceneCamera.current = camera;
    const pose = viewPose;
    _offset.set( 0, num( 'Camera.height' ) * scale, -num( 'Camera.back' ) * scale ).applyQuaternion( pose.quaternion );
    _desired.copy( pose.position ).add( _offset );
    const follow = num( 'Camera.follow' );
    if ( follow > 0 ) camera.position.lerp( _desired, 1 - Math.exp( -follow * delta ) );
    else camera.position.copy( _desired );
    keepInside( camera.position, arenaRadius );
    _target.copy( pose.position ).addScaledVector( pose.forward, num( 'Camera.aim' ) );
    camera.up.copy( pose.up );
    camera.lookAt( _target );
    const fov = num( 'Camera.fov' ) + num( 'Camera.boostFov' ) * pose.boostShare;
    if ( Math.abs( camera.fov - fov ) > 0.01 ) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
    }
}
