import assert from 'node:assert/strict';
import { test } from 'node:test';
import { launchBolt, sweepBolt } from '../combat/bolt.js';
import { FIXED_DT } from '../sim/fixed-step.js';
import { idleInput } from '../sim/input.js';
import { SHIP_CLASSES } from '../sim/ship-classes.js';
import { emptyShip } from '../sim/ship-state.js';
import { stepShip } from '../sim/step.js';
import { type Arena, CENTER_CLEAR, DEFAULT_ARENA, materializeArena, PILLAR_RING } from './arena.js';

const ARENA = materializeArena( DEFAULT_ARENA );
const PILLAR_ONLY: Arena = { ...ARENA, asteroids: [] };
const FIGHTER = SHIP_CLASSES.fighter;

test( 'eight pillars ring the centre and stay inside the rock-free zone', () => {
    assert.equal( ARENA.pillars.length, 8 );
    for ( const b of ARENA.pillars ) {
        const cx = ( b.x0 + b.x1 ) / 2;
        const cz = ( b.z0 + b.z1 ) / 2;
        assert.ok( Math.abs( Math.hypot( cx, cz ) - PILLAR_RING ) < 1e-9 );
        const far = Math.hypot(
            Math.max( Math.abs( b.x0 ), Math.abs( b.x1 ) ),
            b.y1,
            Math.max( Math.abs( b.z0 ), Math.abs( b.z1 ) ),
        );
        assert.ok( far < CENTER_CLEAR );
    }
} );

test( 'a ship flown at a pillar never ends inside it', () => {
    const s = emptyShip();
    s.x = PILLAR_RING;
    s.z = -60;
    const box = ARENA.pillars[ 0 ];
    let hit = false;
    for ( let i = 0; i < 300; i++ ) {
        stepShip( s, { ...idleInput(), thrust: 1 }, FIGHTER.tuning, PILLAR_ONLY, FIXED_DT );
        const inside = s.x > box.x0 && s.x < box.x1 && s.y > box.y0 && s.y < box.y1 && s.z > box.z0 && s.z < box.z1;
        assert.equal( inside, false );
        if ( s.impact > 0 ) hit = true;
    }
    assert.ok( hit );
} );

test( 'a bolt stops on a pillar', () => {
    const s = emptyShip();
    s.x = PILLAR_RING;
    s.z = -60;
    const bolt = launchBolt( s, FIGHTER.tuning.hullRadius, FIGHTER.gun, 'a', 0, 0 );
    const hit = sweepBolt( bolt, 0, 0.5, PILLAR_ONLY, [] );
    assert.equal( hit?.kind, 'pillar' );
} );
