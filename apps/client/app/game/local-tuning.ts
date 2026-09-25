import { type FlightTuning, SHIP_CLASSES, SHIP_ORDER, type ShipClassId } from '@voidbrawl/shared';
import { FLIGHT_KEYS, flightPath } from '../dev/flight-tunables';
import { num } from '../dev/tuning';

const live = Object.fromEntries( SHIP_ORDER.map( ( id ) => [ id, { ...SHIP_CLASSES[ id ].tuning } ] ) ) as Record<
    ShipClassId,
    FlightTuning
>;

export function liveTuning( id: ShipClassId ): FlightTuning {
    const t = live[ id ];
    for ( const key of FLIGHT_KEYS ) t[ key ] = num( flightPath( id, key ) );
    return t;
}
