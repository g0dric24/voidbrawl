import { type Arena, idleInput, type MatchState, PHASE, PlayerState, type TeamId } from '@voidbrawl/shared';
import { createInputQueue, enqueue, type InputQueue } from '../rooms/input-queue.js';
import { BOT_PREFIX, type BotBrain, botInput, createBrain } from './bot-pilot.js';
import { botWantsLock, botWantsMine } from './bot-utilities.js';

const MINE_PAUSE = 1.5;

export type DropMine = ( sessionId: string ) => void;

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

    private mine( id: string, bot: PlayerState, brain: BotBrain, state: MatchState, dt: number, drop: DropMine ) {
        brain.usePause -= dt;
        if ( brain.usePause > 0 || ! botWantsMine( bot, state ) ) return;
        brain.usePause = MINE_PAUSE;
        drop( id );
    }

    feed( state: MatchState, queues: Map< string, InputQueue >, arena: Arena, dt: number, drop: DropMine ): void {
        for ( const [ id, brain ] of this.brains ) {
            const bot = state.players.get( id );
            const q = queues.get( id );
            if ( ! bot || ! q || bot.dead ) continue;
            if ( state.phase === PHASE.live ) {
                const input = botInput( bot, brain, state, arena, dt );
                input.lock = botWantsLock( bot, id, state );
                enqueue( q, [ input ] );
                this.mine( id, bot, brain, state, dt, drop );
            } else if ( state.phase === PHASE.lobby ) {
                brain.seq += 1;
                enqueue( q, [ { ...idleInput(), seq: brain.seq } ] );
            }
        }
    }
}
