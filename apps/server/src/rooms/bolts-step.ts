import {
    type Arena,
    applyDamage,
    Bolt,
    type BoltLaunch,
    type BoltTarget,
    boltPosition,
    classOf,
    type HitMessage,
    type MatchState,
    SHIP_CLASSES,
    sweepBolt,
    type TeamId,
} from '@voidbrawl/shared';
import { markDead } from './vitals-ops.js';

export const BOLT_LINGER = 0.3;

export interface BoltEvents {
    hit( msg: HitMessage ): void;
    killed( victimId: string, killerId: string ): void;
}

export interface BoltBook {
    nextId: number;
    damage: Map< string, number >;
}

export function createBoltBook(): BoltBook {
    return { nextId: 0, damage: new Map() };
}

export function addBolt( state: MatchState, book: BoltBook, launch: BoltLaunch, life: number, damage: number ): void {
    const b = new Bolt();
    Object.assign( b, launch );
    b.tEnd = launch.t0 + life;
    const id = String( book.nextId++ );
    book.damage.set( id, damage );
    state.bolts.set( id, b );
}

function targets( state: MatchState ): BoltTarget[] {
    const out: BoltTarget[] = [];
    state.players.forEach( ( p, id ) => {
        if ( p.dead ) return;
        const radius = SHIP_CLASSES[ classOf( p ) ].hitRadius;
        out.push( { id, team: p.team as TeamId, x: p.x, y: p.y, z: p.z, radius } );
    } );
    return out;
}

function strikeShip(
    state: MatchState,
    bolt: Bolt,
    victimId: string,
    at: number,
    damage: number,
    events: BoltEvents,
): boolean {
    const victim = state.players.get( victimId );
    if ( ! victim ) return false;
    const result = applyDamage( victim, damage );
    const p = boltPosition( bolt, at );
    events.hit( {
        victimId,
        shooterId: bolt.ownerId,
        x: p.x,
        y: p.y,
        z: p.z,
        shield: result.shieldHit,
        hull: result.hullHit,
    } );
    if ( ! result.killed ) return false;
    markDead( victim );
    const killer = state.players.get( bolt.ownerId );
    if ( killer ) killer.kills += 1;
    events.killed( victimId, bolt.ownerId );
    return true;
}

function retire( state: MatchState, book: BoltBook, id: string, bolt: Bolt, now: number ): void {
    if ( now < bolt.tEnd + BOLT_LINGER ) return;
    state.bolts.delete( id );
    book.damage.delete( id );
}

export function stepBolts(
    state: MatchState,
    book: BoltBook,
    arena: Arena,
    now: number,
    dt: number,
    events: BoltEvents,
): void {
    let ships = targets( state );
    for ( const [ id, bolt ] of state.bolts ) {
        if ( bolt.struck || now - dt >= bolt.tEnd ) {
            retire( state, book, id, bolt, now );
            continue;
        }
        const from = Math.max( now - dt, bolt.t0 );
        const to = Math.min( now, bolt.tEnd );
        const hit = sweepBolt( bolt, from, to, arena, ships );
        if ( ! hit ) continue;
        const at = from + ( to - from ) * hit.t;
        bolt.struck = true;
        bolt.tEnd = at;
        if ( hit.kind !== 'ship' ) continue;
        const victimId = hit.id;
        if ( strikeShip( state, bolt, victimId, at, book.damage.get( id ) ?? 0, events ) ) {
            ships = ships.filter( ( s ) => s.id !== victimId );
        }
    }
}
