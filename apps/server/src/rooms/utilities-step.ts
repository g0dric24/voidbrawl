import {
    acquireTarget,
    classOf,
    clearLock,
    forwardOf,
    launchSeeker,
    type MatchState,
    MINE,
    Mine,
    Missile,
    type PlayerState,
    SEEKER,
    SHIP_CLASSES,
    stepLock,
    type TeamId,
    vec3,
} from '@voidbrawl/shared';
import { shipTargets } from './bolts-step.js';

const _f = vec3();

export interface UtilityBook {
    nextId: number;
}

export function createUtilityBook(): UtilityBook {
    return { nextId: 0 };
}

export function resetUtilities( state: MatchState ): void {
    state.missiles.clear();
    state.mines.clear();
}

function fireSeeker( state: MatchState, book: UtilityBook, id: string, p: PlayerState ): void {
    const m = new Missile();
    Object.assign( m, launchSeeker( p, SHIP_CLASSES[ classOf( p ) ].tuning.hullRadius ) );
    m.ownerId = id;
    m.team = p.team;
    m.targetId = p.lockId;
    m.life = SEEKER.life;
    state.missiles.set( String( book.nextId++ ), m );
    p.seekers -= 1;
    p.seekerCooldown = SEEKER.cooldown;
}

function candidate( state: MatchState, id: string, p: PlayerState ): string {
    const others = shipTargets( state ).filter( ( t ) => t.id !== id );
    return acquireTarget( p, p.team as TeamId, others );
}

export function stepAim( state: MatchState, book: UtilityBook, id: string, held: boolean, dt: number ): void {
    const p = state.players.get( id );
    if ( ! p ) return;
    const left = p.seekerCooldown - dt;
    p.seekerCooldown = left > 0 ? left : 0;
    const ready = p.seekers > 0 && p.seekerCooldown === 0;
    const released = p.lockHeld && ! held;
    p.lockHeld = held;
    if ( released && ready && p.lockProgress >= 1 ) fireSeeker( state, book, id, p );
    if ( held && p.seekers > 0 && p.seekerCooldown === 0 ) {
        stepLock( p, candidate( state, id, p ), dt );
        return;
    }
    clearLock( p );
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

export function dropMine( state: MatchState, book: UtilityBook, id: string ): boolean {
    const p = state.players.get( id );
    if ( ! p || p.dead || p.mines <= 0 ) return false;
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
    p.mines -= 1;
    return true;
}
