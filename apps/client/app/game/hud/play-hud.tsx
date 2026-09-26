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
import { LockReticle } from './lock-reticle';
import { MissileWarning } from './missile-warning';
import { PilotsReadout } from './pilots-readout';
import { ShipMarkers } from './ship-markers';
import { StickCursor } from './stick-cursor';
import { UtilitySlots } from './utility-slots';
import { VitalsReadout } from './vitals-readout';

export function PlayHud() {
    return (
        <Fragment>
            <DamageFlash />
            <ShipMarkers />
            <LockReticle />
            <HudLayer>
                <StickCursor />
                <HitMarker />
                <EdgeWarning />
                <MissileWarning />
                <PilotsReadout />
                <AimModeReadout />
                <KillFeed />
                <HeatMeter />
                <VitalsReadout />
                <UtilitySlots />
                <DeathOverlay />
                <FlightReadout />
                <ControlsHint mode="play" />
            </HudLayer>
        </Fragment>
    );
}
