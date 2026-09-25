import { type Client, Room } from '@colyseus/core';
import {
    type Arena,
    applyArenaDescriptor,
    classOf,
    copyShip,
    createFixedStep,
    DEFAULT_ARENA,
    type DeathCause,
    FIXED_DT,
    HIT_MESSAGE,
    INPUT_MESSAGE,
    type InputMessage,
    isShipClassId,
    type JoinOptions,
    KILL_MESSAGE,
    type KillMessage,
    MAX_NAME,
    MatchState,
    materializeArena,
    PlayerState,
    SELF_DESTRUCT_MESSAGE,
    SET_CLASS_MESSAGE,
    SHIP_CLASSES,
    spawnShip,
} from '@voidbrawl/shared';
import { addBolt, type BoltBook, createBoltBook, stepBolts } from './bolts-step.js';
import { createInputQueue, enqueue, type InputQueue } from './input-queue.js';
import { stepPilots } from './pilots-step.js';
import { freeSlot, smallerTeam } from './teams.js';
import { fillVitals, markDead } from './vitals-ops.js';

const RECONNECT_SECONDS = 20;
const PATCH_MS = 50;
export const MAX_PLAYERS = 8;

export class MatchRoom extends Room< { state: MatchState } > {
    maxClients = MAX_PLAYERS;

    private queues = new Map< string, InputQueue >();
    private advance = createFixedStep( FIXED_DT );
    private arena!: Arena;
    private bolts: BoltBook = createBoltBook();

    onCreate(): void {
        this.state = new MatchState();
        applyArenaDescriptor( this.state.arena, DEFAULT_ARENA );
        this.arena = materializeArena( DEFAULT_ARENA );
        this.patchRate = PATCH_MS;

        this.onMessage< InputMessage >( INPUT_MESSAGE, ( client, msg ) => {
            const q = this.queues.get( client.sessionId );
            if ( q ) enqueue( q, msg?.inputs );
        } );

        this.onMessage( SET_CLASS_MESSAGE, ( client, classId: unknown ) => {
            const p = this.state.players.get( client.sessionId );
            if ( p && isShipClassId( classId ) ) p.nextClassId = classId === p.classId ? '' : classId;
        } );

        this.onMessage( SELF_DESTRUCT_MESSAGE, ( client ) => {
            const p = this.state.players.get( client.sessionId );
            if ( ! p || p.dead ) return;
            markDead( p );
            this.announceKill( client.sessionId, '', 'self' );
        } );

        this.setSimulationInterval( ( deltaMs ) => {
            this.advance( deltaMs / 1000, ( dt ) => this.fixedStep( dt ) );
        } );
    }

    fixedStep( dt: number ): void {
        const now = this.state.time + dt;
        stepPilots( this.state.players, this.queues, this.arena, now, dt, {
            launch: ( bolt, damage ) => {
                const owner = this.state.players.get( bolt.ownerId );
                const life = owner ? SHIP_CLASSES[ classOf( owner ) ].gun.boltLife : 0;
                addBolt( this.state, this.bolts, bolt, life, damage );
            },
            killed: ( victimId, killerId, cause ) => this.announceKill( victimId, killerId, cause ),
        } );
        this.state.time = now;
        stepBolts( this.state, this.bolts, this.arena, now, dt, {
            hit: ( msg ) => this.broadcast( HIT_MESSAGE, msg ),
            killed: ( victimId, killerId ) => this.announceKill( victimId, killerId, 'bolt' ),
        } );
    }

    private announceKill( victimId: string, killerId: string, cause: DeathCause ): void {
        const msg: KillMessage = { victimId, killerId, cause };
        this.broadcast( KILL_MESSAGE, msg );
    }

    onJoin( client: Client, options?: JoinOptions ): void {
        const p = new PlayerState();
        p.name = options?.name?.trim().slice( 0, MAX_NAME ) || 'Pilot';
        p.team = smallerTeam( this.state.players.values() );
        copyShip( p, spawnShip( this.arena, p.team, freeSlot( this.state.players.values(), p.team ) ) );
        fillVitals( p );
        this.state.players.set( client.sessionId, p );
        this.queues.set( client.sessionId, createInputQueue() );
    }

    async onDrop( client: Client ): Promise< void > {
        const p = this.state.players.get( client.sessionId );
        if ( p ) p.connected = false;
        try {
            await this.allowReconnection( client, RECONNECT_SECONDS );
            if ( p ) p.connected = true;
        } catch {
            this.remove( client.sessionId );
        }
    }

    onReconnect( client: Client ): void {
        const p = this.state.players.get( client.sessionId );
        if ( p ) p.connected = true;
    }

    onLeave( client: Client ): void {
        this.remove( client.sessionId );
    }

    private remove( sessionId: string ): void {
        this.queues.delete( sessionId );
        this.state.players.delete( sessionId );
    }
}
