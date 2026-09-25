import { useSyncExternalStore } from 'react';
import { currentRoster, subscribeRoster } from '../../net/roster-store';

export function PilotsReadout() {
    const roster = useSyncExternalStore( subscribeRoster, currentRoster, currentRoster );

    return (
        <div className="absolute top-0 left-0 flex flex-col gap-1 text-[clamp(10px,1.6vh,14px)] font-semibold tracking-[0.2em]">
            <div className="flex gap-4">
                <span className="text-marigold">Marigold { roster.marigold }</span>
                <span className="text-cyan">Cyan { roster.cyan }</span>
            </div>
            { roster.you !== null && (
                <span className="text-readout-dim">
                    You fly{ ' ' }
                    <span className={ roster.you === 0 ? 'text-marigold' : 'text-cyan' }>
                        { roster.you === 0 ? 'Marigold' : 'Cyan' }
                    </span>
                </span>
            ) }
        </div>
    );
}
