import type { Arena } from '@voidbrawl/shared';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { rockBetween } from './line-of-sight';

const ARENA = { radius: 600, asteroids: [ { id: 0, x: 0, y: 0, z: 50, r: 10 } ] } as unknown as Arena;

describe( 'rockBetween', () => {
    it( 'sees a rock that sits on the line', () => {
        expect( rockBetween( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, 100 ), ARENA ) ).toBe( true );
    } );

    it( 'ignores a rock off to the side', () => {
        expect( rockBetween( new THREE.Vector3( 30, 0, 0 ), new THREE.Vector3( 30, 0, 100 ), ARENA ) ).toBe( false );
    } );

    it( 'ignores a rock beyond the target', () => {
        expect( rockBetween( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, 30 ), ARENA ) ).toBe( false );
    } );
} );
