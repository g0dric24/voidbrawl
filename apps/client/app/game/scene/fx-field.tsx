import { useFrame, useLoader } from '@react-three/fiber';
import { Fragment, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { MAX_PARTICLES, particles, type Sprite } from '../fx/fx-store';

const GLOW = 1.8;
const SPRITE_URLS = [ '/textures/fx/glow.png', '/textures/fx/smoke.png', '/textures/fx/fire.png' ];
const ADDITIVE = [ true, false, true ];

const VERTEX = `
attribute float aSize;
attribute vec4 aColor;
varying vec4 vColor;
void main() {
	vec4 mv = modelViewMatrix * vec4( position, 1.0 );
	vColor = vec4( aColor.rgb, aColor.a * smoothstep( 6.0, 24.0, -mv.z ) );
	gl_PointSize = min( aSize * 600.0 / max( -mv.z, 0.001 ), 220.0 );
	gl_Position = projectionMatrix * mv;
}
`;

const FRAGMENT = `
uniform sampler2D uMap;
uniform float uAdditive;
varying vec4 vColor;
void main() {
	float a = texture2D( uMap, gl_PointCoord ).a;
	if ( uAdditive > 0.5 ) gl_FragColor = vec4( vColor.rgb * a * vColor.a, 1.0 );
	else gl_FragColor = vec4( vColor.rgb, a * vColor.a );
}
`;

interface Cloud {
    points: THREE.Points;
    position: THREE.BufferAttribute;
    color: THREE.BufferAttribute;
    size: THREE.BufferAttribute;
    count: number;
}

function makeCloud( map: THREE.Texture, additive: boolean ): Cloud {
    const geometry = new THREE.BufferGeometry();
    const position = new THREE.BufferAttribute( new Float32Array( MAX_PARTICLES * 3 ), 3 );
    const color = new THREE.BufferAttribute( new Float32Array( MAX_PARTICLES * 4 ), 4 );
    const size = new THREE.BufferAttribute( new Float32Array( MAX_PARTICLES ), 1 );
    for ( const a of [ position, color, size ] ) a.setUsage( THREE.DynamicDrawUsage );
    geometry.setAttribute( 'position', position );
    geometry.setAttribute( 'aColor', color );
    geometry.setAttribute( 'aSize', size );
    const material = new THREE.ShaderMaterial( {
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms: { uMap: { value: map }, uAdditive: { value: additive ? 1 : 0 } },
        transparent: true,
        depthWrite: false,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    } );
    const points = new THREE.Points( geometry, material );
    points.frustumCulled = false;
    return { points, position, color, size, count: 0 };
}

function fill( clouds: Cloud[] ): void {
    for ( const c of clouds ) c.count = 0;
    for ( const p of particles ) {
        const c = clouds[ p.sprite as Sprite ];
        const i = c.count++;
        const fade = 1 - p.age / p.life;
        const gain = ADDITIVE[ p.sprite ] ? GLOW : 1;
        c.position.setXYZ( i, p.position.x, p.position.y, p.position.z );
        c.color.setXYZW( i, p.color.r * gain, p.color.g * gain, p.color.b * gain, fade );
        c.size.setX( i, p.size * ( ADDITIVE[ p.sprite ] ? 0.5 + fade * 0.5 : 1.6 - fade * 0.6 ) );
    }
    for ( const c of clouds ) {
        c.points.geometry.setDrawRange( 0, c.count );
        c.position.needsUpdate = true;
        c.color.needsUpdate = true;
        c.size.needsUpdate = true;
    }
}

export function FxField() {
    const maps = useLoader( THREE.TextureLoader, SPRITE_URLS );
    const clouds = useMemo( () => maps.map( ( m, i ) => makeCloud( m, ADDITIVE[ i ] ) ), [ maps ] );

    // JUSTIFIED EFFECT — brackets GPU geometry and material we built ourselves, which R3F does not own.
    useEffect(
        () => () => {
            for ( const c of clouds ) {
                c.points.geometry.dispose();
                ( c.points.material as THREE.Material ).dispose();
            }
        },
        [ clouds ],
    );

    useFrame( () => fill( clouds ) );

    return (
        <Fragment>
            { clouds.map( ( c, i ) => (
                <primitive key={ SPRITE_URLS[ i ] } object={ c.points } />
            ) ) }
        </Fragment>
    );
}
