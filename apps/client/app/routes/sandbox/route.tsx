import { Fragment } from 'react';
import { TuningPanelMount } from '../../dev/tuning-panel-mount';
import { PointerPrompt } from '../../game/hud/pointer-prompt';
import { SandboxCanvas } from './sandbox-canvas';

export function meta() {
    return [
        { title: 'VOIDBRAWL — Flight Sandbox' },
        { name: 'description', content: 'Fly one ship in the arena (no network)' },
    ];
}

export default function Sandbox() {
    return (
        <Fragment>
            <SandboxCanvas />
            <PointerPrompt />
            <TuningPanelMount />
        </Fragment>
    );
}
