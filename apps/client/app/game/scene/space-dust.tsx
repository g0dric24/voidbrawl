import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { num } from '../../dev/tuning';
import { viewPose } from '../view-pose';

const BOX = 180;
const MAX_DUST = 6000;

const VERTEX = `
attribute float aEnd;
uniform vec3 uCam;
uniform vec3 uVel;
uniform float uBox;
uniform float uStreak;
varying float vFade;
void main() {
	vec3 p = mod( position - uCam + uBox * 0.5, uBox ) - uBox * 0.5;
	vFade = 1.0 - smoothstep( uBox * 0.3, uBox * 0.5, length( p ) );
	p += uCam - uVel * uStreak * aEnd;
	gl_Position = projectionMatrix * viewMatrix * vec4( p, 1.0 );
}
`;

const FRAGMENT = `
uniform vec3 uColor;
varying float vFade;
void main() {
	gl_FragColor = vec4( uColor * vFade, 1.0 );
}
`;

function dustGeometry(): THREE.BufferGeometry {
    const position = new Float32Array( MAX_DUST * 6 );
    const end = new Float32Array( MAX_DUST * 2 );
    for ( let i = 0; i < MAX_DUST; i++ ) {
        const x = Math.random() * BOX;
        const y = Math.random() * BOX;
        const z = Math.random() * BOX;
        position.set( [ x, y, z, x, y, z ], i * 6 );
        end[ i * 2 + 1 ] = 1;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute( 'position', new THREE.BufferAttribute( position, 3 ) );
    g.setAttribute( 'aEnd', new THREE.BufferAttribute( end, 1 ) );
    return g;
}

export function SpaceDust() {
    const geometry = useMemo( dustGeometry, [] );
    const material = useMemo(
        () =>
            new THREE.ShaderMaterial( {
                vertexShader: VERTEX,
                fragmentShader: FRAGMENT,
                uniforms: {
                    uCam: { value: new THREE.Vector3() },
                    uVel: { value: new THREE.Vector3() },
                    uBox: { value: BOX },
                    uStreak: { value: 0 },
                    uColor: { value: new THREE.Color( 0.55, 0.6, 0.68 ) },
                },
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
        material.uniforms.uVel.value.copy( viewPose.velocity );
        material.uniforms.uStreak.value = num( 'Dust.streak' ) + 0.004;
        geometry.setDrawRange( 0, Math.min( MAX_DUST, num( 'Dust.count' ) ) * 2 );
    } );

    return <lineSegments geometry={ geometry } material={ material } frustumCulled={ false } />;
}
