import { useSyncExternalStore } from 'react';
import { aimMode, subscribeMouse } from '../input/mouse';

export function AimModeReadout() {
    const mode = useSyncExternalStore( subscribeMouse, aimMode, aimMode );

    return (
        <div className="absolute top-0 right-0 text-[clamp(10px,1.6vh,14px)] font-semibold tracking-[0.2em]">
            <span className="text-readout-dim">Aim </span>
            <span className="text-marigold">{ mode === 'direct' ? 'direct' : 'joystick' }</span>
        </div>
    );
}
