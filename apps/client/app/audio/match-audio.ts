import { getStateCallbacks, type Room } from '@colyseus/sdk';
import {
    HIT_MESSAGE,
    type HitMessage,
    KILL_MESSAGE,
    type KillMessage,
    type MatchState,
    PHASE,
} from '@voidbrawl/shared';
import { playMusic } from './audio-engine';
import { MUSIC, playSfx, playSfxAt, preloadAudio } from './sfx-map';

const REMOTE_FIRE_GAIN = 0.3;
const REMOTE_HIT_GAIN = 0.5;

function musicFor( phase: number ): string {
    return phase === PHASE.countdown || phase === PHASE.live ? MUSIC.match.name : MUSIC.lobby.name;
}

function resultSting( room: Room< MatchState > ): void {
    const me = room.state.players.get( room.sessionId );
    if ( me && room.state.winner === me.team ) {
        playSfx( 'go', { rate: 0.8 } );
        playSfx( 'uiConfirm' );
    } else playSfx( 'death', { rate: 0.6 } );
}

function onHit( room: Room< MatchState >, m: HitMessage ): void {
    if ( m.victimId === room.sessionId ) playSfx( 'hurt' );
    else if ( m.shooterId === room.sessionId ) playSfx( 'hit' );
    else playSfxAt( 'hit', m, { gain: REMOTE_HIT_GAIN } );
}

function onKill( room: Room< MatchState >, m: KillMessage ): void {
    if ( m.victimId === room.sessionId ) {
        playSfx( 'death' );
        return;
    }
    const victim = room.state.players.get( m.victimId );
    if ( victim ) playSfxAt( 'death', victim );
}

function bindPhases( room: Room< MatchState > ): () => void {
    const $ = getStateCallbacks( room );
    let prevCeil = Math.ceil( room.state.countdown );
    const offPhase = $( room.state ).listen( 'phase', ( v, prev ) => {
        playMusic( musicFor( v ) );
        if ( v === PHASE.live && prev === PHASE.countdown ) playSfx( 'go' );
        if ( v === PHASE.results ) resultSting( room );
    } );
    const offCountdown = $( room.state ).listen( 'countdown', ( v ) => {
        const c = Math.ceil( v );
        if ( v > 0 && c !== prevCeil ) playSfx( 'countdown', { rate: 1 + ( 3 - c ) * 0.14 } );
        prevCeil = c;
    } );
    return () => {
        offPhase();
        offCountdown();
    };
}

function bindOrdnance( room: Room< MatchState > ): () => void {
    const $ = getStateCallbacks( room );
    const offBolt = $( room.state ).bolts.onAdd( ( b ) => {
        if ( b.ownerId !== room.sessionId )
            playSfxAt( 'fire', { x: b.x0, y: b.y0, z: b.z0 }, { gain: REMOTE_FIRE_GAIN } );
    } );
    const offLaunch = $( room.state ).missiles.onAdd( ( m ) => playSfxAt( 'fire', m, { rate: 0.55, gain: 0.8 } ) );
    const offBurst = $( room.state ).missiles.onRemove( ( m ) => playSfxAt( 'hit', m, { rate: 0.7 } ) );
    const offBlast = $( room.state ).mines.onRemove( ( m ) => playSfxAt( 'death', m, { rate: 1.3, gain: 0.7 } ) );
    return () => {
        offBolt();
        offLaunch();
        offBurst();
        offBlast();
    };
}

function bindRespawn( room: Room< MatchState > ): () => void {
    const $ = getStateCallbacks( room );
    let off = (): void => {};
    const offAdd = $( room.state ).players.onAdd( ( p, sid ) => {
        if ( sid !== room.sessionId ) return;
        off = $( p ).listen( 'dead', ( dead, was ) => {
            if ( was === true && ! dead ) playSfx( 'respawn' );
        } );
    } );
    return () => {
        offAdd();
        off();
    };
}

export function bindMatchAudio( room: Room< MatchState > ): () => void {
    void preloadAudio().then( () => playMusic( musicFor( room.state.phase ) ) );
    const offs = [
        bindPhases( room ),
        bindOrdnance( room ),
        bindRespawn( room ),
        room.onMessage( HIT_MESSAGE, ( m: HitMessage ) => onHit( room, m ) ),
        room.onMessage( KILL_MESSAGE, ( m: KillMessage ) => onKill( room, m ) ),
    ];
    return () => {
        for ( const off of offs ) off();
    };
}
