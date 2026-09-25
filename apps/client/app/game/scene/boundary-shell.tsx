import { useFrame } from '@react-three/fiber';
import type { Arena } from '@voidbrawl/shared';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { num } from '../../dev/tuning';

const SHELL_INSET = 0.5;
const WALL_STEEL = '#c9d4df';

const VERTEX = `
varying vec3 vWorld;
void main() {
	vec4 world = modelMatrix * vec4( position, 1.0 );
	vWorld = world.xyz;
	gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const FRAGMENT = `
uniform vec3 uColor;
uniform vec3 uCam;
uniform float uNear;
uniform float uGlow;
varying vec3 vWorld;
void main() {
	float close = 1.0 - smoothstep( 0.0, uNear, distance( vWorld, uCam ) );
	gl_FragColor = vec4( uColor * uGlow, close * close * 0.45 );
}
`;

export function BoundaryShell( { arena }: { arena: Arena } ) {
    const geometry = useMemo( () => new THREE.SphereGeometry( arena.radius - SHELL_INSET, 128, 64 ), [ arena ] );
    const material = useMemo(
        () =>
            new THREE.ShaderMaterial( {
                vertexShader: VERTEX,
                fragmentShader: FRAGMENT,
                uniforms: {
                    uColor: { value: new THREE.Color( WALL_STEEL ) },
                    uCam: { value: new THREE.Vector3() },
                    uNear: { value: 1 },
                    uGlow: { value: 1 },
                },
                side: THREE.BackSide,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            } ),
        [],
    );

    // JUSTIFIED EFFECT — brackets GPU geometry and material we built ourselves, which R3F does not own.
    useEffect(
        () => () => {
            geometry.dispose();
            material.dispose();
        },
        [ geometry, material ],
    );

    useFrame( ( state ) => {
        material.uniforms.uCam.value.copy( state.camera.position );
        material.uniforms.uNear.value = num( 'Boundary.near' );
        material.uniforms.uGlow.value = num( 'Boundary.glow' );
    } );

    return <mesh geometry={ geometry } material={ material } frustumCulled={ false } />;
}
