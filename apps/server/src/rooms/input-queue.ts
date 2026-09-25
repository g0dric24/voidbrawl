import type { NetInput } from '@voidbrawl/shared';

export const MAX_QUEUED_INPUTS = 120;

export interface InputQueue {
    inputs: NetInput[];
    lastSeq: number;
}

export function createInputQueue(): InputQueue {
    return { inputs: [], lastSeq: 0 };
}

function wellFormed( input: unknown ): input is NetInput {
    const i = input as NetInput;
    return (
        typeof i === 'object' &&
        i !== null &&
        Number.isInteger( i.seq ) &&
        i.seq > 0 &&
        typeof i.thrust === 'number' &&
        typeof i.strafe === 'number' &&
        typeof i.lift === 'number' &&
        typeof i.roll === 'number' &&
        typeof i.pitch === 'number' &&
        typeof i.yaw === 'number'
    );
}

export function enqueue( q: InputQueue, batch: unknown ): void {
    if ( ! Array.isArray( batch ) ) return;
    for ( const input of batch ) {
        if ( ! wellFormed( input ) || input.seq <= q.lastSeq ) continue;
        q.inputs.push( input );
        q.lastSeq = input.seq;
    }
    if ( q.inputs.length > MAX_QUEUED_INPUTS ) q.inputs.splice( 0, q.inputs.length - MAX_QUEUED_INPUTS );
}
