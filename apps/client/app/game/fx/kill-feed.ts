export interface FeedEntry {
    id: number;
    text: string;
    at: number;
}

const MAX_ENTRIES = 5;
const listeners = new Set< () => void >();
let entries: FeedEntry[] = [];
let nextId = 0;

export function subscribeFeed( listener: () => void ): () => void {
    listeners.add( listener );
    return () => {
        listeners.delete( listener );
    };
}

export function currentFeed(): FeedEntry[] {
    return entries;
}

export function pushFeed( text: string ): void {
    entries = [ ...entries, { id: nextId++, text, at: performance.now() } ].slice( -MAX_ENTRIES );
    for ( const listener of listeners ) listener();
}

export function clearFeed(): void {
    entries = [];
    for ( const listener of listeners ) listener();
}
