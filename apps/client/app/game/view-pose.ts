import * as THREE from 'three';

export const viewPose = {
    position: new THREE.Vector3(),
    quaternion: new THREE.Quaternion(),
    forward: new THREE.Vector3( 0, 0, 1 ),
    up: new THREE.Vector3( 0, 1, 0 ),
    velocity: new THREE.Vector3(),
    speed: 0,
    boost: 1,
    boostShare: 0,
    outside: false,
    edgeDistance: 0,
    impact: 0,
    classId: 'fighter' as string,
};
