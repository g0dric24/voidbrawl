export const SHIELD_REGEN_DELAY = 4;
export const SHIELD_REGEN_RATE = 20;
export const RESPAWN_DELAY = 3;
export const SPAWN_PROTECTION = 2;
export const IMPACT_DAMAGE_THRESHOLD = 14;
export const IMPACT_DAMAGE_PER_SPEED = 0.6;

export interface Vitals {
    hull: number;
    shield: number;
    maxShield: number;
    shieldDelay: number;
    regenDelay: number;
    regenRate: number;
    protect: number;
    dead: boolean;
}

export interface DamageResult {
    shieldHit: number;
    hullHit: number;
    killed: boolean;
}

export function applyDamage( v: Vitals, amount: number ): DamageResult {
    if ( v.dead || v.protect > 0 || ! ( amount > 0 ) ) return { shieldHit: 0, hullHit: 0, killed: false };
    const shieldHit = amount < v.shield ? amount : v.shield;
    v.shield -= shieldHit;
    const hullHit = amount - shieldHit;
    v.hull -= hullHit;
    v.shieldDelay = v.regenDelay;
    const killed = v.hull <= 0;
    if ( killed ) {
        v.hull = 0;
        v.dead = true;
    }
    return { shieldHit, hullHit, killed };
}

export function tickVitals( v: Vitals, dt: number ): void {
    if ( v.dead ) return;
    v.protect = v.protect > dt ? v.protect - dt : 0;
    if ( v.shieldDelay > 0 ) {
        v.shieldDelay = v.shieldDelay > dt ? v.shieldDelay - dt : 0;
        return;
    }
    const regen = v.shield + v.regenRate * dt;
    v.shield = regen < v.maxShield ? regen : v.maxShield;
}

export function impactDamage( impact: number ): number {
    return impact > IMPACT_DAMAGE_THRESHOLD ? ( impact - IMPACT_DAMAGE_THRESHOLD ) * IMPACT_DAMAGE_PER_SPEED : 0;
}
