import * as THREE from 'three';
import { num } from '../../dev/tuning';
import { viewPose } from '../view-pose';

const WALL_MARGIN = 2;

const _offset = new THREE.Vector3();
const _target = new THREE.Vector3();
const _desired = new THREE.Vector3();

export function keepInside( position: THREE.Vector3, radius: number ): void {
    const max = radius - WALL_MARGIN;
    if ( position.lengthSq() > max * max ) position.setLength( max );
}

export function updateFollowCamera( camera: THREE.PerspectiveCamera, delta: number, arenaRadius: number ): void {
    const pose = viewPose;
    _offset.set( 0, num( 'Camera.height' ), -num( 'Camera.back' ) ).applyQuaternion( pose.quaternion );
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
