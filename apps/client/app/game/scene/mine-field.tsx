import { useFrame } from '@react-three/fiber';
import { MINE, type TeamId } from '@voidbrawl/shared';
import { useMemo } from 'react';
import * as THREE from 'three';
import { playSfxAt } from '../../audio/sfx-map';
import { session } from '../../net/session';
import { blast } from '../fx/fx-store';
import { MINE_COLOR, TEAM_COLORS } from '../team-colors';
import { viewPose } from '../view-pose';
import { flushInstances, glowInstances } from './instanced';
import { useDisposeInstanced } from './use-dispose-instanced';

const MAX_MINES = 96;
const BODY_GLOW = 0.35;
const FLASH_GLOW = 7;
const FLASH_SCALE = 1.6;
const FLASH_SECONDS = 0.07;
const SLOWEST_TICK = 0.9;
const FASTEST_TICK = 0.1;
const TICK_REACH = 160;

interface Seen {
    x: number;
    y: number;
    z: number;
    team: TeamId;
    born: number;
    nextTick: number;
    flashEnd: number;
}

const seen = new Map< string, Seen >();
const _o = new THREE.Object3D();
const _c = new THREE.Color();
const _at = new THREE.Vector3();

function tickGap( age: number ): number {
    const left = Math.max( 0, 1 - age / MINE.fuse );
    return FASTEST_TICK + ( SLOWEST_TICK - FASTEST_TICK ) * left * left;
}

function track( id: string, m: { x: number; y: number; z: number; team: number }, now: number ): Seen {
    const known = seen.get( id );
    if ( known ) return known;
    const s = { x: m.x, y: m.y, z: m.z, team: m.team as TeamId, born: now, nextTick: 0, flashEnd: -1 };
    seen.set( id, s );
    return s;
}

function flashing( s: Seen, now: number ): boolean {
    const age = ( now - s.born ) / 1000;
    if ( age >= s.nextTick ) {
        s.flashEnd = age + FLASH_SECONDS;
        s.nextTick = age + tickGap( age );
        if ( viewPose.position.distanceToSquared( _at.set( s.x, s.y, s.z ) ) < TICK_REACH * TICK_REACH ) {
            playSfxAt( 'tick', s );
        }
    }
    return age < s.flashEnd;
}

function place( mesh: THREE.InstancedMesh, i: number, s: Seen, lit: boolean ): void {
    _o.position.set( s.x, s.y, s.z );
    _o.scale.setScalar( lit ? FLASH_SCALE : 1 );
    _o.updateMatrix();
    mesh.setMatrixAt( i, _o.matrix );
    mesh.setColorAt(
        i,
        _c.set( lit ? MINE_COLOR : TEAM_COLORS[ s.team ] ).multiplyScalar( lit ? FLASH_GLOW : BODY_GLOW ),
    );
}

function draw( mesh: THREE.InstancedMesh ): void {
    const now = performance.now();
    const live = new Set< string >();
    let n = 0;
    session.room?.state?.mines?.forEach( ( m, id ) => {
        live.add( id );
        const s = track( id, m, now );
        if ( n >= MAX_MINES ) return;
        place( mesh, n, s, flashing( s, now ) );
        n++;
    } );
    for ( const [ id, s ] of seen ) {
        if ( live.has( id ) ) continue;
        blast( _at.set( s.x, s.y, s.z ), MINE_COLOR, MINE.blast );
        seen.delete( id );
    }
    flushInstances( mesh, n );
}

export function MineField() {
    const meshes = useMemo( () => [ glowInstances( new THREE.IcosahedronGeometry( 1.2, 0 ), MAX_MINES ) ], [] );
    useDisposeInstanced( meshes );
    const [ mesh ] = meshes;

    useFrame( () => draw( mesh ) );

    return <primitive object={ mesh } />;
}
