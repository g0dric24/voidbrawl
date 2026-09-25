import { type Client, Room } from '@colyseus/core';
import {
    type Arena,
    applyArenaDescriptor,
    classOf,
    copyShip,
    createFixedStep,
    DEFAULT_ARENA,
    FIXED_DT,
    INPUT_MESSAGE,
    type InputMessage,
    isShipClassId,
    type JoinOptions,
    MAX_NAME,
    MatchState,
    materializeArena,
    PlayerState,
    RESPAWN_MESSAGE,
    SET_CLASS_MESSAGE,
    SHIP_CLASSES,
    spawnShip,
    stepShip,
} from '@voidbrawl/shared';
import { createInputQueue, enqueue, type InputQueue } from './input-queue.js';
import { freeSlot, smallerTeam } from './teams.js';

const RECONNECT_SECONDS = 20;
const PATCH_MS = 50;
export const MAX_PLAYERS = 8;

export class MatchRoom extends Room< { state: MatchState } > {
    maxClients = MAX_PLAYERS;

    private queues = new Map< string, InputQueue >();
    private advance = createFixedStep( FIXED_DT );
    private arena!: Arena;

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
            if ( p && isShipClassId( classId ) ) p.classId = classId;
        } );

        this.onMessage( RESPAWN_MESSAGE, ( client ) => {
            const p = this.state.players.get( client.sessionId );
            if ( p ) this.respawn( p );
        } );

        this.setSimulationInterval( ( deltaMs ) => {
            this.advance( deltaMs / 1000, ( dt ) => this.fixedStep( dt ) );
        } );
    }

    fixedStep( dt: number ): void {
        this.state.players.forEach( ( player, sessionId ) => {
            if ( ! player.connected ) return;
            const input = this.queues.get( sessionId )?.inputs.shift();
            if ( ! input ) return;
            stepShip( player, input, SHIP_CLASSES[ classOf( player ) ].tuning, this.arena, dt );
            player.lastProcessedInput = input.seq;
        } );
    }

    private respawn( p: PlayerState ): void {
        const others = [ ...this.state.players.values() ].filter( ( o ) => o !== p );
        copyShip( p, spawnShip( this.arena, p.team, freeSlot( others, p.team ) ) );
    }

    onJoin( client: Client, options?: JoinOptions ): void {
        const p = new PlayerState();
        p.name = options?.name?.trim().slice( 0, MAX_NAME ) || 'Pilot';
        p.team = smallerTeam( this.state.players.values() );
        copyShip( p, spawnShip( this.arena, p.team, freeSlot( this.state.players.values(), p.team ) ) );
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
