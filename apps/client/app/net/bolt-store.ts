import type { BoltLaunch } from '@voidbrawl/shared';

export interface NetBolt extends BoltLaunch {
    tEnd: number;
    struck: boolean;
    sparked: boolean;
}

export const netBolts = new Map< string, NetBolt >();
