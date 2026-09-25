import type { GunTuning } from '../combat/gun.js';
import type { FlightTuning } from './flight-tuning.js';

export type ShipClassId = 'fighter' | 'interceptor' | 'heavy';

export interface ShipClass {
    id: ShipClassId;
    name: string;
    tuning: FlightTuning;
    gun: GunTuning;
    hull: number;
    shield: number;
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
        tuning: {
            hullRadius: 1.4,
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
        },
        gun: STANDARD_GUN,
        hull: 100,
        shield: 50,
    },
    interceptor: {
        id: 'interceptor',
        name: 'Interceptor',
        tuning: {
            hullRadius: 1.1,
            thrustAccel: 86,
            reverseAccel: 44,
            strafeAccel: 56,
            drag: 1.1,
            turnRate: 4.2,
            rollRate: 4,
            rollResponse: 10,
            boostAccel: 1.8,
            boostDrain: 0.45,
            boostRegen: 0.22,
            restitution: 0.35,
        },
        gun: { ...STANDARD_GUN, damage: 7, fireInterval: 0.075 },
        hull: 75,
        shield: 40,
    },
    heavy: {
        id: 'heavy',
        name: 'Heavy',
        tuning: {
            hullRadius: 2.2,
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
        },
        gun: { ...STANDARD_GUN, damage: 13, fireInterval: 0.12, heatPerShot: 0.08 },
        hull: 150,
        shield: 75,
    },
};

export const SHIP_ORDER: readonly ShipClassId[] = [ 'fighter', 'interceptor', 'heavy' ];

export const DEFAULT_CLASS: ShipClassId = 'fighter';

export function isShipClassId( id: unknown ): id is ShipClassId {
    return typeof id === 'string' && id in SHIP_CLASSES;
}
