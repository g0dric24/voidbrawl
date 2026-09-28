import { useFrame, useLoader } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { MAX_SHOCKWAVES, shockwaves } from '../fx/fx-store';
import { flushInstances, glowInstances } from './instanced';
import { useDisposeInstanced } from './use-dispose-instanced';

const GLOW = 3;
const RING_URL = '/textures/fx/ring.png';

const _o = new THREE.Object3D();
const _c = new THREE.Color();

function draw( mesh: THREE.InstancedMesh, camera: THREE.Camera ): void {
    let n = 0;
    for ( const s of shockwaves ) {
        const t = s.age / s.life;
        const ease = 1 - ( 1 - t ) * ( 1 - t );
        _o.position.copy( s.position );
        _o.quaternion.copy( camera.quaternion );
        _o.scale.setScalar( Math.max( 0.01, s.radius * ease ) );
        _o.updateMatrix();
        mesh.setMatrixAt( n, _o.matrix );
        mesh.setColorAt( n, _c.copy( s.color ).multiplyScalar( GLOW * ( 1 - t ) ) );
        n++;
    }
    flushInstances( mesh, n );
}

export function ShockwaveField() {
    const ring = useLoader( THREE.TextureLoader, RING_URL );
    const meshes = useMemo(
        () => [
            glowInstances(
                new THREE.PlaneGeometry( 2.2, 2.2 ),
                MAX_SHOCKWAVES,
                new THREE.MeshBasicMaterial( {
                    map: ring,
                    transparent: true,
                    depthWrite: false,
                    blending: THREE.AdditiveBlending,
                    side: THREE.DoubleSide,
                } ),
            ),
        ],
        [ ring ],
    );
    useDisposeInstanced( meshes );
    const [ mesh ] = meshes;

    useFrame( ( state ) => draw( mesh, state.camera ) );

    return <primitive object={ mesh } />;
}
