import {
    type Arena,
    classOf,
    clearLock,
    copyShip,
    type PlayerState,
    RESPAWN_DELAY,
    SHIP_CLASSES,
    SPAWN_PROTECTION,
    spawnShip,
} from '@voidbrawl/shared';
import { freeSlot } from './teams.js';

export function fillKit( p: PlayerState ): void {
    const ship = SHIP_CLASSES[ classOf( p ) ];
    p.seekers = ship.seekers;
    p.mines = ship.mines;
    p.seekerCooldown = 0;
    p.lockHeld = false;
    clearLock( p );
}

export function fillVitals( p: PlayerState ): void {
    const ship = SHIP_CLASSES[ classOf( p ) ];
    p.hull = ship.hull;
    p.shield = ship.shield;
    p.maxShield = ship.shield;
    p.shieldDelay = 0;
    p.regenDelay = ship.regenDelay;
    p.regenRate = ship.regenRate;
    fillKit( p );
}

export function markDead( p: PlayerState ): void {
    p.dead = true;
    p.hull = 0;
    p.deaths += 1;
    p.respawnTimer = RESPAWN_DELAY;
    p.vx = 0;
    p.vy = 0;
    p.vz = 0;
    p.rollRate = 0;
    p.lockHeld = false;
    clearLock( p );
}

export function revive( p: PlayerState, arena: Arena, others: Iterable< PlayerState > ): void {
    if ( p.nextClassId ) {
        p.classId = p.nextClassId;
        p.nextClassId = '';
    }
    copyShip( p, spawnShip( arena, p.team, freeSlot( others, p.team ) ) );
    fillVitals( p );
    p.dead = false;
    p.respawnTimer = 0;
    p.protect = SPAWN_PROTECTION;
}
