import { useSyncExternalStore } from 'react';
import { currentFeed, subscribeFeed } from '../fx/kill-feed';

export function KillFeed() {
    const feed = useSyncExternalStore( subscribeFeed, currentFeed, currentFeed );

    return (
        <div className="absolute top-[12%] right-0 flex flex-col items-end gap-1 text-[clamp(10px,1.5vh,13px)] tracking-[0.14em] normal-case">
            { feed.map( ( entry ) => (
                <span key={ entry.id } className="text-readout">
                    { entry.text }
                </span>
            ) ) }
        </div>
    );
}
