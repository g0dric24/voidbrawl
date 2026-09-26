import { PHASE } from '@voidbrawl/shared';
import { useSyncExternalStore } from 'react';
import { Link } from 'react-router';
import { pointerLocked, subscribeMouse } from '../input/mouse';
import { ClassPicker } from './class-picker';
import { SoundControl } from './sound-control';
import { useMatch } from './use-match';

export function PauseMenu() {
    const locked = useSyncExternalStore( subscribeMouse, pointerLocked, () => false );
    const match = useMatch();
    const playing = match.phase === PHASE.countdown || match.phase === PHASE.live;
    if ( locked || ! playing ) return null;
    const you = match.pilots.find( ( p ) => p.id === match.youId );

    return (
        <div className="fixed bottom-[12%] left-1/2 z-40 flex w-[min(460px,92vw)] -translate-x-1/2 flex-col gap-4 border border-line bg-deep/90 p-4 font-readout text-readout uppercase">
            { you ? <ClassPicker current={ you.classId } next={ you.nextClassId } title="Ship at next spawn" /> : null }
            <SoundControl />
            <Link
                to="/lobby"
                className="self-center border border-line px-6 py-2 text-xs font-bold tracking-[0.3em] text-readout-dim hover:border-danger hover:text-danger focus-visible:border-danger focus-visible:text-danger focus-visible:outline-none"
            >
                Leave match
            </Link>
        </div>
    );
}
