import * as THREE from 'three';

export function glowInstances( geometry: THREE.BufferGeometry, count: number, material?: THREE.Material ) {
    const m = new THREE.InstancedMesh( geometry, material ?? new THREE.MeshBasicMaterial(), count );
    m.setColorAt( 0, new THREE.Color( '#ffffff' ) );
    m.count = 0;
    m.frustumCulled = false;
    return m;
}

export function flushInstances( mesh: THREE.InstancedMesh, count: number ): void {
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    if ( mesh.instanceColor ) mesh.instanceColor.needsUpdate = true;
}
