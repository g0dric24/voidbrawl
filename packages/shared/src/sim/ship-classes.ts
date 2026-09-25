import type { FlightTuning } from './flight-tuning.js';

export type ShipClassId = 'fighter' | 'interceptor' | 'heavy';

export interface ShipClass {
    id: ShipClassId;
    name: string;
    tuning: FlightTuning;
}

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
    },
};

export const SHIP_ORDER: readonly ShipClassId[] = [ 'fighter', 'interceptor', 'heavy' ];

export const DEFAULT_CLASS: ShipClassId = 'fighter';

export function isShipClassId( id: unknown ): id is ShipClassId {
    return typeof id === 'string' && id in SHIP_CLASSES;
}
