import { type Arena, BOLT_RADIUS, type BoltLaunch, boltPosition, sweepBolt } from '@voidbrawl/shared';
import * as THREE from 'three';
import { spark } from './fx/fx-store';

export interface Tracer {
    launch: BoltLaunch;
    life: number;
    age: number;
    color: string;
}

export const tracers: Tracer[] = [];
const MAX_TRACERS = 128;
const _p = { x: 0, y: 0, z: 0 };
const _at = new THREE.Vector3();

export function addTracer( launch: BoltLaunch, life: number, color: string ): void {
    if ( tracers.length >= MAX_TRACERS ) tracers.shift();
    tracers.push( { launch: { ...launch, t0: 0 }, life, age: 0, color } );
}

export function stepTracers( arena: Arena, dt: number ): void {
    for ( let i = tracers.length - 1; i >= 0; i-- ) {
        const t = tracers[ i ];
        const from = t.age;
        t.age = Math.min( t.life, t.age + dt );
        const hit = sweepBolt( t.launch, from, t.age, arena, [] );
        if ( hit ) {
            const p = boltPosition( t.launch, from + ( t.age - from ) * hit.t, _p );
            spark( _at.set( p.x, p.y, p.z ), t.color );
            tracers.splice( i, 1 );
        } else if ( t.age >= t.life ) tracers.splice( i, 1 );
    }
}

export function dropTracersNear( x: number, y: number, z: number ): void {
    const reach = 6 + BOLT_RADIUS;
    for ( let i = tracers.length - 1; i >= 0; i-- ) {
        const p = boltPosition( tracers[ i ].launch, tracers[ i ].age, _p );
        if ( ( p.x - x ) ** 2 + ( p.y - y ) ** 2 + ( p.z - z ) ** 2 < reach * reach ) tracers.splice( i, 1 );
    }
}

export function clearTracers(): void {
    tracers.length = 0;
}
