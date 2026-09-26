export const SEEKER = {
    coneCos: 0.9397,
    range: 300,
    speed: 170,
    turnRate: 1.6,
    life: 6,
    damage: 35,
    fuse: 2,
    muzzle: 3,
    lockTime: 0.6,
    cooldown: 4,
} as const;

export const MINE = {
    armDelay: 1,
    trigger: 18,
    blast: 26,
    damage: 40,
    fuse: 6,
    max: 3,
    drop: 6,
} as const;

export interface LockState {
    lockId: string;
    lockProgress: number;
}

export function stepLock( s: LockState, candidate: string, dt: number ): void {
    if ( candidate === '' ) {
        s.lockId = '';
        s.lockProgress = 0;
        return;
    }
    if ( candidate !== s.lockId ) {
        s.lockId = candidate;
        s.lockProgress = 0;
    }
    const next = s.lockProgress + dt / SEEKER.lockTime;
    s.lockProgress = next < 1 ? next : 1;
}

export function clearLock( s: LockState ): void {
    s.lockId = '';
    s.lockProgress = 0;
}
