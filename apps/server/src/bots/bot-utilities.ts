import { acquireTarget, forwardOf, type MatchState, type PlayerState, type TeamId, vec3 } from '@voidbrawl/shared';
import { shipTargets } from '../rooms/bolts-step.js';

const MINE_REACH = 80;

const _f = vec3();

export function botWantsLock( bot: PlayerState, id: string, state: MatchState ): boolean {
    if ( bot.seekers <= 0 || bot.seekerCooldown > 0 || bot.lockProgress >= 1 ) return false;
    const others = shipTargets( state ).filter( ( t ) => t.id !== id );
    return acquireTarget( bot, bot.team as TeamId, others ) !== '';
}

export function botWantsMine( bot: PlayerState, state: MatchState ): boolean {
    if ( bot.mines <= 0 ) return false;
    forwardOf( bot, _f );
    for ( const p of state.players.values() ) {
        if ( p.team === bot.team || p.dead ) continue;
        const dx = p.x - bot.x;
        const dy = p.y - bot.y;
        const dz = p.z - bot.z;
        if ( Math.hypot( dx, dy, dz ) < MINE_REACH && dx * _f.x + dy * _f.y + dz * _f.z < 0 ) return true;
    }
    return false;
}
