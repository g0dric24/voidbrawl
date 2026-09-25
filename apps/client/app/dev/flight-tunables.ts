import { type FlightTuning, SHIP_CLASSES, SHIP_ORDER, type ShipClassId } from '@voidbrawl/shared';

export interface NumberTunable {
    value: number;
    min: number;
    max: number;
    step: number;
}

export type FlightKey = keyof FlightTuning;

export type FlightPath = `Flight.${ ShipClassId }.${ FlightKey }`;

const RANGES: Record< FlightKey, Omit< NumberTunable, 'value' > > = {
    hullRadius: { min: 0.5, max: 4, step: 0.05 },
    thrustAccel: { min: 10, max: 200, step: 1 },
    reverseAccel: { min: 5, max: 150, step: 1 },
    strafeAccel: { min: 5, max: 150, step: 1 },
    drag: { min: 0.1, max: 4, step: 0.05 },
    turnRate: { min: 0.5, max: 8, step: 0.05 },
    rollRate: { min: 0.5, max: 8, step: 0.05 },
    rollResponse: { min: 1, max: 30, step: 0.5 },
    boostAccel: { min: 1, max: 4, step: 0.05 },
    boostDrain: { min: 0.05, max: 2, step: 0.01 },
    boostRegen: { min: 0.02, max: 2, step: 0.01 },
    restitution: { min: 0, max: 1, step: 0.01 },
};

export const FLIGHT_KEYS = Object.keys( RANGES ) as FlightKey[];

export function flightPath( id: ShipClassId, key: FlightKey ): FlightPath {
    return `Flight.${ id }.${ key }`;
}

export const FLIGHT_TUNABLES = Object.fromEntries(
    SHIP_ORDER.flatMap( ( id ) =>
        FLIGHT_KEYS.map( ( key ) => [
            flightPath( id, key ),
            { value: SHIP_CLASSES[ id ].tuning[ key ], ...RANGES[ key ] },
        ] ),
    ),
) as Record< FlightPath, NumberTunable >;
