export interface FlightTuning {
    hullRadius: number;
    thrustAccel: number;
    reverseAccel: number;
    strafeAccel: number;
    drag: number;
    turnRate: number;
    rollRate: number;
    rollResponse: number;
    boostAccel: number;
    boostDrain: number;
    boostRegen: number;
    restitution: number;
    dashSpeed: number;
    dashCooldown: number;
}

export function topSpeed( t: FlightTuning ): number {
    return t.thrustAccel / t.drag;
}

export function boostSpeed( t: FlightTuning ): number {
    return ( t.thrustAccel * t.boostAccel ) / t.drag;
}
