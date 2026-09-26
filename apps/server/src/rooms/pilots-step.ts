import {
    type Arena,
    applyDamage,
    type BoltLaunch,
    classOf,
    type DeathCause,
    impactDamage,
    launchBolt,
    type MatchState,
    type PlayerState,
    SHIP_CLASSES,
    stepPilot,
    type TeamId,
    tickVitals,
} from '@voidbrawl/shared';
import type { InputQueue } from './input-queue.js';
import { markDead, revive } from './vitals-ops.js';

export interface PilotEvents {
    launch( bolt: BoltLaunch, damage: number ): void;
    killed( victimId: string, killerId: string, cause: DeathCause ): void;
    aim( id: string, held: boolean, dt: number ): void;
}

export type PilotMode = 'frozen' | 'fly' | 'fight';

export interface PilotStep {
    arena: Arena;
    now: number;
    dt: number;
    mode: PilotMode;
    events: PilotEvents;
}

export function drainInputs( p: PlayerState, q: InputQueue | undefined ): void {
    if ( ! q || q.inputs.length === 0 ) return;
    p.lastProcessedInput = q.inputs[ q.inputs.length - 1 ].seq;
    q.inputs.length = 0;
}

function stepDead( p: PlayerState, q: InputQueue | undefined, others: Iterable< PlayerState >, step: PilotStep ) {
    drainInputs( p, q );
    p.respawnTimer -= step.dt;
    if ( p.respawnTimer <= 0 ) revive( p, step.arena, others );
}

function stepAlive( id: string, p: PlayerState, q: InputQueue | undefined, step: PilotStep ) {
    const input = q?.inputs.shift();
    if ( ! input ) return;
    const ship = SHIP_CLASSES[ classOf( p ) ];
    const fight = step.mode === 'fight';
    stepPilot( p, fight ? input : { ...input, fire: false }, ship, step.arena, step.dt );
    p.lastProcessedInput = input.seq;
    if ( ! fight ) return;
    step.events.aim( id, input.lock === true, step.dt );
    if ( p.shot ) {
        const bolt = launchBolt( p, ship.tuning.hullRadius, ship.gun, id, p.team as TeamId, step.now );
        step.events.launch( bolt, ship.gun.damage );
    }
    if ( applyDamage( p, impactDamage( p.impact ) ).killed ) {
        markDead( p );
        step.events.killed( id, '', 'crash' );
    }
}

export function stepPilots( players: MatchState[ 'players' ], queues: Map< string, InputQueue >, step: PilotStep ) {
    players.forEach( ( p, id ) => {
        const q = queues.get( id );
        if ( step.mode === 'frozen' ) {
            drainInputs( p, q );
            return;
        }
        tickVitals( p, step.dt );
        if ( ! p.connected ) return;
        if ( p.dead )
            stepDead(
                p,
                q,
                [ ...players.values() ].filter( ( o ) => o !== p ),
                step,
            );
        else stepAlive( id, p, q, step );
    } );
}
