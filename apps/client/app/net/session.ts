import type { Room } from '@colyseus/sdk';
import type { MatchState } from '@voidbrawl/shared';

export const session: { room: Room< MatchState > | null; joining: Promise< Room< MatchState > > | null } = {
    room: null,
    joining: null,
};
