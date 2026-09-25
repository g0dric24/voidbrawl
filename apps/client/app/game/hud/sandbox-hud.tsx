import { AimModeReadout } from './aim-mode-readout';
import { ControlsHint } from './controls-hint';
import { EdgeWarning } from './edge-warning';
import { FlightReadout } from './flight-readout';
import { HudLayer } from './hud-layer';
import { StickCursor } from './stick-cursor';

export function SandboxHud() {
    return (
        <HudLayer>
            <StickCursor />
            <EdgeWarning />
            <AimModeReadout />
            <FlightReadout />
            <ControlsHint />
        </HudLayer>
    );
}
