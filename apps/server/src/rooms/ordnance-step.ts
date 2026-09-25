import {
    type Arena,
    type BoltTarget,
    type MatchState,
    MINE,
    type Mine,
    type Missile,
    SEEKER,
    steerSeeker,
    sweepBolt,
} from '@voidbrawl/shared';
import { shipTargets } from './bolts-step.js';
import { type DamageEvents, damageShip } from './damage.js';

function reach( a: { x: number; y: number; z: number }, b: BoltTarget, extra: number ): boolean {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    const r = b.radius + extra;
    return dx * dx + dy * dy + dz * dz <= r * r;
}

function flyMissile( m: Missile, ships: readonly BoltTarget[], arena: Arena, dt: number ) {
    const from = { x: m.x, y: m.y, z: m.z };
    const target = m.targetId ? ( ships.find( ( s ) => s.id === m.targetId ) ?? null ) : null;
    steerSeeker( m, target, dt );
    const path = {
        x0: from.x,
        y0: from.y,
        z0: from.z,
        vx: ( m.x - from.x ) / dt,
        vy: ( m.y - from.y ) / dt,
        vz: ( m.z - from.z ) / dt,
        t0: 0,
        ownerId: m.ownerId,
        team: m.team,
    };
    const fused = ships.map( ( s ) => ( { ...s, radius: s.radius + SEEKER.fuse } ) );
    return sweepBolt( path, 0, dt, arena, fused );
}

export function stepMissiles( state: MatchState, arena: Arena, dt: number, events: DamageEvents ): void {
    const ships = shipTargets( state );
    for ( const [ id, m ] of state.missiles ) {
        m.life -= dt;
        if ( m.life <= 0 ) {
            state.missiles.delete( id );
            continue;
        }
        const hit = flyMissile( m, ships, arena, dt );
        if ( ! hit ) continue;
        state.missiles.delete( id );
        if ( hit.kind !== 'ship' ) continue;
        const at = { x: m.x, y: m.y, z: m.z };
        damageShip(
            state,
            { victimId: hit.id, attackerId: m.ownerId, amount: SEEKER.damage, at, cause: 'seeker' },
            events,
        );
    }
}

function detonate( state: MatchState, mine: Mine, ships: readonly BoltTarget[], events: DamageEvents ): void {
    const at = { x: mine.x, y: mine.y, z: mine.z };
    for ( const s of ships ) {
        if ( s.team === mine.team || ! reach( at, s, MINE.blast ) ) continue;
        damageShip(
            state,
            { victimId: s.id, attackerId: mine.ownerId, amount: MINE.damage, at, cause: 'mine' },
            events,
        );
    }
}

export function stepMines( state: MatchState, dt: number, events: DamageEvents ): void {
    const ships = shipTargets( state );
    for ( const [ id, mine ] of state.mines ) {
        mine.age += dt;
        if ( mine.age >= MINE.life ) {
            state.mines.delete( id );
            continue;
        }
        if ( ! mine.armed ) {
            if ( mine.age >= MINE.armDelay ) mine.armed = true;
            continue;
        }
        if ( ! ships.some( ( s ) => s.team !== mine.team && reach( mine, s, MINE.trigger ) ) ) continue;
        state.mines.delete( id );
        detonate( state, mine, ships, events );
    }
}
