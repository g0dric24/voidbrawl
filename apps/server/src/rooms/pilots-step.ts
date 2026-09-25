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
}

function stepDead(
    p: PlayerState,
    q: InputQueue | undefined,
    arena: Arena,
    others: Iterable< PlayerState >,
    dt: number,
) {
    if ( q && q.inputs.length > 0 ) {
        p.lastProcessedInput = q.inputs[ q.inputs.length - 1 ].seq;
        q.inputs.length = 0;
    }
    p.respawnTimer -= dt;
    if ( p.respawnTimer <= 0 ) revive( p, arena, others );
}

function stepAlive(
    id: string,
    p: PlayerState,
    q: InputQueue | undefined,
    arena: Arena,
    now: number,
    dt: number,
    events: PilotEvents,
) {
    const input = q?.inputs.shift();
    if ( ! input ) return;
    const ship = SHIP_CLASSES[ classOf( p ) ];
    stepPilot( p, input, ship, arena, dt );
    p.lastProcessedInput = input.seq;
    if ( p.shot ) {
        p.protect = 0;
        events.launch( launchBolt( p, ship.tuning.hullRadius, ship.gun, id, p.team as TeamId, now ), ship.gun.damage );
    }
    if ( applyDamage( p, impactDamage( p.impact ) ).killed ) {
        markDead( p );
        events.killed( id, '', 'crash' );
    }
}

export function stepPilots(
    players: MatchState[ 'players' ],
    queues: Map< string, InputQueue >,
    arena: Arena,
    now: number,
    dt: number,
    events: PilotEvents,
): void {
    players.forEach( ( p, id ) => {
        tickVitals( p, dt );
        if ( ! p.connected ) return;
        const q = queues.get( id );
        if ( p.dead )
            stepDead(
                p,
                q,
                arena,
                [ ...players.values() ].filter( ( o ) => o !== p ),
                dt,
            );
        else stepAlive( id, p, q, arena, now, dt, events );
    } );
}
