import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { ShipClassId } from '@voidbrawl/shared';
import { useMemo } from 'react';
import * as THREE from 'three';
import { num } from '../../dev/tuning';
import { guardLfsPointer } from './gltf-lfs-guard';
import { rimmedClone, rimUniforms } from './ship-rim';
import { SHIP_VISUALS } from './ship-visuals';
import { useDisposeMaterials } from './use-dispose-materials';

for ( const v of Object.values( SHIP_VISUALS ) ) useGLTF.preload( v.url, undefined, undefined, guardLfsPointer );

export function ShipModel( { classId, glow }: { classId: ShipClassId; glow: string } ) {
    const v = SHIP_VISUALS[ classId ];
    const { scene } = useGLTF( v.url, undefined, undefined, guardLfsPointer );
    const uniforms = useMemo( () => rimUniforms( glow ), [ glow ] );
    const model = useMemo( () => rimmedClone( scene, uniforms ), [ scene, uniforms ] );
    const offset = useMemo( () => {
        const center = new THREE.Box3().setFromObject( scene ).getCenter( new THREE.Vector3() );
        center.applyEuler( new THREE.Euler( ...v.facing ) ).multiplyScalar( -v.scale );
        return center.toArray();
    }, [ scene, v ] );

    useDisposeMaterials( model );

    useFrame( () => {
        uniforms.uRimPower.value = num( 'Ship.rimPower' );
        uniforms.uRimStrength.value = num( 'Ship.rimStrength' );
    } );

    return (
        <group position={ offset }>
            <primitive object={ model } scale={ v.scale } rotation={ v.facing } />
        </group>
    );
}
