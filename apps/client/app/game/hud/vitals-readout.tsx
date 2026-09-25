import { addEffect } from '@react-three/fiber';
import { SHIP_CLASSES } from '@voidbrawl/shared';
import { useEffect, useRef } from 'react';
import { LocalPlayer, Pilot, Vital } from '../ecs/traits';
import { world } from '../ecs/world';

export function VitalsReadout() {
    const ref = useRef< HTMLDivElement >( null );

    // JUSTIFIED EFFECT — brackets a frame subscription to R3F's render loop, an outside-React system, to this mount.
    useEffect(
        () =>
            addEffect( () => {
                const el = ref.current;
                const e = world.queryFirst( LocalPlayer, Pilot, Vital );
                const vital = e?.get( Vital );
                const pilot = e?.get( Pilot );
                if ( ! el || ! vital || ! pilot ) return;
                const ship = SHIP_CLASSES[ pilot.classId ];
                el.style.setProperty( '--hull', String( vital.hull / ship.hull ) );
                el.style.setProperty( '--shield', String( vital.shield / ship.shield ) );
            } ),
        [],
    );

    return (
        <div
            ref={ ref }
            className="absolute bottom-[9%] left-1/2 flex -translate-x-1/2 flex-col gap-[5px] [--hull:1] [--shield:1]"
        >
            <div className="h-[5px] w-[clamp(180px,22vw,320px)] bg-space/80">
                <div className="h-full w-[calc(var(--shield)*100%)] bg-cyan" />
            </div>
            <div className="h-[8px] w-[clamp(180px,22vw,320px)] bg-space/80">
                <div className="h-full w-[calc(var(--hull)*100%)] bg-readout" />
            </div>
        </div>
    );
}
