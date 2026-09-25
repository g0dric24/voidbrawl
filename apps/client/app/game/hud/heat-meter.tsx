import { addEffect } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { viewPose } from '../view-pose';

export function HeatMeter() {
    const ref = useRef< HTMLDivElement >( null );

    // JUSTIFIED EFFECT — brackets a frame subscription to R3F's render loop, an outside-React system, to this mount.
    useEffect(
        () =>
            addEffect( () => {
                const el = ref.current;
                if ( ! el ) return;
                el.style.setProperty( '--heat', String( viewPose.heat ) );
                el.dataset.hot = viewPose.overheated ? 'true' : 'false';
            } ),
        [],
    );

    return (
        <div
            ref={ ref }
            className="group absolute bottom-[18%] left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 [--heat:0]"
        >
            <div className="h-[4px] w-[clamp(120px,14vw,200px)] bg-space/80">
                <div className="h-full w-[calc(var(--heat)*100%)] bg-readout group-data-[hot=true]:bg-danger" />
            </div>
            <span className="text-[clamp(9px,1.3vh,12px)] font-bold tracking-[0.3em] text-danger opacity-0 group-data-[hot=true]:opacity-100 text-shadow-danger">
                Overheat
            </span>
        </div>
    );
}
