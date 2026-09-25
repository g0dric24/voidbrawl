import { AimModeReadout } from './aim-mode-readout';
import { ControlsHint } from './controls-hint';
import { EdgeWarning } from './edge-warning';
import { FlightReadout } from './flight-readout';
import { HudLayer } from './hud-layer';
import { PilotsReadout } from './pilots-readout';
import { StickCursor } from './stick-cursor';

export function PlayHud() {
    return (
        <HudLayer>
            <StickCursor />
            <EdgeWarning />
            <PilotsReadout />
            <AimModeReadout />
            <FlightReadout />
            <ControlsHint />
        </HudLayer>
    );
}
