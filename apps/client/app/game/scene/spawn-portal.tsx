import { useFrame, useLoader } from '@react-three/fiber';
import type { Base } from '@voidbrawl/shared';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { TEAM_COLORS } from '../team-colors';

const PORTAL_RADIUS = 60;
const PORTAL_BEHIND = 50;
const FRAME_TUBE = 5;
const TRIM_TUBE = 1.1;
const PYLONS = 6;
const SPIN = 0.25;
const RING_URL = '/textures/fx/ring.png';

const HULL = '#141D26';

export function SpawnPortal( { base }: { base: Base } ) {
    const disk = useRef< THREE.Mesh >( null );
    const ring = useLoader( THREE.TextureLoader, RING_URL );
    const color = TEAM_COLORS[ base.team ];
    const behind = base.team === 0 ? -PORTAL_BEHIND : PORTAL_BEHIND;
    const pylons = useMemo(
        () =>
            Array.from( { length: PYLONS }, ( _, i ) => {
                const a = ( i / PYLONS ) * Math.PI * 2;
                return { key: i, x: Math.cos( a ) * PORTAL_RADIUS, y: Math.sin( a ) * PORTAL_RADIUS, rot: a };
            } ),
        [],
    );

    useFrame( ( _, delta ) => {
        if ( disk.current ) disk.current.rotation.z += SPIN * delta;
    } );

    return (
        <group position={ [ base.center.x, base.center.y, base.center.z + behind ] }>
            <mesh>
                <torusGeometry args={ [ PORTAL_RADIUS, FRAME_TUBE, 4, PYLONS ] } />
                <meshStandardMaterial color={ HULL } metalness={ 0.6 } roughness={ 0.45 } />
            </mesh>
            <mesh position={ [ 0, 0, base.team === 0 ? FRAME_TUBE : -FRAME_TUBE ] }>
                <torusGeometry args={ [ PORTAL_RADIUS - 1, TRIM_TUBE, 6, PYLONS * 8 ] } />
                <meshStandardMaterial color={ HULL } emissive={ color } emissiveIntensity={ 2.4 } />
            </mesh>
            { pylons.map( ( p ) => (
                <group key={ p.key } position={ [ p.x, p.y, 0 ] } rotation={ [ 0, 0, p.rot ] }>
                    <mesh position={ [ 7, 0, 0 ] }>
                        <boxGeometry args={ [ 16, 7, 14 ] } />
                        <meshStandardMaterial color={ HULL } metalness={ 0.6 } roughness={ 0.45 } />
                    </mesh>
                    <mesh position={ [ 15.5, 0, 0 ] }>
                        <boxGeometry args={ [ 1.5, 5, 10 ] } />
                        <meshStandardMaterial color={ HULL } emissive={ color } emissiveIntensity={ 2.4 } />
                    </mesh>
                </group>
            ) ) }
            <mesh ref={ disk }>
                <circleGeometry args={ [ PORTAL_RADIUS - FRAME_TUBE, 48 ] } />
                <meshBasicMaterial
                    map={ ring }
                    color={ color }
                    transparent
                    opacity={ 0.35 }
                    depthWrite={ false }
                    blending={ THREE.AdditiveBlending }
                    side={ THREE.DoubleSide }
                />
            </mesh>
        </group>
    );
}
