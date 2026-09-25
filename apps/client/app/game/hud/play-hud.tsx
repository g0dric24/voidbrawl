import { Fragment } from 'react';
import { AimModeReadout } from './aim-mode-readout';
import { ControlsHint } from './controls-hint';
import { DamageFlash } from './damage-flash';
import { DeathOverlay } from './death-overlay';
import { EdgeWarning } from './edge-warning';
import { FlightReadout } from './flight-readout';
import { HeatMeter } from './heat-meter';
import { HitMarker } from './hit-marker';
import { HudLayer } from './hud-layer';
import { KillFeed } from './kill-feed';
import { PilotsReadout } from './pilots-readout';
import { StickCursor } from './stick-cursor';
import { VitalsReadout } from './vitals-readout';

export function PlayHud() {
    return (
        <Fragment>
            <DamageFlash />
            <HudLayer>
                <StickCursor />
                <HitMarker />
                <EdgeWarning />
                <PilotsReadout />
                <AimModeReadout />
                <KillFeed />
                <HeatMeter />
                <VitalsReadout />
                <DeathOverlay />
                <FlightReadout />
                <ControlsHint mode="play" />
            </HudLayer>
        </Fragment>
    );
}
