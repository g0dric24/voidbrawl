import { Fragment } from 'react';
import { redirect } from 'react-router';
import { TuningPanelMount } from '../../dev/tuning-panel-mount';
import { PointerPrompt } from '../../game/hud/pointer-prompt';
import { callSign } from '../../net/call-sign';
import { joinMatch, waitForArena } from '../../net/matchmaking';
import type { Route } from './+types/route';
import { PlayCanvas } from './play-canvas';

export function meta() {
    return [ { title: 'VOIDBRAWL — Match' }, { name: 'description', content: 'Networked flight in the arena' } ];
}

export async function clientLoader() {
    try {
        const room = await joinMatch( callSign() );
        const descriptor = await waitForArena( room );
        return { room, descriptor };
    } catch {
        throw redirect( '/?server=down' );
    }
}

export function shouldRevalidate() {
    return false;
}

export default function Play( { loaderData }: Route.ComponentProps ) {
    return (
        <Fragment>
            <PlayCanvas room={ loaderData.room } descriptor={ loaderData.descriptor } />
            <PointerPrompt />
            <TuningPanelMount />
        </Fragment>
    );
}
