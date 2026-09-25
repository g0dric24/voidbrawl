import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

const BEACON_PX = 7;
const BEACON_GLOW = 3;

export function WingBeacons( { span, color }: { span: number; color: string } ) {
    const points = useMemo( () => {
        const g = new THREE.BufferGeometry();
        g.setAttribute( 'position', new THREE.Float32BufferAttribute( [ span, 0, 0, -span, 0, 0 ], 3 ) );
        const m = new THREE.PointsMaterial( {
            color: new THREE.Color( color ).multiplyScalar( BEACON_GLOW ),
            size: BEACON_PX,
            sizeAttenuation: false,
            depthWrite: false,
        } );
        return new THREE.Points( g, m );
    }, [ span, color ] );

    // JUSTIFIED EFFECT — brackets GPU geometry and material we built ourselves, which R3F does not own.
    useEffect(
        () => () => {
            points.geometry.dispose();
            ( points.material as THREE.Material ).dispose();
        },
        [ points ],
    );

    return <primitive object={ points } />;
}
