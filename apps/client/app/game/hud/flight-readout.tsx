import { addEffect } from '@react-three/fiber';
import { SHIP_CLASSES, type ShipClassId } from '@voidbrawl/shared';
import { useEffect, useRef } from 'react';
import { LocalPlayer, Pilot } from '../ecs/traits';
import { world } from '../ecs/world';
import { viewPose } from '../view-pose';

export function FlightReadout() {
    const speedRef = useRef< HTMLSpanElement >( null );
    const boostRef = useRef< HTMLDivElement >( null );
    const classRef = useRef< HTMLSpanElement >( null );

    // JUSTIFIED EFFECT — brackets a frame subscription to R3F's render loop, an outside-React system, to this mount.
    useEffect(
        () =>
            addEffect( () => {
                if ( speedRef.current ) speedRef.current.textContent = String( Math.round( viewPose.speed ) );
                boostRef.current?.style.setProperty( '--boost', String( viewPose.boost ) );
                const classId = world.queryFirst( LocalPlayer, Pilot )?.get( Pilot )?.classId as
                    | ShipClassId
                    | undefined;
                if ( classRef.current && classId ) classRef.current.textContent = SHIP_CLASSES[ classId ].name;
            } ),
        [],
    );

    return (
        <div className="absolute bottom-0 left-0 flex flex-col gap-[0.6em]">
            <span
                ref={ classRef }
                className="text-[clamp(11px,1.8vh,16px)] font-semibold tracking-[0.22em] text-readout-dim"
            />
            <div className="flex items-baseline gap-[0.22em] leading-none">
                <span ref={ speedRef } className="text-[clamp(34px,6.1vh,62px)] font-bold tabular-nums">
                    0
                </span>
                <span className="text-[clamp(11px,2vh,20px)] tracking-[0.06em] text-readout-dim normal-case">u/s</span>
            </div>
            <div className="flex items-center gap-3 text-[clamp(10px,1.6vh,14px)] font-semibold tracking-[0.2em]">
                <span className="text-readout-dim">Boost</span>
                <div ref={ boostRef } className="h-[6px] w-[clamp(120px,14vw,220px)] bg-space [--boost:1]">
                    <div className="h-full w-[calc(var(--boost)*100%)] bg-marigold shadow-meter" />
                </div>
            </div>
        </div>
    );
}
