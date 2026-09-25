import assert from 'node:assert/strict';
import { test } from 'node:test';
import { type Arena, DEFAULT_ARENA, materializeArena } from '../arena/arena.js';
import { FIXED_DT } from './fixed-step.js';
import { boostSpeed, topSpeed } from './flight-tuning.js';
import { type FlightInput, idleInput } from './input.js';
import { forwardOf, rightOf, upOf, vec3 } from './quat.js';
import { SHIP_CLASSES } from './ship-classes.js';
import { emptyShip, type ShipState } from './ship-state.js';
import { stepShip } from './step.js';

const FIGHTER = SHIP_CLASSES.fighter.tuning;
const EMPTY: Arena = {
    radius: 10_000,
    asteroids: [],
    bases: materializeArena( DEFAULT_ARENA ).bases,
};

function input( patch: Partial< FlightInput > ): FlightInput {
    return { ...idleInput(), ...patch };
}

function fly( s: ShipState, i: FlightInput, seconds: number, arena: Arena = EMPTY ): ShipState {
    const ticks = Math.round( seconds / FIXED_DT );
    for ( let n = 0; n < ticks; n++ ) stepShip( s, i, FIGHTER, arena, FIXED_DT );
    return s;
}

function speed( s: ShipState ): number {
    return Math.sqrt( s.vx * s.vx + s.vy * s.vy + s.vz * s.vz );
}

test( 'positive pitch raises the nose', () => {
    const s = fly( emptyShip(), input( { pitch: 0.02 } ), 0.3 );
    assert.ok( forwardOf( s, vec3() ).y > 0.2 );
} );

test( 'positive yaw turns the nose to the right', () => {
    const s = fly( emptyShip(), input( { yaw: 0.02 } ), 0.3 );
    const f = forwardOf( s, vec3() );
    assert.ok( f.x < -0.2 );
} );

test( 'positive roll drops the right wing', () => {
    const s = fly( emptyShip(), input( { roll: 1 } ), 0.3 );
    assert.ok( rightOf( s, vec3() ).y < -0.2 );
    assert.ok( upOf( s, vec3() ).x < -0.2 );
} );

test( 'turn requests above the class turn rate are capped', () => {
    const a = fly( emptyShip(), input( { yaw: 10 } ), 0.2 );
    const b = fly( emptyShip(), input( { yaw: FIGHTER.turnRate * FIXED_DT } ), 0.2 );
    assert.deepEqual( a, b );
} );

test( 'full thrust converges on the class top speed', () => {
    const s = fly( emptyShip(), input( { thrust: 1 } ), 12 );
    assert.ok( Math.abs( speed( s ) - topSpeed( FIGHTER ) ) / topSpeed( FIGHTER ) < 0.05 );
} );

test( 'boost raises speed above top speed and drains the meter', () => {
    const s = fly( emptyShip(), input( { thrust: 1, boost: true } ), 2 );
    assert.ok( speed( s ) > topSpeed( FIGHTER ) );
    assert.ok( speed( s ) < boostSpeed( FIGHTER ) );
    assert.ok( s.boost < 0.3 );
} );

test( 'the meter refills when boost is released', () => {
    const s = fly( emptyShip(), input( { thrust: 1, boost: true } ), 3 );
    assert.equal( s.boost, 0 );
    fly( s, input( { thrust: 1 } ), 10 );
    assert.equal( s.boost, 1 );
} );

test( 'with no input the ship comes to rest (hover)', () => {
    const s = fly( emptyShip(), input( { thrust: 1, strafe: 1, lift: 1 } ), 3 );
    fly( s, idleInput(), 10 );
    assert.ok( speed( s ) < 0.01 );
} );

test( 'roll rate decays to zero when roll is released', () => {
    const s = fly( emptyShip(), input( { roll: 1 } ), 1 );
    fly( s, idleInput(), 2 );
    assert.ok( Math.abs( s.rollRate ) < 1e-6 );
} );

test( 'strafe moves along the ship right axis', () => {
    const s = fly( emptyShip(), input( { strafe: 1 } ), 0.5 );
    assert.ok( s.x < -1 );
    assert.ok( Math.abs( s.z ) < 1e-9 );
} );

test( 'bad input values are ignored, never propagated', () => {
    const s = fly( emptyShip(), input( { thrust: Number.NaN, yaw: Number.POSITIVE_INFINITY, roll: 7 } ), 0.5 );
    for ( const v of Object.values( s ) ) if ( typeof v === 'number' ) assert.ok( Number.isFinite( v ) );
} );

test( 'identical inputs give bit-identical states', () => {
    const script = ( n: number ) =>
        input( {
            thrust: ( n % 7 ) / 6,
            strafe: ( ( n % 5 ) - 2 ) / 2,
            pitch: ( ( n % 11 ) - 5 ) * 0.004,
            roll: ( n % 3 ) - 1,
        } );
    const run = () => {
        const s = emptyShip();
        for ( let n = 0; n < 3600; n++ ) stepShip( s, script( n ), FIGHTER, EMPTY, FIXED_DT );
        return s;
    };
    const a = run();
    const b = run();
    for ( const key of Object.keys( a ) as ( keyof ShipState )[] ) assert.ok( Object.is( a[ key ], b[ key ] ), key );
} );

test( 'a ship flown into an asteroid never ends inside it and bounces back', () => {
    const rock = { id: 0, x: 0, y: 0, z: 60, r: 20 };
    const arena: Arena = { ...EMPTY, asteroids: [ rock ] };
    const s = emptyShip();
    let minGap = Number.POSITIVE_INFINITY;
    let hit = false;
    for ( let n = 0; n < 600; n++ ) {
        stepShip( s, input( { thrust: 1 } ), FIGHTER, arena, FIXED_DT );
        const gap = Math.sqrt( s.x * s.x + s.y * s.y + ( s.z - rock.z ) ** 2 ) - rock.r - FIGHTER.hullRadius;
        minGap = Math.min( minGap, gap );
        if ( s.impact > 0 ) hit = true;
    }
    assert.ok( hit );
    assert.ok( minGap > -1e-9 );
} );

test( 'the sphere wall holds the hull inside on every tick and bounces the ship', () => {
    const arena: Arena = { ...EMPTY, radius: 100 };
    const s = emptyShip();
    let hit = false;
    for ( let n = 0; n < 1200; n++ ) {
        stepShip( s, input( { thrust: 1, boost: true, yaw: n % 240 < 120 ? 0.01 : 0 } ), FIGHTER, arena, FIXED_DT );
        const reach = Math.sqrt( s.x * s.x + s.y * s.y + s.z * s.z ) + FIGHTER.hullRadius;
        assert.ok( reach <= arena.radius + 1e-9 );
        if ( s.impact > 0 ) hit = true;
    }
    assert.ok( hit );
} );
