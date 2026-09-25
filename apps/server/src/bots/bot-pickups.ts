import {
    acquireTarget,
    classOf,
    forwardOf,
    type MatchState,
    PICKUP,
    type PlayerState,
    SHIP_CLASSES,
    slotsOf,
    type TeamId,
    vec3,
} from '@voidbrawl/shared';
import { shipTargets } from '../rooms/bolts-step.js';

const LOW_SHIELD = 0.3;
const LOW_HULL = 0.4;
const LOW_BOOST = 0.2;
const MINE_REACH = 80;

const _f = vec3();

function tailed( bot: PlayerState, state: MatchState ): boolean {
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

function wants( bot: PlayerState, id: string, state: MatchState, kind: number ): boolean {
    const ship = SHIP_CLASSES[ classOf( bot ) ];
    if ( kind === PICKUP.shield ) return bot.shield < ship.shield * LOW_SHIELD;
    if ( kind === PICKUP.health ) return bot.hull < ship.hull * LOW_HULL;
    if ( kind === PICKUP.boost ) return bot.boost < LOW_BOOST;
    if ( kind === PICKUP.mine ) return tailed( bot, state );
    if ( kind !== PICKUP.seeker ) return false;
    const others = shipTargets( state ).filter( ( t ) => t.id !== id );
    return acquireTarget( bot, bot.team as TeamId, others ) !== '';
}

export function botPickupChoice( bot: PlayerState, id: string, state: MatchState ): number {
    const slots = slotsOf( bot );
    for ( let i = 0; i < slots.length; i++ ) {
        if ( slots[ i ] !== PICKUP.none && wants( bot, id, state, slots[ i ] ) ) return i;
    }
    return -1;
}
