export interface FlightInput {
    thrust: number;
    strafe: number;
    lift: number;
    roll: number;
    pitch: number;
    yaw: number;
    boost: boolean;
    fire: boolean;
    dash: number;
}

export function idleInput(): FlightInput {
    return { thrust: 0, strafe: 0, lift: 0, roll: 0, pitch: 0, yaw: 0, boost: false, fire: false, dash: 0 };
}

function unit( v: number ): number {
    if ( ! Number.isFinite( v ) ) return 0;
    return v < -1 ? -1 : v > 1 ? 1 : v;
}

function capped( v: number, cap: number ): number {
    if ( ! Number.isFinite( v ) ) return 0;
    return v < -cap ? -cap : v > cap ? cap : v;
}

function side( v: number ): number {
    return v === 1 || v === -1 ? v : 0;
}

export function sanitizeInput( input: FlightInput, turnCap: number, out: FlightInput ): FlightInput {
    out.thrust = unit( input.thrust );
    out.strafe = unit( input.strafe );
    out.lift = unit( input.lift );
    out.roll = unit( input.roll );
    out.pitch = capped( input.pitch, turnCap );
    out.yaw = capped( input.yaw, turnCap );
    out.boost = input.boost === true;
    out.fire = input.fire === true;
    out.dash = side( input.dash );
    return out;
}
