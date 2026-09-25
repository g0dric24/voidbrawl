import { type Client, Room } from '@colyseus/core';
import {
    type Arena,
    applyArenaDescriptor,
    canJoinTeam,
    canStart,
    classOf,
    createFixedStep,
    DEFAULT_ARENA,
    type DeathCause,
    FIXED_DT,
    HIT_MESSAGE,
    INPUT_MESSAGE,
    type InputMessage,
    isMatchMode,
    isShipClassId,
    type JoinOptions,
    KILL_MESSAGE,
    type KillMessage,
    MAX_NAME,
    MatchState,
    MODES,
    materializeArena,
    openTeam,
    PHASE,
    PLAY_AGAIN_MESSAGE,
    PlayerState,
    type RoomMeta,
    SET_CLASS_MESSAGE,
    SHIP_CLASSES,
    SHIP_ORDER,
    type ShipClassId,
    START_MESSAGE,
    type TeamId,
    USE_PICKUP_MESSAGE,
} from '@voidbrawl/shared';
import { isBot } from '../bots/bot-pilot.js';
import { BotRoster } from '../bots/bot-roster.js';
import { addBolt, type BoltBook, createBoltBook, stepBolts } from './bolts-step.js';
import type { DamageEvents } from './damage.js';
import { createInputQueue, enqueue, type InputQueue } from './input-queue.js';
import { awardDeath, endIfSideEmpty, returnToLobby, sendToBase, startCountdown, stepClock } from './match-flow.js';
import { stepMines, stepMissiles } from './ordnance-step.js';
import { createPickupBook, type PickupBook, resetPickups, stepPads, useSlot } from './pickups-step.js';
import { type PilotMode, stepPilots } from './pilots-step.js';
import { registerTeamMessages } from './team-messages.js';
import { teamCounts } from './teams.js';
import { fillVitals } from './vitals-ops.js';

const RECONNECT_SECONDS = 20;
const PATCH_MS = 50;
const BOT_NAME = 'Bot · Rookie';

function pilotMode( phase: number ): PilotMode {
    if ( phase === PHASE.live ) return 'fight';
    return phase === PHASE.lobby ? 'fly' : 'frozen';
}

export class MatchRoom extends Room< { state: MatchState; metadata: RoomMeta } > {
    private queues = new Map< string, InputQueue >();
    private advance = createFixedStep( FIXED_DT );
    private arena!: Arena;
    private bolts: BoltBook = createBoltBook();
    private bots = new BotRoster();
    private pickups: PickupBook = createPickupBook( DEFAULT_ARENA.seed );
    private damage: DamageEvents = {
        hit: ( msg ) => this.broadcast( HIT_MESSAGE, msg ),
        killed: ( victimId, killerId, cause ) => this.announceKill( victimId, killerId, cause ),
    };

    onCreate( options?: JoinOptions ): void {
        this.state = new MatchState();
        this.state.mode = isMatchMode( options?.mode ) ? options.mode : 'duel';
        this.maxClients = MODES[ this.state.mode ].teamSize * 2;
        applyArenaDescriptor( this.state.arena, DEFAULT_ARENA );
        this.arena = materializeArena( DEFAULT_ARENA );
        resetPickups( this.state, this.arena, this.pickups );
        this.patchRate = PATCH_MS;
        if ( options?.bot === true ) this.addPracticeBot();

        this.onMessage< InputMessage >( INPUT_MESSAGE, ( client, msg ) => {
            const q = this.queues.get( client.sessionId );
            if ( q ) enqueue( q, msg?.inputs );
        } );
        this.onMessage( SET_CLASS_MESSAGE, ( client, classId: unknown ) => {
            if ( isShipClassId( classId ) ) this.setClass( client.sessionId, classId );
        } );
        this.onMessage( USE_PICKUP_MESSAGE, ( client, slot: unknown ) => this.use( client.sessionId, slot ) );
        this.onMessage( START_MESSAGE, ( client ) => {
            const ready = canStart( teamCounts( this.state.players.values() ) );
            if ( ! this.isHost( client ) || this.state.phase !== PHASE.lobby || ! ready ) return;
            startCountdown( this.state, this.arena );
            resetPickups( this.state, this.arena, this.pickups );
            this.refreshMeta();
        } );
        this.onMessage( PLAY_AGAIN_MESSAGE, ( client ) => {
            if ( ! this.isHost( client ) || this.state.phase !== PHASE.results ) return;
            returnToLobby( this.state, this.arena );
            resetPickups( this.state, this.arena, this.pickups );
            this.refreshMeta();
        } );
        registerTeamMessages(
            this,
            ( client ) => this.isHost( client ),
            ( id, team ) => this.moveToTeam( id, team ),
        );

        this.setSimulationInterval( ( deltaMs ) => {
            this.advance( deltaMs / 1000, ( dt ) => this.fixedStep( dt ) );
        } );
        this.refreshMeta();
    }

