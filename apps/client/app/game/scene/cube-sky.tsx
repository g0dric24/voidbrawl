import { useLoader } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

const FACES = [ 'px', 'nx', 'py', 'ny', 'pz', 'nz' ].map( ( f ) => `/textures/sky/blue/${ f }.jpg` );
const BRIGHTNESS = 0.9;

const VERTEX = `
varying vec3 vDir;
void main() {
    vDir = normalize( position );
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

const FRAGMENT = `
uniform samplerCube uSky;
uniform float uBrightness;
varying vec3 vDir;
void main() {
    vec3 c = textureCube( uSky, vDir ).rgb * uBrightness;
    gl_FragColor = vec4( c, 1.0 );
    #include <colorspace_fragment>
}
`;

export function CubeSky( { radius }: { radius: number } ) {
    const [ cube ] = useLoader( THREE.CubeTextureLoader, [ FACES ] );
    const mesh = useMemo( () => {
        cube.colorSpace = THREE.SRGBColorSpace;
        const material = new THREE.ShaderMaterial( {
            vertexShader: VERTEX,
            fragmentShader: FRAGMENT,
            uniforms: { uSky: { value: cube }, uBrightness: { value: BRIGHTNESS } },
            side: THREE.BackSide,
            depthWrite: false,
        } );
        const m = new THREE.Mesh( new THREE.SphereGeometry( 1, 64, 32 ), material );
        m.scale.setScalar( radius );
        m.frustumCulled = false;
        m.renderOrder = -1000;
        return m;
    }, [ cube, radius ] );

    // JUSTIFIED EFFECT — releases the sky dome's GPU geometry and material, which R3F does not own.
    useEffect(
        () => () => {
            mesh.geometry.dispose();
            ( mesh.material as THREE.Material ).dispose();
        },
        [ mesh ],
    );

    return <primitive object={ mesh } />;
}
