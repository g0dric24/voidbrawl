import * as THREE from 'three';

export const CANVAS_GL = {
    toneMapping: THREE.NeutralToneMapping,
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance',
} as const;

export const CANVAS_CAMERA = { fov: 72, near: 0.3, far: 4000, position: [ 0, 0, 0 ] as [ number, number, number ] };
