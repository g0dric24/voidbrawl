import { getStateCallbacks, type Room } from '@colyseus/sdk';
import {
    HIT_MESSAGE,
    type HitMessage,
    KILL_MESSAGE,
    type KillMessage,
    type MatchState,
    type TeamId,
} from '@voidbrawl/shared';
import type { Entity } from 'koota';
import * as THREE from 'three';
import { RemotePose } from '../game/ecs/traits';
import { explode, feedback, spark } from '../game/fx/fx-store';
import { clearFeed, pushFeed } from '../game/fx/kill-feed';
import { dropTracersNear } from '../game/local-tracers';
import { TEAM_COLORS } from '../game/team-colors';
import { viewPose } from '../game/view-pose';
import { netBolts } from './bolt-store';
import { resetClock, sampleServerTime, serverClock } from './server-clock';

const _at = new THREE.Vector3();

function nameOf( room: Room< MatchState >, id: string ): string {
    return room.state.players.get( id )?.name ?? 'Pilot';
}

function teamColor( room: Room< MatchState >, id: string ): string {
    return TEAM_COLORS[ ( room.state.players.get( id )?.team ?? 0 ) as TeamId ];
}

function killText( room: Room< MatchState >, m: KillMessage ): string {
    const victim = nameOf( room, m.victimId );
    if ( m.cause === 'bolt' ) return `${ nameOf( room, m.killerId ) } destroyed ${ victim }`;
    return m.cause === 'crash' ? `${ victim } crashed` : `${ victim } self-destructed`;
}

export function attachCombat( room: Room< MatchState >, entityOf: ( sessionId: string ) => Entity | undefined ) {
    const $ = getStateCallbacks( room );
    const perBolt = new Map< string, () => void >();

    const offTime = $( room.state ).listen( 'time', ( t ) => sampleServerTime( serverClock, t, performance.now() ) );

    const offBoltAdd = $( room.state ).bolts.onAdd( ( b, id ) => {
        netBolts.set( id, {
            x0: b.x0,
            y0: b.y0,
            z0: b.z0,
            vx: b.vx,
            vy: b.vy,
            vz: b.vz,
            t0: b.t0,
            ownerId: b.ownerId,
            team: b.team as TeamId,
            tEnd: b.tEnd,
            struck: b.struck,
            sparked: false,
        } );
        perBolt.set(
            id,
            $( b ).onChange( () => {
                const nb = netBolts.get( id );
                if ( ! nb ) return;
                nb.tEnd = b.tEnd;
                nb.struck = b.struck;
            } ),
        );
    } );

    const offBoltRemove = $( room.state ).bolts.onRemove( ( _b, id ) => {
        perBolt.get( id )?.();
        perBolt.delete( id );
        netBolts.delete( id );
    } );

    const offHit = room.onMessage( HIT_MESSAGE, ( m: HitMessage ) => {
        const now = performance.now();
        if ( m.shooterId === room.sessionId ) {
            feedback.hitMarkerAt = now;
            dropTracersNear( m.x, m.y, m.z );
            spark( _at.set( m.x, m.y, m.z ), teamColor( room, m.shooterId ) );
        }
        if ( m.victimId === room.sessionId ) feedback.damageAt = now;
    } );

    const offKill = room.onMessage( KILL_MESSAGE, ( m: KillMessage ) => {
        const color = teamColor( room, m.victimId );
        if ( m.victimId === room.sessionId ) explode( _at.copy( viewPose.position ), color );
        else {
            const pose = entityOf( m.victimId )?.get( RemotePose );
            if ( pose ) explode( _at.copy( pose.position ), color );
        }
        pushFeed( killText( room, m ) );
    } );

    return () => {
        offTime();
        offBoltAdd();
        offBoltRemove();
        offHit();
        offKill();
        for ( const off of perBolt.values() ) off();
        perBolt.clear();
        netBolts.clear();
        resetClock( serverClock );
        clearFeed();
    };
}
