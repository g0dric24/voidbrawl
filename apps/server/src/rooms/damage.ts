import { applyDamage, type DeathCause, type HitMessage, type MatchState } from '@voidbrawl/shared';
import { markDead } from './vitals-ops.js';

export interface DamageEvents {
    hit( msg: HitMessage ): void;
    killed( victimId: string, killerId: string, cause: DeathCause ): void;
}

export interface Blow {
    victimId: string;
    attackerId: string;
    amount: number;
    at: { x: number; y: number; z: number };
    cause: DeathCause;
}

export function damageShip( state: MatchState, blow: Blow, events: DamageEvents ): boolean {
    const victim = state.players.get( blow.victimId );
    if ( ! victim ) return false;
    const result = applyDamage( victim, blow.amount );
    events.hit( {
        victimId: blow.victimId,
        shooterId: blow.attackerId,
        x: blow.at.x,
        y: blow.at.y,
        z: blow.at.z,
        shield: result.shieldHit,
        hull: result.hullHit,
    } );
    if ( ! result.killed ) return false;
    markDead( victim );
    const killer = state.players.get( blow.attackerId );
    if ( killer && killer.team !== victim.team ) killer.kills += 1;
    events.killed( blow.victimId, blow.attackerId, blow.cause );
    return true;
}
