import { useEffect } from 'react';
import type * as THREE from 'three';
import { disposeMaterials } from './ship-rim';

export function useDisposeMaterials( root: THREE.Object3D ): void {
    // JUSTIFIED EFFECT — releases per-ship material clones, GPU resources R3F does not own.
    useEffect( () => () => disposeMaterials( root ), [ root ] );
}
