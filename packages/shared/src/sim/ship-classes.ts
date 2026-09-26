import type { GunTuning } from '../combat/gun.js';
import { SHIELD_REGEN_DELAY, SHIELD_REGEN_RATE } from '../combat/vitals.js';
import type { FlightTuning } from './flight-tuning.js';

export type ShipClassId = 'fighter' | 'interceptor' | 'heavy';

export const SHIP_SCALE = 3;

export interface ShipClass {
    id: ShipClassId;
    name: string;
    role: string;
    trait: string;
    tuning: FlightTuning;
    gun: GunTuning;
    hull: number;
    shield: number;
    hitRadius: number;
    seekers: number;
    mines: number;
    regenDelay: number;
    regenRate: number;
}

const STANDARD_GUN: GunTuning = {
    boltSpeed: 420,
    boltLife: 1.4,
    damage: 9,
    fireInterval: 0.09,
    heatPerShot: 0.07,
    coolRate: 0.35,
    unlockHeat: 0.3,
};

export const SHIP_CLASSES: Record< ShipClassId, ShipClass > = {
    fighter: {
        id: 'fighter',
        name: 'Fighter',
        role: 'All-rounder',
        trait: 'Carries 3 seekers and 3 mines',
        tuning: {
            hullRadius: 4.2,
            thrustAccel: 66,
            reverseAccel: 36,
            strafeAccel: 44,
            drag: 1.1,
            turnRate: 3.2,
            rollRate: 3,
            rollResponse: 8,
            boostAccel: 1.9,
            boostDrain: 0.4,
            boostRegen: 0.2,
            restitution: 0.35,
            dashSpeed: 0,
            dashCooldown: 0,
        },
        gun: STANDARD_GUN,
        hull: 100,
        shield: 50,
        hitRadius: 6.1,
        seekers: 3,
        mines: 3,
        regenDelay: SHIELD_REGEN_DELAY,
        regenRate: SHIELD_REGEN_RATE,
    },
    interceptor: {
        id: 'interceptor',
        name: 'Interceptor',
        role: 'Fast and fragile',
        trait: 'Double-tap A / D to dash · fast boost refill',
        tuning: {
            hullRadius: 3.3,
            thrustAccel: 86,
            reverseAccel: 44,
            strafeAccel: 56,
            drag: 1.1,
            turnRate: 4.2,
            rollRate: 4,
            rollResponse: 10,
            boostAccel: 1.8,
            boostDrain: 0.45,
            boostRegen: 0.44,
            restitution: 0.35,
            dashSpeed: 55,
            dashCooldown: 2.5,
        },
        gun: { ...STANDARD_GUN, damage: 7, fireInterval: 0.075 },
        hull: 75,
        shield: 40,
        hitRadius: 4.5,
        seekers: 2,
        mines: 2,
        regenDelay: SHIELD_REGEN_DELAY,
        regenRate: SHIELD_REGEN_RATE,
    },
    heavy: {
        id: 'heavy',
        name: 'Heavy',
        role: 'Slow tank',
        trait: 'Shield recovers after 2 s at double rate',
        tuning: {
            hullRadius: 6.6,
            thrustAccel: 48,
            reverseAccel: 28,
            strafeAccel: 30,
            drag: 1.1,
            turnRate: 2.2,
            rollRate: 2.2,
            rollResponse: 6,
            boostAccel: 2,
            boostDrain: 0.35,
            boostRegen: 0.18,
            restitution: 0.25,
            dashSpeed: 0,
            dashCooldown: 0,
        },
        gun: { ...STANDARD_GUN, damage: 13, fireInterval: 0.12, heatPerShot: 0.08 },
        hull: 150,
        shield: 75,
        hitRadius: 10.9,
        seekers: 2,
        mines: 2,
        regenDelay: SHIELD_REGEN_DELAY / 2,
        regenRate: SHIELD_REGEN_RATE * 2,
    },
};

export const SHIP_ORDER: readonly ShipClassId[] = [ 'fighter', 'interceptor', 'heavy' ];

export const DEFAULT_CLASS: ShipClassId = 'fighter';

export function isShipClassId( id: unknown ): id is ShipClassId {
    return typeof id === 'string' && id in SHIP_CLASSES;
}
