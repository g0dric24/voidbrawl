import {
    type Arena,
    acquireTarget,
    classOf,
    forwardOf,
    HEALTH_FRACTION,
    isPickupKind,
    launchSeeker,
    MAX_SLOTS,
    type MatchState,
    MINE,
    Mine,
    Missile,
    mulberry32,
    PAD_RESPAWN,
    PadState,
    PICKUP,
    type PickupKind,
    type PlayerState,
    rollPickup,
    SEEKER,
    SHIP_CLASSES,
    type TeamId,
    touchesPad,
    vec3,
} from '@voidbrawl/shared';
import { shipTargets } from './bolts-step.js';
import { clearSlots } from './vitals-ops.js';

const SLOT_KEYS = [ 'slot0', 'slot1', 'slot2' ] as const;
const _f = vec3();

export interface PickupBook {
    nextId: number;
    timers: number[];
    rand: () => number;
}

export function createPickupBook( seed: number ): PickupBook {
    return { nextId: 0, timers: [], rand: mulberry32( seed ) };
}

export function resetPickups( state: MatchState, arena: Arena, book: PickupBook ): void {
    state.missiles.clear();
    state.mines.clear();
    state.pads.clear();
    book.timers = arena.pads.map( () => 0 );
    for ( let i = 0; i < arena.pads.length; i++ ) {
        const pad = new PadState();
        pad.kind = rollPickup( book.rand() );
        state.pads.push( pad );
    }
    state.players.forEach( clearSlots );
}

export function giveSlot( p: PlayerState, kind: PickupKind ): boolean {
    const cap = SHIP_CLASSES[ classOf( p ) ].slots;
    for ( let i = 0; i < cap && i < MAX_SLOTS; i++ ) {
        const key = SLOT_KEYS[ i ];
        if ( p[ key ] !== PICKUP.none ) continue;
        p[ key ] = kind;
        return true;
    }
    return false;
}

function collect( state: MatchState, arena: Arena, book: PickupBook, i: number, pad: PadState ): void {
    const at = arena.pads[ i ];
    for ( const p of state.players.values() ) {
        if ( p.dead || ! isPickupKind( pad.kind ) ) continue;
        if ( ! touchesPad( p, SHIP_CLASSES[ classOf( p ) ].hitRadius, at ) ) continue;
        if ( ! giveSlot( p, pad.kind ) ) continue;
        pad.kind = PICKUP.none;
        book.timers[ i ] = PAD_RESPAWN;
        return;
    }
}

export function stepPads( state: MatchState, arena: Arena, book: PickupBook, dt: number ): void {
    state.pads.forEach( ( pad, i ) => {
        if ( pad.kind !== PICKUP.none ) {
            collect( state, arena, book, i, pad );
            return;
        }
        book.timers[ i ] -= dt;
        if ( book.timers[ i ] <= 0 ) pad.kind = rollPickup( book.rand() );
    } );
}

function fireSeeker( state: MatchState, book: PickupBook, id: string, p: PlayerState ): void {
    const ship = SHIP_CLASSES[ classOf( p ) ];
    const m = new Missile();
    Object.assign( m, launchSeeker( p, ship.tuning.hullRadius ) );
    m.ownerId = id;
    m.team = p.team;
    m.targetId = acquireTarget( p, p.team as TeamId, shipTargets( state ) );
    m.life = SEEKER.life;
    state.missiles.set( String( book.nextId++ ), m );
}

function oldestMineOf( state: MatchState, ownerId: string ): string | null {
    let count = 0;
    let oldest: string | null = null;
    for ( const [ id, mine ] of state.mines ) {
        if ( mine.ownerId !== ownerId ) continue;
        count += 1;
        oldest ??= id;
    }
    return count >= MINE.max ? oldest : null;
}

function dropMine( state: MatchState, book: PickupBook, id: string, p: PlayerState ): void {
    const drop = oldestMineOf( state, id );
    if ( drop !== null ) state.mines.delete( drop );
    const f = forwardOf( p, _f );
    const back = SHIP_CLASSES[ classOf( p ) ].tuning.hullRadius + MINE.drop;
    const mine = new Mine();
    mine.x = p.x - f.x * back;
    mine.y = p.y - f.y * back;
    mine.z = p.z - f.z * back;
    mine.ownerId = id;
    mine.team = p.team;
    state.mines.set( String( book.nextId++ ), mine );
}

function apply( state: MatchState, book: PickupBook, id: string, p: PlayerState, kind: PickupKind ): void {
    const ship = SHIP_CLASSES[ classOf( p ) ];
    if ( kind === PICKUP.shield ) p.shield = p.maxShield;
    else if ( kind === PICKUP.health ) p.hull = Math.min( ship.hull, p.hull + ship.hull * HEALTH_FRACTION );
    else if ( kind === PICKUP.boost ) p.boost = 1;
    else if ( kind === PICKUP.seeker ) fireSeeker( state, book, id, p );
    else dropMine( state, book, id, p );
    if ( kind === PICKUP.seeker || kind === PICKUP.mine ) p.protect = 0;
}

export function useSlot( state: MatchState, book: PickupBook, id: string, slot: unknown ): boolean {
    const p = state.players.get( id );
    if ( ! p || p.dead || typeof slot !== 'number' ) return false;
    const key = SLOT_KEYS[ slot ];
    if ( ! key || slot >= SHIP_CLASSES[ classOf( p ) ].slots ) return false;
    const kind = p[ key ];
    if ( ! isPickupKind( kind ) ) return false;
    p[ key ] = PICKUP.none;
    apply( state, book, id, p, kind );
    return true;
}
