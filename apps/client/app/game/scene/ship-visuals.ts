import { SHIP_SCALE, type ShipClassId } from '@voidbrawl/shared';

export interface ShipVisual {
    url: string;
    scale: number;
    facing: [ number, number, number ];
    tail: number;
}

export const SHIP_VISUALS: Record< ShipClassId, ShipVisual > = {
    fighter: { url: '/models/ships/challenger.gltf', scale: 0.2476 * SHIP_SCALE, facing: [ 0, 0, 0 ], tail: 3.6 },
    interceptor: { url: '/models/ships/executioner.gltf', scale: 0.1996 * SHIP_SCALE, facing: [ 0, 0, 0 ], tail: 2.6 },
    heavy: { url: '/models/ships/split-crown.glb', scale: SHIP_SCALE, facing: [ 0, Math.PI, 0 ], tail: 8.8 },
};
