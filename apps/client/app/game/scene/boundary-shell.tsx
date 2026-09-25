import { useFrame } from '@react-three/fiber';
import type { Arena } from '@voidbrawl/shared';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { MARIGOLD } from '../team-colors';

const WARN_BAND = 90;
const IDLE_ALPHA = 0;

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
varying vec3 vDir;
varying vec3 vWorld;
float grid( float v, float n ) {
	float f = abs( fract( v * n ) - 0.5 );
	float w = fwidth( v * n ) * 1.2;
	return 1.0 - smoothstep( 0.0, w, 0.5 - f );
}
void main() {
	float lat = asin( clamp( vDir.y, -1.0, 1.0 ) ) / 3.14159265;
	float lon = atan( vDir.z, vDir.x ) / 6.2831853;
	float lines = max( grid( lat, 18.0 ), grid( lon, 36.0 ) );
	float close = 1.0 - smoothstep( 0.0, uNear, distance( vWorld, uCam ) );
	float a = lines * max( uIdle, close * 0.9 );
	gl_FragColor = vec4( uColor * 2.0, a );
}
`;

export function BoundaryShell( { arena }: { arena: Arena } ) {
    const geometry = useMemo( () => new THREE.SphereGeometry( arena.radius, 96, 48 ), [ arena ] );
    const material = useMemo(
        () =>
            new THREE.ShaderMaterial( {
                vertexShader: VERTEX,
                fragmentShader: FRAGMENT,
                uniforms: {
                    uColor: { value: new THREE.Color( MARIGOLD ) },
                    uCam: { value: new THREE.Vector3() },
                    uNear: { value: WARN_BAND },
                    uIdle: { value: IDLE_ALPHA },
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
    } );

    return <mesh geometry={ geometry } material={ material } frustumCulled={ false } />;
}
