import { PICKUP, type PickupKind } from '@voidbrawl/shared';

export const PICKUP_COLORS: Record< PickupKind, string > = {
    [ PICKUP.seeker ]: '#ff5a4f',
    [ PICKUP.mine ]: '#c77dff',
    [ PICKUP.shield ]: '#9fc4ff',
    [ PICKUP.health ]: '#6ee7a0',
    [ PICKUP.boost ]: '#ffe066',
};
