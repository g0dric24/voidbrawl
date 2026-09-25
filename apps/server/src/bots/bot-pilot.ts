import {
    type Arena,
    classOf,
    forwardOf,
    idleInput,
    leadPoint,
    type MatchState,
    type NetInput,
    type PlayerState,
    rightOf,
    SHIP_CLASSES,
    upOf,
    type Vec3,
    vec3,
} from '@voidbrawl/shared';

export const BOT_PREFIX = 'bot:';

const WALL_MARGIN = 140;
const AVOID_REACH = 110;
const AVOID_CLEARANCE = 10;
const TURN_GAIN = 6;
const FIRE_CONE = 0.06;
const AIM_ERROR = 0.035;
const AIM_REFRESH = 0.6;
const CLOSE = 90;
const FAR = 260;
const BOOST_RANGE = 420;
const JINK_RATE = 1.7;

export interface BotBrain {
    seq: number;
    clock: number;
    aimTimer: number;
    aimError: Vec3;
}

export function createBrain(): BotBrain {
    return { seq: 0, clock: Math.random() * 10, aimTimer: 0, aimError: vec3() };
}

export function isBot( sessionId: string ): boolean {
    return sessionId.startsWith( BOT_PREFIX );
}

const _f = vec3();
const _r = vec3();
const _u = vec3();
const _lead = vec3();

interface Aim {
    dir: Vec3;
    dist: number;
    target: PlayerState | null;
}

function nearestEnemy( bot: PlayerState, state: MatchState ): PlayerState | null {
    let best: PlayerState | null = null;
    let bestD = Number.POSITIVE_INFINITY;
    state.players.forEach( ( p ) => {
        if ( p.team === bot.team || p.dead ) return;
        const d = ( p.x - bot.x ) ** 2 + ( p.y - bot.y ) ** 2 + ( p.z - bot.z ) ** 2;
        if ( d < bestD ) {
            bestD = d;
            best = p;
        }
    } );
    return best;
}

function refreshAimError( brain: BotBrain, dt: number ): void {
    brain.aimTimer -= dt;
    if ( brain.aimTimer > 0 ) return;
    brain.aimTimer = AIM_REFRESH;
    brain.aimError.x = ( Math.random() * 2 - 1 ) * AIM_ERROR;
    brain.aimError.y = ( Math.random() * 2 - 1 ) * AIM_ERROR;
    brain.aimError.z = ( Math.random() * 2 - 1 ) * AIM_ERROR;
}

function aimAt( bot: PlayerState, target: PlayerState | null, brain: BotBrain ): Aim {
    if ( ! target ) {
        const d = Math.hypot( bot.x, bot.y, bot.z ) || 1;
        return { dir: { x: -bot.x / d, y: -bot.y / d, z: -bot.z / d }, dist: d, target: null };
    }
    const ship = SHIP_CLASSES[ classOf( bot ) ];
    const along = Math.max( 0, bot.vx * _f.x + bot.vy * _f.y + bot.vz * _f.z );
    const vel = { x: target.vx, y: target.vy, z: target.vz };
    const point = leadPoint( bot, target, vel, ship.gun.boltSpeed + along, _lead ) ? _lead : target;
    const dx = point.x - bot.x;
    const dy = point.y - bot.y;
    const dz = point.z - bot.z;
    const dist = Math.hypot( dx, dy, dz ) || 1;
    return {
        dir: { x: dx / dist + brain.aimError.x, y: dy / dist + brain.aimError.y, z: dz / dist + brain.aimError.z },
        dist,
        target,
    };
}

function steerFromWall( bot: PlayerState, arena: Arena, aim: Aim ): void {
    const r = Math.hypot( bot.x, bot.y, bot.z );
    if ( r < arena.radius - WALL_MARGIN ) return;
    aim.dir = { x: -bot.x / r, y: -bot.y / r, z: -bot.z / r };
    aim.target = null;
}

function rockAhead( bot: PlayerState, arena: Arena, hull: number ): { side: number; up: number } | null {
    for ( const a of arena.asteroids ) {
        const rx = a.x - bot.x;
        const ry = a.y - bot.y;
        const rz = a.z - bot.z;
        const t = rx * _f.x + ry * _f.y + rz * _f.z;
        if ( t <= 0 || t > AVOID_REACH + a.r ) continue;
        const px = rx - _f.x * t;
        const py = ry - _f.y * t;
        const pz = rz - _f.z * t;
        if ( Math.hypot( px, py, pz ) > a.r + hull + AVOID_CLEARANCE ) continue;
        const side = px * _r.x + py * _r.y + pz * _r.z;
        const up = px * _u.x + py * _u.y + pz * _u.z;
        return { side: side >= 0 ? -1 : 1, up: up >= 0 ? -1 : 1 };
    }
    return null;
}

function clamp( v: number, cap: number ): number {
    return v < -cap ? -cap : v > cap ? cap : v;
}

function throttle( dist: number, engaged: boolean ): number {
    if ( ! engaged ) return 1;
    if ( dist > FAR ) return 1;
    return dist < CLOSE ? -0.4 : 0.5;
}

export function botInput( bot: PlayerState, brain: BotBrain, state: MatchState, arena: Arena, dt: number ): NetInput {
    brain.seq += 1;
    brain.clock += dt;
    refreshAimError( brain, dt );
    const ship = SHIP_CLASSES[ classOf( bot ) ];
    forwardOf( bot, _f );
    rightOf( bot, _r );
    upOf( bot, _u );
    const aim = aimAt( bot, nearestEnemy( bot, state ), brain );
    steerFromWall( bot, arena, aim );
    const lx = aim.dir.x * _r.x + aim.dir.y * _r.y + aim.dir.z * _r.z;
    const ly = aim.dir.x * _u.x + aim.dir.y * _u.y + aim.dir.z * _u.z;
    const lz = aim.dir.x * _f.x + aim.dir.y * _f.y + aim.dir.z * _f.z;
    const cap = ship.tuning.turnRate * dt;
    const engaged = aim.target !== null;
    const offAxis = Math.atan2( Math.hypot( lx, ly ), lz );
    const avoid = rockAhead( bot, arena, ship.tuning.hullRadius );
    const jink = engaged && aim.dist < FAR ? Math.sin( brain.clock * JINK_RATE ) : 0;
    return {
        ...idleInput(),
        seq: brain.seq,
        yaw: clamp( Math.atan2( lx, lz ) * TURN_GAIN * dt, cap ),
        pitch: clamp( Math.atan2( ly, lz ) * TURN_GAIN * dt, cap ),
        thrust: throttle( aim.dist, engaged ),
        strafe: avoid ? avoid.side : jink * 0.8,
        lift: avoid ? avoid.up : Math.cos( brain.clock * JINK_RATE * 0.7 ) * jink * 0.6,
        boost: engaged && aim.dist > BOOST_RANGE && offAxis < 0.3,
        fire: engaged && offAxis < FIRE_CONE && aim.dist < ship.gun.boltSpeed * ship.gun.boltLife,
    };
}
