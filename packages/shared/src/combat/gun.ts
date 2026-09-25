import type { ShipState } from '../sim/ship-state.js';

export interface GunTuning {
    boltSpeed: number;
    boltLife: number;
    damage: number;
    fireInterval: number;
    heatPerShot: number;
    coolRate: number;
    unlockHeat: number;
}

type GunState = Pick< ShipState, 'heat' | 'cooldown' | 'overheated' | 'shot' >;

export function stepGun( s: GunState, fire: boolean, gun: GunTuning, dt: number ): void {
    s.shot = false;
    const ready = s.cooldown - dt;
    const cooled = s.heat - gun.coolRate * dt;
    s.heat = cooled > 0 ? cooled : 0;
    if ( s.overheated && s.heat <= gun.unlockHeat ) s.overheated = false;
    if ( ! fire || s.overheated || ready > 0 ) {
        s.cooldown = ready > 0 ? ready : 0;
        return;
    }
    s.shot = true;
    s.cooldown = ready + gun.fireInterval;
    s.heat += gun.heatPerShot;
    if ( s.heat >= 1 ) {
        s.heat = 1;
        s.overheated = true;
    }
}
