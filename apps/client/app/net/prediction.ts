import {
    type Arena,
    classOf,
    copyShip,
    FIXED_DT,
    type NetInput,
    SHIP_CLASSES,
    type ShipState,
    stepPilot,
} from '@voidbrawl/shared';

export interface Authoritative extends ShipState {
    lastProcessedInput: number;
    classId: string;
}

interface Pending {
    input: NetInput;
    sent: boolean;
}

export interface Predictor {
    nextSeq(): number;
    record( input: NetInput ): void;
    drainUnsent(): NetInput[];
    reconcile( sim: ShipState, auth: Authoritative, arena: Arena ): void;
    pendingCount(): number;
}

export function createPredictor(): Predictor {
    const pending: Pending[] = [];
    let seq = 0;
    return {
        nextSeq() {
            seq += 1;
            return seq;
        },
        record( input ) {
            pending.push( { input, sent: false } );
        },
        drainUnsent() {
            const out: NetInput[] = [];
            for ( const p of pending ) {
                if ( p.sent ) continue;
                p.sent = true;
                out.push( p.input );
            }
            return out;
        },
        reconcile( sim, auth, arena ) {
            copyShip( sim, auth );
            while ( pending.length > 0 && pending[ 0 ].input.seq <= auth.lastProcessedInput ) pending.shift();
            const ship = SHIP_CLASSES[ classOf( auth ) ];
            for ( const p of pending ) stepPilot( sim, p.input, ship, arena, FIXED_DT );
        },
        pendingCount() {
            return pending.length;
        },
    };
}
