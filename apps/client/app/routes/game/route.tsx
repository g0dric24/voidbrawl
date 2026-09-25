import { Fragment } from 'react';
import { redirect } from 'react-router';
import { TuningPanelMount } from '../../dev/tuning-panel-mount';
import { PointerPrompt } from '../../game/hud/pointer-prompt';
import { MatchOverlays } from '../../game/match/match-overlays';
import { callSign } from '../../net/call-sign';
import { joinMatch, waitForArena } from '../../net/matchmaking';
import type { Route } from './+types/route';
import { PlayCanvas } from './play-canvas';

export function meta() {
    return [ { title: 'VOIDBRAWL — Match' }, { name: 'description', content: 'Team deathmatch in the arena' } ];
}

export async function clientLoader( { params }: Route.ClientLoaderArgs ) {
    try {
        const room = await joinMatch( params.roomId, callSign() );
        const descriptor = await waitForArena( room );
        return { room, descriptor };
    } catch {
        throw redirect( '/lobby?room=unavailable' );
    }
}

export function shouldRevalidate() {
    return false;
}

export default function Game( { loaderData }: Route.ComponentProps ) {
    return (
        <Fragment>
            <PlayCanvas room={ loaderData.room } descriptor={ loaderData.descriptor } />
            <MatchOverlays />
            <PointerPrompt inMatch />
            <TuningPanelMount />
        </Fragment>
    );
}
