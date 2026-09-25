import type { Room } from '@colyseus/sdk';
import type { Arena, MatchState } from '@voidbrawl/shared';
import { useWorld } from 'koota/react';
import { useEffect } from 'react';
import { attachMatch } from '../../net/attach-match';
import type { Predictor } from '../../net/prediction';

export function MatchLink( {
    room,
    predictor,
    arena,
}: {
    room: Room< MatchState >;
    predictor: Predictor;
    arena: Arena;
} ) {
    const world = useWorld();

    // JUSTIFIED EFFECT — syncs the Colyseus room's state callbacks (outside React) into the koota world; the room itself outlives this mount.
    useEffect( () => attachMatch( room, world, predictor, arena ), [ room, world, predictor, arena ] );

    return null;
}
