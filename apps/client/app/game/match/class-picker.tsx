import { SET_CLASS_MESSAGE, SHIP_CLASSES, SHIP_ORDER, type ShipClassId } from '@voidbrawl/shared';
import { sendToRoom } from './send';

interface ClassPickerProps {
    current: ShipClassId;
    next: ShipClassId | '';
    title: string;
}

export function ClassPicker( { current, next, title }: ClassPickerProps ) {
    const chosen = next || current;

    return (
        <div className="flex flex-col gap-2">
            <span className="text-[11px] tracking-[0.25em] text-readout-dim">{ title }</span>
            <div className="grid grid-cols-3 gap-2">
                { SHIP_ORDER.map( ( id ) => {
                    const ship = SHIP_CLASSES[ id ];
                    const picked = id === chosen;
                    return (
                        <button
                            key={ id }
                            type="button"
                            aria-pressed={ picked }
                            onClick={ () => sendToRoom( SET_CLASS_MESSAGE, id ) }
                            className="flex flex-col gap-1 border border-line bg-space/60 p-2 text-left hover:border-readout focus-visible:border-readout focus-visible:outline-none aria-pressed:border-marigold aria-pressed:bg-marigold/10"
                        >
                            <span className="text-xs font-bold tracking-[0.2em] text-readout">{ ship.name }</span>
                            <span className="text-[10px] tracking-[0.1em] text-readout-dim normal-case">
                                { ship.role }
                            </span>
                            <span className="text-[10px] leading-snug tracking-[0.05em] text-readout normal-case">
                                { ship.trait }
                            </span>
                        </button>
                    );
                } ) }
            </div>
        </div>
    );
}
