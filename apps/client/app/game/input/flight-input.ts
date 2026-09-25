import type { FlightInput, FlightTuning } from '@voidbrawl/shared';
import { axis, isHeld } from './keyboard';
import { takeTurn } from './mouse';

const _turn = { pitch: 0, yaw: 0 };

export function readFlightInput( tuning: FlightTuning, dt: number, out: FlightInput ): FlightInput {
    takeTurn( tuning.turnRate, dt, _turn );
    out.pitch = _turn.pitch;
    out.yaw = _turn.yaw;
    out.thrust = axis( 'KeyS', 'KeyW' );
    out.strafe = axis( 'KeyA', 'KeyD' );
    out.lift = axis( 'KeyC', 'Space' );
    out.roll = axis( 'KeyQ', 'KeyE' );
    out.boost = isHeld( 'ShiftLeft' ) || isHeld( 'ShiftRight' );
    return out;
}
