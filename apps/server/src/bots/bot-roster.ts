import { type Arena, idleInput, type MatchState, PHASE, PlayerState, type TeamId } from '@voidbrawl/shared';
import { createInputQueue, enqueue, type InputQueue } from '../rooms/input-queue.js';
import { BOT_PREFIX, type BotBrain, botInput, createBrain } from './bot-pilot.js';

export class BotRoster {
    private brains = new Map< string, BotBrain >();

    add( state: MatchState, queues: Map< string, InputQueue >, name: string, team: TeamId ): PlayerState {
        const id = `${ BOT_PREFIX }${ this.brains.size + 1 }`;
        const p = new PlayerState();
        p.name = name;
        p.team = team;
        state.players.set( id, p );
        queues.set( id, createInputQueue() );
        this.brains.set( id, createBrain() );
        return p;
    }

    feed( state: MatchState, queues: Map< string, InputQueue >, arena: Arena, dt: number ): void {
        for ( const [ id, brain ] of this.brains ) {
            const bot = state.players.get( id );
            const q = queues.get( id );
            if ( ! bot || ! q || bot.dead ) continue;
            if ( state.phase === PHASE.live ) enqueue( q, [ botInput( bot, brain, state, arena, dt ) ] );
            else if ( state.phase === PHASE.lobby ) {
                brain.seq += 1;
                enqueue( q, [ { ...idleInput(), seq: brain.seq } ] );
            }
        }
    }
}