    private addPracticeBot(): void {
        this.state.mode = 'duel';
        this.maxClients = MODES.duel.teamSize * 2;
        const bot = this.bots.add( this.state, this.queues, BOT_NAME, 1 );
        bot.classId = SHIP_ORDER[ Math.floor( Math.random() * SHIP_ORDER.length ) ];
        sendToBase( this.state, bot, this.arena );
        fillVitals( bot );
        void this.setPrivate( true );
    }

    setClass( sessionId: string, classId: ShipClassId ): void {
        const p = this.state.players.get( sessionId );
        if ( ! p ) return;
        if ( this.state.phase !== PHASE.lobby ) {
            p.nextClassId = classId === p.classId ? '' : classId;
            return;
        }
        p.classId = classId;
        p.nextClassId = '';
        fillVitals( p );
    }

    use( sessionId: string, slot: unknown ): void {
        if ( this.state.phase === PHASE.live ) useSlot( this.state, this.pickups, sessionId, slot );
    }

    fixedStep( dt: number ): void {
        const phaseBefore = this.state.phase;
        const now = this.state.time + dt;
        this.bots.feed( this.state, this.queues, this.arena, dt, ( id, slot ) => this.use( id, slot ) );
        stepPilots( this.state.players, this.queues, {
            arena: this.arena,
            now,
            dt,
            mode: pilotMode( this.state.phase ),
            events: {
                launch: ( bolt, damage ) => {
                    const owner = this.state.players.get( bolt.ownerId );
                    const life = owner ? SHIP_CLASSES[ classOf( owner ) ].gun.boltLife : 0;
                    addBolt( this.state, this.bolts, bolt, life, damage );
                },
                killed: this.damage.killed,
            },
        } );
        this.state.time = now;
        stepBolts( this.state, this.bolts, this.arena, now, dt, this.damage );
        if ( this.state.phase === PHASE.live ) {
            stepPads( this.state, this.arena, this.pickups, dt );
            stepMissiles( this.state, this.arena, dt, this.damage );
            stepMines( this.state, dt, this.damage );
        }
        stepClock( this.state, dt );
        if ( this.state.phase !== phaseBefore ) this.refreshMeta();
    }

    moveToTeam( sessionId: string, team: TeamId ): boolean {
        const p = this.state.players.get( sessionId );
        if ( ! p || this.state.phase !== PHASE.lobby || p.team === team ) return false;
        if ( ! canJoinTeam( this.state.mode, teamCounts( this.state.players.values() ), team ) ) return false;
        p.team = team;
        sendToBase( this.state, p, this.arena );
        return true;
    }

    private isHost( client: Client ): boolean {
        return client.sessionId === this.state.hostId;
    }

    private announceKill( victimId: string, killerId: string, cause: DeathCause ): void {
        const victim = this.state.players.get( victimId );
        if ( victim ) awardDeath( this.state, victim.team as TeamId );
        const msg: KillMessage = { victimId, killerId, cause };
        this.broadcast( KILL_MESSAGE, msg );
        if ( this.state.phase === PHASE.results ) this.refreshMeta();
    }

    onJoin( client: Client, options?: JoinOptions ): void {
        const team = openTeam( this.state.mode, teamCounts( this.state.players.values() ) );
        if ( team === null ) throw new Error( 'room is full' );
        const p = new PlayerState();
        p.name = options?.name?.trim().slice( 0, MAX_NAME ) || 'Pilot';
        p.team = team;
        this.state.players.set( client.sessionId, p );
        sendToBase( this.state, p, this.arena );
        fillVitals( p );
        this.queues.set( client.sessionId, createInputQueue() );
        if ( ! this.state.hostId ) this.state.hostId = client.sessionId;
        this.refreshMeta();
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
        if ( this.state.hostId === sessionId ) {
            this.state.hostId = [ ...this.state.players.keys() ].find( ( id ) => ! isBot( id ) ) ?? '';
        }
        endIfSideEmpty( this.state, teamCounts( this.state.players.values() ) );
        this.refreshMeta();
    }

    private refreshMeta(): void {
        const host = this.state.players.get( this.state.hostId );
        void this.setMetadata( {
            hostName: host?.name ?? '',
            mode: this.state.mode,
            phase: this.state.phase,
            players: this.state.players.size,
            capacity: this.maxClients,
        } );
    }
}
