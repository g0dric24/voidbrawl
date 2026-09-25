import { useEffect } from 'react';
import type * as THREE from 'three';

export function useDisposeInstanced( meshes: readonly THREE.InstancedMesh[] ): void {
    // JUSTIFIED EFFECT — releases instanced GPU geometry and materials we built ourselves, which R3F does not own.
    useEffect(
        () => () => {
            for ( const m of meshes ) {
                m.geometry.dispose();
                ( m.material as THREE.Material ).dispose();
                m.dispose();
            }
        },
        [ meshes ],
    );
}
