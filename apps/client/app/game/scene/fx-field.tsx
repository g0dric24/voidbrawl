import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { MAX_PARTICLES, particles } from '../fx/fx-store';

const GLOW = 3;

const VERTEX = `
attribute float aSize;
attribute vec3 aColor;
varying vec3 vColor;
void main() {
	vColor = aColor;
	vec4 mv = modelViewMatrix * vec4( position, 1.0 );
	gl_PointSize = aSize * 600.0 / -mv.z;
	gl_Position = projectionMatrix * mv;
}
`;

const FRAGMENT = `
varying vec3 vColor;
void main() {
	float d = length( gl_PointCoord - 0.5 ) * 2.0;
	float a = 1.0 - smoothstep( 0.2, 1.0, d );
	gl_FragColor = vec4( vColor * a, 1.0 );
}
`;

export function FxField() {
    const { points, position, color, size } = useMemo( () => {
        const geometry = new THREE.BufferGeometry();
        const position = new THREE.BufferAttribute( new Float32Array( MAX_PARTICLES * 3 ), 3 );
        const color = new THREE.BufferAttribute( new Float32Array( MAX_PARTICLES * 3 ), 3 );
        const size = new THREE.BufferAttribute( new Float32Array( MAX_PARTICLES ), 1 );
        for ( const a of [ position, color, size ] ) a.setUsage( THREE.DynamicDrawUsage );
        geometry.setAttribute( 'position', position );
        geometry.setAttribute( 'aColor', color );
        geometry.setAttribute( 'aSize', size );
        const material = new THREE.ShaderMaterial( {
            vertexShader: VERTEX,
            fragmentShader: FRAGMENT,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        } );
        const points = new THREE.Points( geometry, material );
        points.frustumCulled = false;
        return { points, position, color, size };
    }, [] );

    // JUSTIFIED EFFECT — brackets GPU geometry and material we built ourselves, which R3F does not own.
    useEffect(
        () => () => {
            points.geometry.dispose();
            ( points.material as THREE.Material ).dispose();
        },
        [ points ],
    );

    useFrame( () => {
        const n = particles.length;
        for ( let i = 0; i < n; i++ ) {
            const p = particles[ i ];
            const fade = 1 - p.age / p.life;
            position.setXYZ( i, p.position.x, p.position.y, p.position.z );
            color.setXYZ( i, p.color.r * GLOW * fade, p.color.g * GLOW * fade, p.color.b * GLOW * fade );
            size.setX( i, p.size * ( 0.5 + fade * 0.5 ) );
        }
        points.geometry.setDrawRange( 0, n );
        position.needsUpdate = true;
        color.needsUpdate = true;
        size.needsUpdate = true;
    } );

    return <primitive object={ points } />;
}
