import type { ShipClassId } from '@voidbrawl/shared';

export interface ShipVisual {
    url: string;
    scale: number;
    facing: [ number, number, number ];
}

export const SHIP_VISUALS: Record< ShipClassId, ShipVisual > = {
    fighter: { url: '/models/ships/challenger.gltf', scale: 0.2476, facing: [ 0, 0, 0 ] },
    interceptor: { url: '/models/ships/executioner.gltf', scale: 0.1996, facing: [ 0, 0, 0 ] },
    heavy: { url: '/models/ships/split-crown.glb', scale: 1, facing: [ 0, Math.PI, 0 ] },
};
