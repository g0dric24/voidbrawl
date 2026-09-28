import { useFrame } from '@react-three/fiber';
import type { TeamId } from '@voidbrawl/shared';
import { useMemo } from 'react';
import * as THREE from 'three';
import { session } from '../../net/session';
import { blast, smoke } from '../fx/fx-store';
import { SEEKER_COLOR } from '../team-colors';
import { flushInstances, glowInstances } from './instanced';
import { useDisposeInstanced } from './use-dispose-instanced';

const MAX_MISSILES = 64;
const MAX_LEAD = 0.12;
const GLOW = 5;
const BURST_RADIUS = 14;

interface Track {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    at: number;
    team: TeamId;
}

const tracks = new Map< string, Track >();
const _o = new THREE.Object3D();
const _z = new THREE.Vector3( 0, 0, 1 );
const _v = new THREE.Vector3();
const _p = new THREE.Vector3();
const COLOR = new THREE.Color( SEEKER_COLOR ).multiplyScalar( GLOW );

function sync( now: number ): Set< string > {
    const live = new Set< string >();
    session.room?.state?.missiles?.forEach( ( m, id ) => {
        live.add( id );
        const t = tracks.get( id );
        if ( t && t.x === m.x && t.y === m.y && t.z === m.z ) return;
        tracks.set( id, { x: m.x, y: m.y, z: m.z, vx: m.vx, vy: m.vy, vz: m.vz, at: now, team: m.team as TeamId } );
    } );
    return live;
}

function where( t: Track, now: number ): THREE.Vector3 {
    const lead = Math.min( MAX_LEAD, ( now - t.at ) / 1000 );
    return _p.set( t.x + t.vx * lead, t.y + t.vy * lead, t.z + t.vz * lead );
}

function draw( mesh: THREE.InstancedMesh ): void {
    const now = performance.now();
    const live = sync( now );
    let n = 0;
    for ( const [ id, t ] of tracks ) {
        const at = where( t, now );
        if ( ! live.has( id ) ) {
            blast( at, SEEKER_COLOR, BURST_RADIUS );
            tracks.delete( id );
            continue;
        }
        if ( n >= MAX_MISSILES ) continue;
        smoke( at );
        _o.position.copy( at );
        _o.quaternion.setFromUnitVectors( _z, _v.set( t.vx, t.vy, t.vz ).normalize() );
        _o.updateMatrix();
        mesh.setMatrixAt( n, _o.matrix );
        mesh.setColorAt( n, COLOR );
        n++;
    }
    flushInstances( mesh, n );
}

export function MissileField() {
    const meshes = useMemo(
        () => [ glowInstances( new THREE.ConeGeometry( 1.1, 5, 6 ).rotateX( Math.PI / 2 ), MAX_MISSILES ) ],
        [],
    );
    useDisposeInstanced( meshes );
    const [ mesh ] = meshes;

    useFrame( () => draw( mesh ) );

    return <primitive object={ mesh } />;
}
