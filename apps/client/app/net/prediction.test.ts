import {
    copyShip,
    DEFAULT_ARENA,
    FIXED_DT,
    idleInput,
    materializeArena,
    type NetInput,
    SHIP_CLASSES,
    spawnShip,
    stepShip,
} from '@voidbrawl/shared';
import { describe, expect, it } from 'vitest';
import { createPredictor } from './prediction';

const ARENA = materializeArena( DEFAULT_ARENA );
const TUNING = SHIP_CLASSES.fighter.tuning;

function script( seq: number ): NetInput {
    return { ...idleInput(), seq, thrust: 1, yaw: ( seq % 7 ) * 0.004, roll: ( seq % 3 ) - 1, strafe: 0.5 };
}

describe( 'predictor', () => {
    it( 'replaying unacknowledged inputs on the server state reproduces the prediction exactly', () => {
        const predictor = createPredictor();
        const predicted = spawnShip( ARENA, 0, 0 );
        const server = { ...spawnShip( ARENA, 0, 0 ), lastProcessedInput: 0, classId: 'fighter' };
        for ( let i = 0; i < 90; i++ ) {
            const input = script( predictor.nextSeq() );
            predictor.record( input );
            stepShip( predicted, input, TUNING, ARENA, FIXED_DT );
            if ( i < 60 ) {
                stepShip( server, input, TUNING, ARENA, FIXED_DT );
                server.lastProcessedInput = input.seq;
            }
        }
        const reconciled = spawnShip( ARENA, 0, 0 );
        predictor.reconcile( reconciled, server, ARENA );
        expect( reconciled ).toEqual( predicted );
        expect( predictor.pendingCount() ).toBe( 30 );
    } );

    it( 'a server correction wins and the pending inputs replay on top of it', () => {
        const predictor = createPredictor();
        for ( let i = 0; i < 10; i++ ) predictor.record( script( predictor.nextSeq() ) );
        const server = { ...spawnShip( ARENA, 1, 0 ), lastProcessedInput: 4, classId: 'fighter' };
        const expected = spawnShip( ARENA, 1, 0 );
        for ( let seq = 5; seq <= 10; seq++ ) stepShip( expected, script( seq ), TUNING, ARENA, FIXED_DT );
        const sim = spawnShip( ARENA, 0, 0 );
        predictor.reconcile( sim, server, ARENA );
        const plain = spawnShip( ARENA, 0, 0 );
        copyShip( plain, sim );
        expect( plain ).toEqual( expected );
    } );

    it( 'each input is sent exactly once', () => {
        const predictor = createPredictor();
        predictor.record( script( predictor.nextSeq() ) );
        predictor.record( script( predictor.nextSeq() ) );
        expect( predictor.drainUnsent().map( ( i ) => i.seq ) ).toEqual( [ 1, 2 ] );
        predictor.record( script( predictor.nextSeq() ) );
        expect( predictor.drainUnsent().map( ( i ) => i.seq ) ).toEqual( [ 3 ] );
        expect( predictor.drainUnsent() ).toEqual( [] );
    } );
} );
