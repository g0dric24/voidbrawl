import type { Room } from '@colyseus/sdk';
import type { MatchState } from '@voidbrawl/shared';

export const session: {
    room: Room< MatchState > | null;
    joining: { roomId: string; room: Promise< Room< MatchState > > } | null;
    lobby: Room | null;
} = {
    room: null,
    joining: null,
    lobby: null,
};
