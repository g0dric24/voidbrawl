import { Fragment } from 'react';
import { redirect } from 'react-router';
import { TuningPanelMount } from '../../dev/tuning-panel-mount';
import { PointerPrompt } from '../../game/hud/pointer-prompt';
import { SandboxCanvas } from './sandbox-canvas';

export function meta() {
    return [
        { title: 'VOIDBRAWL — Flight Sandbox' },
        { name: 'description', content: 'Debug only: fly one ship in the arena (no network)' },
    ];
}

export function clientLoader() {
    if ( ! import.meta.env.DEV ) throw redirect( '/' );
    return null;
}

export default function Sandbox() {
    return (
        <Fragment>
            <SandboxCanvas />
            <PointerPrompt inMatch={ false } />
            <TuningPanelMount />
        </Fragment>
    );
}
