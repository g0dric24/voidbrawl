import { useFrame } from '@react-three/fiber';
import type { Arena } from '@voidbrawl/shared';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { num } from '../../dev/tuning';
import { MARIGOLD } from '../team-colors';

const VERTEX = `
varying vec3 vDir;
varying vec3 vWorld;
void main() {
	vDir = normalize( position );
	vec4 world = modelMatrix * vec4( position, 1.0 );
	vWorld = world.xyz;
	gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const FRAGMENT = `
uniform vec3 uColor;
uniform vec3 uCam;
uniform float uNear;
uniform float uIdle;
uniform float uGlow;
varying vec3 vDir;
varying vec3 vWorld;
float grid( float v, float n ) {
	float f = abs( fract( v * n ) - 0.5 );
	float w = fwidth( v * n ) * 1.5;
	return 1.0 - smoothstep( 0.0, w, 0.5 - f );
}
void main() {
	float lat = asin( clamp( vDir.y, -1.0, 1.0 ) ) / 3.14159265;
	float lon = atan( vDir.z, vDir.x ) / 6.2831853;
	float lines = max( grid( lat, 12.0 ), grid( lon, 24.0 ) );
	float close = 1.0 - smoothstep( 0.0, uNear, distance( vWorld, uCam ) );
	float a = lines * mix( uIdle, 1.0, close ) + close * close * 0.12;
	gl_FragColor = vec4( uColor * mix( 0.6, uGlow, close ), clamp( a, 0.0, 1.0 ) );
}
`;

export function BoundaryShell( { arena }: { arena: Arena } ) {
    const geometry = useMemo( () => new THREE.SphereGeometry( arena.radius, 128, 64 ), [ arena ] );
    const material = useMemo(
        () =>
            new THREE.ShaderMaterial( {
                vertexShader: VERTEX,
                fragmentShader: FRAGMENT,
                uniforms: {
                    uColor: { value: new THREE.Color( MARIGOLD ) },
                    uCam: { value: new THREE.Vector3() },
                    uNear: { value: 1 },
                    uIdle: { value: 0 },
                    uGlow: { value: 1 },
                },
                side: THREE.BackSide,
                transparent: true,
                depthWrite: false,
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
        material.uniforms.uIdle.value = num( 'Boundary.idle' );
        material.uniforms.uGlow.value = num( 'Boundary.glow' );
    } );

    return <mesh geometry={ geometry } material={ material } frustumCulled={ false } />;
}
