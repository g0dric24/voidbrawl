import { describe, expect, it } from 'vitest';
import { type ServerClock, sampleServerTime, serverSecondsAt } from './server-clock';

function clock(): ServerClock {
    return { offsetMs: 0, synced: false };
}

describe( 'server clock', () => {
    it( 'maps local time onto server time from the first sample', () => {
        const c = clock();
        sampleServerTime( c, 10, 5000 );
        expect( serverSecondsAt( c, 5500 ) ).toBeCloseTo( 10.5 );
    } );

    it( 'keeps the fastest (least delayed) sample', () => {
        const c = clock();
        sampleServerTime( c, 10, 5030 );
        sampleServerTime( c, 10.05, 5052 );
        expect( serverSecondsAt( c, 5052 ) ).toBeCloseTo( 10.05 );
    } );

    it( 'drifts slowly toward later samples instead of jumping', () => {
        const c = clock();
        sampleServerTime( c, 10, 5000 );
        sampleServerTime( c, 10.05, 5150 );
        expect( c.offsetMs ).toBeCloseTo( -5000 + 0.5 );
    } );
} );
