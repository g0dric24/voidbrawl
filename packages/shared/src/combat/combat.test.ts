import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Arena } from '../arena/arena.js';
import { DEFAULT_ARENA, materializeArena } from '../arena/arena.js';
import { FIXED_DT } from '../sim/fixed-step.js';
import { SHIP_CLASSES } from '../sim/ship-classes.js';
import { emptyShip } from '../sim/ship-state.js';
import { type BoltTarget, boltPosition, launchBolt, sweepBolt } from './bolt.js';
import { stepGun } from './gun.js';
import { applyDamage, impactDamage, SHIELD_REGEN_DELAY, tickVitals, type Vitals } from './vitals.js';

const GUN = SHIP_CLASSES.fighter.gun;
const OPEN: Arena = { radius: 5000, asteroids: [], pillars: [], bases: materializeArena( DEFAULT_ARENA ).bases };

function fireFor( seconds: number, s = emptyShip() ) {
    let shots = 0;
    for ( let i = 0; i < Math.round( seconds / FIXED_DT ); i++ ) {
        stepGun( s, true, GUN, FIXED_DT );
        if ( s.shot ) shots++;
    }
    return { s, shots };
}

test( 'the gun fires at its interval while the trigger is held', () => {
    const { shots } = fireFor( 0.5 );
    assert.equal( shots, Math.ceil( 0.5 / GUN.fireInterval ) );
} );

test( 'holding the trigger overheats the gun, which then locks until it cools', () => {
    const { s } = fireFor( 3 );
    assert.equal( s.overheated, true );
    stepGun( s, true, GUN, FIXED_DT );
    assert.equal( s.shot, false );
    const heat0 = s.heat;
    let t = 0;
    while ( s.overheated ) {
        stepGun( s, false, GUN, FIXED_DT );
        t += FIXED_DT;
    }
    assert.ok( Math.abs( t - ( heat0 - GUN.unlockHeat ) / GUN.coolRate ) < 0.05 );
    stepGun( s, true, GUN, FIXED_DT );
    assert.equal( s.shot, true );
} );

function bolt( speed = 420 ) {
    const ship = emptyShip();
    return launchBolt( ship, 1.4, { ...GUN, boltSpeed: speed }, 'a', 0, 0 );
}

function target( id: string, z: number, team: 0 | 1 = 1 ): BoltTarget {
    return { id, team, x: 0, y: 0, z, radius: 1.4 };
}

test( 'a bolt flies straight along the nose', () => {
    const p = boltPosition( bolt(), 0.5 );
    assert.equal( p.x, 0 );
    assert.equal( p.y, 0 );
    assert.equal( p.z, 2.4 + 210 );
} );

test( 'a fast bolt never tunnels through a ship between two ticks', () => {
    const hit = sweepBolt( bolt( 2000 ), 0, FIXED_DT, OPEN, [ target( 'b', 15 ) ] );
    assert.deepEqual( hit?.kind, 'ship' );
} );

test( 'the nearest target along the path wins', () => {
    const arena: Arena = { ...OPEN, asteroids: [ { id: 7, x: 0, y: 0, z: 40, r: 5 } ] };
    const near = sweepBolt( bolt(), 0, 0.2, arena, [ target( 'b', 60 ) ] );
    assert.equal( near?.kind, 'rock' );
    const far = sweepBolt( bolt(), 0, 0.2, arena, [ target( 'b', 20 ) ] );
    assert.equal( far?.kind, 'ship' );
} );

test( 'bolts pass through the owner and teammates', () => {
    assert.equal( sweepBolt( bolt(), 0, 0.2, OPEN, [ target( 'a', 20 ), target( 'mate', 30, 0 ) ] ), null );
} );

test( 'a bolt that reaches the arena wall stops there', () => {
    const small: Arena = { ...OPEN, radius: 50 };
    const hit = sweepBolt( bolt(), 0, 0.5, small, [] );
    assert.equal( hit?.kind, 'wall' );
    assert.ok( hit && Math.abs( boltPosition( bolt(), 0.5 * hit.t ).z - 50 ) < 1e-6 );
} );

function vitals(): Vitals {
    return { hull: 100, shield: 50, maxShield: 50, shieldDelay: 0, protect: 0, dead: false };
}

test( 'damage drains the shield before the hull and kills at zero hull', () => {
    const v = vitals();
    assert.deepEqual( applyDamage( v, 30 ), { shieldHit: 30, hullHit: 0, killed: false } );
    assert.deepEqual( applyDamage( v, 30 ), { shieldHit: 20, hullHit: 10, killed: false } );
    assert.equal( v.hull, 90 );
    assert.equal( applyDamage( v, 500 ).killed, true );
    assert.equal( v.dead, true );
    assert.equal( v.hull, 0 );
} );

test( 'spawn protection absorbs damage', () => {
    const v = { ...vitals(), protect: 1 };
    assert.equal( applyDamage( v, 80 ).killed, false );
    assert.equal( v.hull, 100 );
    assert.equal( v.shield, 50 );
} );

test( 'the shield regenerates only after the delay, and the hull never does', () => {
    const v = vitals();
    applyDamage( v, 70 );
    for ( let t = 0; t < SHIELD_REGEN_DELAY - 0.1; t += FIXED_DT ) tickVitals( v, FIXED_DT );
    assert.equal( v.shield, 0 );
    for ( let t = 0; t < 10; t += FIXED_DT ) tickVitals( v, FIXED_DT );
    assert.equal( v.shield, 50 );
    assert.equal( v.hull, 80 );
} );

test( 'gentle bumps do no damage, hard crashes do', () => {
    assert.equal( impactDamage( 10 ), 0 );
    assert.ok( impactDamage( 60 ) > 20 );
} );
