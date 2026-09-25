import { getStateCallbacks, type Room } from '@colyseus/sdk';
import {
    type Arena,
    classOf,
    copyShip,
    INPUT_MESSAGE,
    type MatchState,
    type PlayerState,
    type TeamId,
} from '@voidbrawl/shared';
import type { Entity, World } from 'koota';
import { Interp, LocalPlayer, NetId, Pilot, Prev, Remote, RemotePose, Sim, Vital } from '../game/ecs/traits';
import { capturePrev } from '../game/pose-from-sim';
import { pushSnapshot } from '../game/remote-interp';
import { attachCombat } from './attach-combat';
import type { Predictor } from './prediction';
import { setRoster } from './roster-store';

const INPUT_SEND_MS = 1000 / 30;

function vitalOf( p: PlayerState ) {
    return {
        hull: p.hull,
        shield: p.shield,
        dead: p.dead,
        protect: p.protect,
        respawnTimer: p.respawnTimer,
        nextClassId: p.nextClassId,
        kills: p.kills,
        deaths: p.deaths,
    };
}

function spawnPlayer( world: World, p: PlayerState, sessionId: string, isLocal: boolean ): Entity {
    const pilot = Pilot( { classId: classOf( p ), team: p.team as TeamId, name: p.name } );
    const common = [ pilot, NetId( { sessionId } ), Vital( vitalOf( p ) ) ] as const;
    if ( ! isLocal ) return world.spawn( ...common, Remote, Interp, RemotePose );
    const entity = world.spawn( ...common, Sim, Prev, LocalPlayer );
    const s = entity.get( Sim );
    const prev = entity.get( Prev );
    if ( s && prev ) {
        copyShip( s, p );
        capturePrev( s, prev );
    }
    return entity;
}

function mirrorPilot( entity: Entity, p: PlayerState ): void {
    const cur = entity.get( Pilot );
    const classId = classOf( p );
    if ( cur && ( cur.classId !== classId || cur.team !== p.team || cur.name !== p.name ) ) {
        entity.set( Pilot, { classId, team: p.team as TeamId, name: p.name } );
    }
    entity.set( Vital, vitalOf( p ) );
}

function snapshotOf( p: PlayerState ) {
    return { t: performance.now(), x: p.x, y: p.y, z: p.z, qx: p.qx, qy: p.qy, qz: p.qz, qw: p.qw };
}

function refreshRoster( room: Room< MatchState > ): void {
    let marigold = 0;
    let cyan = 0;
    room.state.players.forEach( ( p ) => {
        if ( p.team === 0 ) marigold++;
        else cyan++;
    } );
    const you = room.state.players.get( room.sessionId );
    setRoster( { marigold, cyan, you: you ? ( you.team as TeamId ) : null } );
}

export function attachMatch( room: Room< MatchState >, world: World, predictor: Predictor, arena: Arena ): () => void {
    const $ = getStateCallbacks( room );
    const byId = new Map< string, Entity >();
    const offs = new Map< string, () => void >();

    const offAdd = $( room.state ).players.onAdd( ( p, sid ) => {
        const isLocal = sid === room.sessionId;
        const entity = spawnPlayer( world, p, sid, isLocal );
        byId.set( sid, entity );
        if ( ! isLocal ) pushSnapshot( entity.get( Interp )?.buffer ?? [], snapshotOf( p ) );
        offs.set(
            sid,
            $( p ).onChange( () => {
                const e = byId.get( sid );
                if ( ! e ) return;
                mirrorPilot( e, p );
                if ( isLocal ) {
                    const s = e.get( Sim );
                    if ( s ) predictor.reconcile( s, p, arena );
                } else {
                    const interp = e.get( Interp );
                    if ( interp ) pushSnapshot( interp.buffer, snapshotOf( p ) );
                }
                refreshRoster( room );
            } ),
        );
        refreshRoster( room );
    } );

    const offRemove = $( room.state ).players.onRemove( ( _p, sid ) => {
        offs.get( sid )?.();
        offs.delete( sid );
        byId.get( sid )?.destroy();
        byId.delete( sid );
        refreshRoster( room );
    } );

    const offCombat = attachCombat( room, ( sid ) => byId.get( sid ) );

    // setInterval: wall clock, not useFrame — sends must hold 30 Hz when a backgrounded tab throttles rAF.
    const timer = setInterval( () => {
        const inputs = predictor.drainUnsent();
        if ( inputs.length > 0 ) room.send( INPUT_MESSAGE, { inputs } );
    }, INPUT_SEND_MS );

    return () => {
        clearInterval( timer );
        offAdd();
        offRemove();
        offCombat();
        for ( const off of offs.values() ) off();
        offs.clear();
        for ( const e of byId.values() ) e.destroy();
        byId.clear();
        setRoster( { marigold: 0, cyan: 0, you: null } );
    };
}
