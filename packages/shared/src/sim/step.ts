import type { Arena } from '../arena/arena.js';
import { collideAsteroids, collideBoundary } from './collide.js';
import type { FlightTuning } from './flight-tuning.js';
import { type FlightInput, idleInput, sanitizeInput } from './input.js';
import { rotateBody, rotateVector, vec3 } from './quat.js';
import type { ShipState } from './ship-state.js';

const _in = idleInput();
const _a = vec3();

function steer( s: ShipState, input: FlightInput, t: FlightTuning, dt: number ): void {
    const approach = Math.min( 1, t.rollResponse * dt );
    s.rollRate += ( input.roll * t.rollRate - s.rollRate ) * approach;
    rotateBody( s, -input.pitch, -input.yaw, s.rollRate * dt );
}

function dash( s: ShipState, input: FlightInput, t: FlightTuning, dt: number ): void {
    const left = s.dashCooldown - dt;
    s.dashCooldown = left > 0 ? left : 0;
    if ( input.dash === 0 || t.dashSpeed <= 0 || s.dashCooldown > 0 ) return;
    rotateVector( s, -input.dash * t.dashSpeed, 0, 0, _a );
    s.vx += _a.x;
    s.vy += _a.y;
    s.vz += _a.z;
    s.dashCooldown = t.dashCooldown;
}

function boosting( s: ShipState, input: FlightInput ): boolean {
    return input.boost && input.thrust > 0 && s.boost > 0;
}

function thrust( s: ShipState, input: FlightInput, t: FlightTuning, dt: number ): void {
    const boost = boosting( s, input );
    const forward =
        input.thrust > 0 ? input.thrust * t.thrustAccel * ( boost ? t.boostAccel : 1 ) : input.thrust * t.reverseAccel;
    rotateVector( s, -input.strafe * t.strafeAccel, input.lift * t.strafeAccel, forward, _a );
    s.vx += _a.x * dt;
    s.vy += _a.y * dt;
    s.vz += _a.z * dt;
    const keep = 1 - Math.min( 1, t.drag * dt );
    s.vx *= keep;
    s.vy *= keep;
    s.vz *= keep;
    const meter = boost ? s.boost - t.boostDrain * dt : s.boost + t.boostRegen * dt;
    s.boost = meter < 0 ? 0 : meter > 1 ? 1 : meter;
}

export function stepShip( s: ShipState, raw: FlightInput, t: FlightTuning, arena: Arena, dt: number ): void {
    const input = sanitizeInput( raw, t.turnRate * dt, _in );
    s.impact = 0;
    steer( s, input, t, dt );
    dash( s, input, t, dt );
    thrust( s, input, t, dt );
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.z += s.vz * dt;
    collideAsteroids( s, arena, t.hullRadius, t.restitution );
    collideBoundary( s, arena, t.hullRadius, t.restitution );
}
