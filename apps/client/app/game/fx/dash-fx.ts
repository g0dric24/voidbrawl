import { rightOf, type ShipState, vec3 } from '@voidbrawl/shared';
import * as THREE from 'three';
import { dashBurst } from './fx-store';

const TRAIL_SPEED = 30;

const _r = vec3();
const _at = new THREE.Vector3();
const _away = new THREE.Vector3();

export function dashFx( ship: ShipState, side: number, color: string ): void {
    const r = rightOf( ship, _r );
    _away.set( r.x, r.y, r.z ).multiplyScalar( -side * TRAIL_SPEED );
    dashBurst( _at.set( ship.x, ship.y, ship.z ), _away, color );
}
