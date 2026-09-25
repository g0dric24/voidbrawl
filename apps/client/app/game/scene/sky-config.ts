const DEGREES_PER_RADIAN = 180 / Math.PI;

export function skyDirection( bearingDeg: number, elevationDeg: number ): [ number, number, number ] {
    const bearing = bearingDeg / DEGREES_PER_RADIAN;
    const elevation = elevationDeg / DEGREES_PER_RADIAN;
    const horizontal = Math.cos( elevation );
    return [ -horizontal * Math.sin( bearing ), Math.sin( elevation ), horizontal * Math.cos( bearing ) ];
}
