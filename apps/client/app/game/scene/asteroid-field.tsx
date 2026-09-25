import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Arena } from '@voidbrawl/shared';
import { Fragment, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { col, num } from '../../dev/tuning';
import { buildAsteroidMeshes } from './asteroid-meshes';
import { NEBULA_LIGHT } from './nebula-baker';
import { prefersReducedMotion } from './reduced-motion';
import { packRockSurface, patchRock, prepareRockNormal, rockUniforms } from './rock-surface';

const ROCK_TEXTURES = [
    '/textures/dark-rock-diff.jpg',
    '/textures/dark-rock-arm.jpg',
    '/textures/dark-rock-normal.jpg',
];

export function AsteroidField( { arena }: { arena: Arena } ) {
    const [ diffuse, arm, normal ] = useTexture( ROCK_TEXTURES );
    const surface = useMemo(
        () => packRockSurface( diffuse.image as HTMLImageElement, arm.image as HTMLImageElement ),
        [ diffuse, arm ],
    );
    const uniforms = useMemo( () => rockUniforms( surface, prepareRockNormal( normal ) ), [ surface, normal ] );
    const material = useMemo( () => {
        const m = new THREE.MeshStandardMaterial( { metalness: 0, roughness: 1 } );
        patchRock( m, uniforms );
        return m;
    }, [ uniforms ] );
    const meshes = useMemo( () => buildAsteroidMeshes( arena.asteroids, material ), [ arena, material ] );
    const color = useRef( '' );
    const still = useMemo( prefersReducedMotion, [] );

    // JUSTIFIED EFFECT — brackets the lifetime of GPU textures, materials and geometry we built ourselves.
    useEffect(
        () => () => {
            surface.dispose();
            material.dispose();
            for ( const m of meshes ) {
                m.geometry.dispose();
                m.dispose();
            }
        },
        [ surface, material, meshes ],
    );

    useFrame( ( state ) => {
        uniforms.uRockTime.value = still ? 0 : state.clock.elapsedTime;
        uniforms.uRockSpin.value = num( 'Rock.spin' );
        uniforms.uRockTexScale.value = num( 'Rock.textureScale' );
        uniforms.uRockNormalScale.value = num( 'Rock.normalScale' );
        uniforms.uRockRough.value = num( 'Rock.roughness' );
        uniforms.uRockDetail.value = num( 'Rock.detail' );
        uniforms.uRockKeyDir.value.copy( NEBULA_LIGHT.direction ).normalize();
        uniforms.uRockKeyColor.value.copy( NEBULA_LIGHT.color ).multiplyScalar( num( 'Sky.keyLight' ) );
        material.envMapIntensity = num( 'Sky.environment' );
        const rock = col( 'Rock.color' );
        if ( rock !== color.current ) {
            color.current = rock;
            uniforms.uRockColor.value.set( rock );
        }
    } );

    return (
        <Fragment>
            { meshes.map( ( m ) => (
                <primitive key={ m.uuid } object={ m } />
            ) ) }
        </Fragment>
    );
}
