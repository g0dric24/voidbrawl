import { useFrame } from '@react-three/fiber';
import { boltPosition } from '@voidbrawl/shared';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { netBolts } from '../../net/bolt-store';
import { serverClock, serverSecondsAt } from '../../net/server-clock';
import { session } from '../../net/session';
import { spark } from '../fx/fx-store';
import { tracers } from '../local-tracers';
import { RENDER_DELAY_MS } from '../remote-interp';
import { TEAM_COLORS } from '../team-colors';

const MAX_BOLTS = 512;
const BOLT_GLOW = 6;
const BOLT_LENGTH = 6;
const BOLT_WIDTH = 0.55;

const _o = new THREE.Object3D();
const _dir = new THREE.Vector3();
const _z = new THREE.Vector3( 0, 0, 1 );
const _p = { x: 0, y: 0, z: 0 };
const _at = new THREE.Vector3();
const _color = new THREE.Color();
const TEAM_GLOW = [ 0, 1 ].map( ( t ) => new THREE.Color( TEAM_COLORS[ t as 0 | 1 ] ).multiplyScalar( BOLT_GLOW ) );

function place(
    mesh: THREE.InstancedMesh,
    i: number,
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
) {
    _o.position.set( x, y, z );
    _o.quaternion.setFromUnitVectors( _z, _dir.set( vx, vy, vz ).normalize() );
    _o.updateMatrix();
    mesh.setMatrixAt( i, _o.matrix );
}

function drawNetBolts( mesh: THREE.InstancedMesh, start: number ): number {
    if ( ! serverClock.synced ) return start;
    const me = session.room?.sessionId;
    const t = serverSecondsAt( serverClock, performance.now() ) - RENDER_DELAY_MS / 1000;
    let i = start;
    for ( const b of netBolts.values() ) {
        if ( b.ownerId === me || t < b.t0 || i >= MAX_BOLTS ) continue;
        if ( t > b.tEnd ) {
            if ( b.struck && ! b.sparked ) {
                b.sparked = true;
                const p = boltPosition( b, b.tEnd, _p );
                spark( _at.set( p.x, p.y, p.z ), TEAM_COLORS[ b.team ] );
            }
            continue;
        }
        const p = boltPosition( b, t, _p );
        place( mesh, i, p.x, p.y, p.z, b.vx, b.vy, b.vz );
        mesh.setColorAt( i, TEAM_GLOW[ b.team ] );
        i++;
    }
    return i;
}

function drawTracers( mesh: THREE.InstancedMesh, start: number ): number {
    let i = start;
    for ( const tr of tracers ) {
        if ( i >= MAX_BOLTS ) break;
        const p = boltPosition( tr.launch, tr.age, _p );
        place( mesh, i, p.x, p.y, p.z, tr.launch.vx, tr.launch.vy, tr.launch.vz );
        mesh.setColorAt( i, _color.set( tr.color ).multiplyScalar( BOLT_GLOW ) );
        i++;
    }
    return i;
}

export function BoltField() {
    const mesh = useMemo( () => {
        const geometry = new THREE.BoxGeometry( BOLT_WIDTH, BOLT_WIDTH, BOLT_LENGTH );
        const material = new THREE.MeshBasicMaterial();
        const m = new THREE.InstancedMesh( geometry, material, MAX_BOLTS );
        m.setColorAt( 0, _color.set( '#ffffff' ) );
        m.count = 0;
        m.frustumCulled = false;
        return m;
    }, [] );

    // JUSTIFIED EFFECT — brackets GPU geometry and material we built ourselves, which R3F does not own.
    useEffect(
        () => () => {
            mesh.geometry.dispose();
            ( mesh.material as THREE.Material ).dispose();
            mesh.dispose();
        },
        [ mesh ],
    );

    useFrame( () => {
        const count = drawTracers( mesh, drawNetBolts( mesh, 0 ) );
        mesh.count = count;
        mesh.instanceMatrix.needsUpdate = true;
        if ( mesh.instanceColor ) mesh.instanceColor.needsUpdate = true;
    } );

    return <primitive object={ mesh } />;
}
