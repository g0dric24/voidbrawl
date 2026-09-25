import { useFrame } from '@react-three/fiber';
import { MINE, type TeamId } from '@voidbrawl/shared';
import { Fragment, useMemo } from 'react';
import * as THREE from 'three';
import { session } from '../../net/session';
import { explode } from '../fx/fx-store';
import { TEAM_COLORS } from '../team-colors';
import { flushInstances, glowInstances } from './instanced';
import { useDisposeInstanced } from './use-dispose-instanced';

const MAX_MINES = 96;
const ARMED_GLOW = 4;
const IDLE_GLOW = 0.8;
const PULSE = 5;

interface Seen {
    x: number;
    y: number;
    z: number;
    team: TeamId;
}

const seen = new Map< string, Seen >();
const _o = new THREE.Object3D();
const _c = new THREE.Color();
const _at = new THREE.Vector3();
const ZONE_COLOR = [ 0, 1 ].map( ( t ) => new THREE.Color( TEAM_COLORS[ t as TeamId ] ).multiplyScalar( 0.25 ) );

function place( mesh: THREE.InstancedMesh, i: number, s: Seen, scale: number, color: THREE.Color ): void {
    _o.position.set( s.x, s.y, s.z );
    _o.scale.setScalar( scale );
    _o.updateMatrix();
    mesh.setMatrixAt( i, _o.matrix );
    mesh.setColorAt( i, color );
}

function draw( core: THREE.InstancedMesh, zone: THREE.InstancedMesh, t: number ): void {
    const live = new Set< string >();
    let n = 0;
    session.room?.state?.mines?.forEach( ( m, id ) => {
        live.add( id );
        const s = { x: m.x, y: m.y, z: m.z, team: m.team as TeamId };
        seen.set( id, s );
        if ( n >= MAX_MINES ) return;
        const glow = m.armed ? ARMED_GLOW * ( 0.6 + 0.4 * Math.sin( t * PULSE ) ) : IDLE_GLOW;
        place( core, n, s, 1, _c.set( TEAM_COLORS[ s.team ] ).multiplyScalar( glow ) );
        place( zone, n, s, m.armed ? MINE.trigger : 0.001, ZONE_COLOR[ s.team ] );
        n++;
    } );
    for ( const [ id, s ] of seen ) {
        if ( live.has( id ) ) continue;
        explode( _at.set( s.x, s.y, s.z ), TEAM_COLORS[ s.team ] );
        seen.delete( id );
    }
    flushInstances( core, n );
    flushInstances( zone, n );
}

export function MineField() {
    const meshes = useMemo(
        () => [
            glowInstances( new THREE.IcosahedronGeometry( 2.2, 0 ), MAX_MINES ),
            glowInstances(
                new THREE.IcosahedronGeometry( 1, 1 ),
                MAX_MINES,
                new THREE.MeshBasicMaterial( { wireframe: true, transparent: true, opacity: 0.35 } ),
            ),
        ],
        [],
    );
    useDisposeInstanced( meshes );
    const [ core, zone ] = meshes;

    useFrame( ( state ) => draw( core, zone, state.clock.elapsedTime ) );

    return (
        <Fragment>
            <primitive object={ core } />
            <primitive object={ zone } />
        </Fragment>
    );
}
