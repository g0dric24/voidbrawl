import { Clone, useGLTF } from '@react-three/drei';
import type { ShipClassId } from '@voidbrawl/shared';
import { useMemo } from 'react';
import * as THREE from 'three';
import { guardLfsPointer } from './gltf-lfs-guard';
import { SHIP_VISUALS } from './ship-visuals';

for ( const v of Object.values( SHIP_VISUALS ) ) useGLTF.preload( v.url, undefined, undefined, guardLfsPointer );

export function ShipModel( { classId }: { classId: ShipClassId } ) {
    const v = SHIP_VISUALS[ classId ];
    const { scene } = useGLTF( v.url, undefined, undefined, guardLfsPointer );
    const offset = useMemo( () => {
        const center = new THREE.Box3().setFromObject( scene ).getCenter( new THREE.Vector3() );
        center.applyEuler( new THREE.Euler( ...v.facing ) ).multiplyScalar( -v.scale );
        return center.toArray();
    }, [ scene, v ] );

    return (
        <group position={ offset }>
            <Clone object={ scene } scale={ v.scale } rotation={ v.facing } />
        </group>
    );
}
