export const PICKUP = { none: 0, seeker: 1, mine: 2, shield: 3, health: 4, boost: 5 } as const;

export type PickupKind = ( typeof PICKUP )[ Exclude< keyof typeof PICKUP, 'none' > ];

export const PICKUP_NAMES: Record< PickupKind, string > = {
    1: 'Seeker',
    2: 'Mine',
    3: 'Shield',
    4: 'Health',
    5: 'Boost',
};

const WEIGHTS: readonly [ PickupKind, number ][] = [
    [ PICKUP.seeker, 3 ],
    [ PICKUP.mine, 2 ],
    [ PICKUP.shield, 2 ],
    [ PICKUP.health, 2 ],
    [ PICKUP.boost, 2 ],
];

const TOTAL_WEIGHT = WEIGHTS.reduce( ( sum, [ , w ] ) => sum + w, 0 );

export const PAD_RADIUS = 5;
export const PAD_RESPAWN = 12;
export const HEALTH_FRACTION = 0.5;

export const SEEKER = {
    coneCos: 0.9397,
    range: 300,
    speed: 170,
    turnRate: 1.6,
    life: 6,
    damage: 45,
    fuse: 2,
    muzzle: 3,
} as const;

export const MINE = {
    armDelay: 1,
    trigger: 18,
    blast: 26,
    damage: 55,
    life: 30,
    max: 3,
    drop: 6,
} as const;

export function isPickupKind( v: unknown ): v is PickupKind {
    return typeof v === 'number' && v >= PICKUP.seeker && v <= PICKUP.boost && Number.isInteger( v );
}

export function rollPickup( r: number ): PickupKind {
    let left = r * TOTAL_WEIGHT;
    for ( const [ kind, w ] of WEIGHTS ) {
        if ( left < w ) return kind;
        left -= w;
    }
    return WEIGHTS[ WEIGHTS.length - 1 ][ 0 ];
}

export function touchesPad(
    ship: { x: number; y: number; z: number },
    reach: number,
    pad: { x: number; y: number; z: number },
): boolean {
    const dx = ship.x - pad.x;
    const dy = ship.y - pad.y;
    const dz = ship.z - pad.z;
    const r = reach + PAD_RADIUS;
    return dx * dx + dy * dy + dz * dz <= r * r;
}
