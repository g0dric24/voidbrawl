import type { Arena } from '../arena/arena.js';
import { stepGun } from '../combat/gun.js';
import type { FlightInput } from './input.js';
import type { ShipClass } from './ship-classes.js';
import type { ShipState } from './ship-state.js';
import { stepShip } from './step.js';

export function stepPilot( s: ShipState, input: FlightInput, ship: ShipClass, arena: Arena, dt: number ): void {
    stepShip( s, input, ship.tuning, arena, dt );
    stepGun( s, input.fire === true, ship.gun, dt );
}
