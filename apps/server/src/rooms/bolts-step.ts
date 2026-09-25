import {
    type Arena,
    Bolt,
    type BoltLaunch,
    type BoltTarget,
    boltPosition,
    classOf,
    type MatchState,
    SHIP_CLASSES,
    sweepBolt,
    type TeamId,
} from '@voidbrawl/shared';
import { type DamageEvents, damageShip } from './damage.js';

export const BOLT_LINGER = 0.3;

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

export function shipTargets( state: MatchState ): BoltTarget[] {
    const out: BoltTarget[] = [];
    state.players.forEach( ( p, id ) => {
        if ( p.dead ) return;
        const radius = SHIP_CLASSES[ classOf( p ) ].hitRadius;
        out.push( { id, team: p.team as TeamId, x: p.x, y: p.y, z: p.z, radius } );
    } );
    return out;
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
    events: DamageEvents,
): void {
    let ships = shipTargets( state );
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
        const blow = {
            victimId,
            attackerId: bolt.ownerId,
            amount: book.damage.get( id ) ?? 0,
            at: boltPosition( bolt, at ),
            cause: 'bolt' as const,
        };
        if ( damageShip( state, blow, events ) ) ships = ships.filter( ( s ) => s.id !== victimId );
    }
}
