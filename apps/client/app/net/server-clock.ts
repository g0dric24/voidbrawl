const OFFSET_DRIFT_MS = 0.5;

export interface ServerClock {
    offsetMs: number;
    synced: boolean;
}

export const serverClock: ServerClock = { offsetMs: 0, synced: false };

export function sampleServerTime( clock: ServerClock, serverSeconds: number, localMs: number ): void {
    const offset = localMs - serverSeconds * 1000;
    if ( ! clock.synced ) {
        clock.offsetMs = offset;
        clock.synced = true;
        return;
    }
    const drifted = clock.offsetMs + OFFSET_DRIFT_MS;
    clock.offsetMs = offset < drifted ? offset : drifted;
}

export function serverSecondsAt( clock: ServerClock, localMs: number ): number {
    return ( localMs - clock.offsetMs ) / 1000;
}

export function resetClock( clock: ServerClock ): void {
    clock.offsetMs = 0;
    clock.synced = false;
}
