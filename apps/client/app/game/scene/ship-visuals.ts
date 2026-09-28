import type { ShipClassId } from '@voidbrawl/shared';

export interface ShipVisual {
    url: string;
    scale: number;
    facing: [ number, number, number ];
    tail: number;
}

export const SHIP_VISUALS: Record< ShipClassId, ShipVisual > = {
    fighter: { url: '/models/ships/kit-fighter.glb', scale: 1, facing: [ 0, 0, 0 ], tail: 3.6 },
    interceptor: { url: '/models/ships/kit-interceptor.glb', scale: 0.78, facing: [ 0, 0, 0 ], tail: 2.6 },
    heavy: { url: '/models/ships/kit-heavy.glb', scale: 1.42, facing: [ 0, 0, 0 ], tail: 8.8 },
};
