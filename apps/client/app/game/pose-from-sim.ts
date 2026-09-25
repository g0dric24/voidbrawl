import { type Arena, boostSpeed, type FlightTuning, type ShipState, topSpeed } from '@voidbrawl/shared';
import * as THREE from 'three';
import { viewPose } from './view-pose';

export interface PoseSample {
    x: number;
    y: number;
    z: number;
    qx: number;
    qy: number;
    qz: number;
    qw: number;
}

const IMPACT_DECAY = 3;
const _from = new THREE.Quaternion();
const _to = new THREE.Quaternion();

export function writeViewPose(
    prev: PoseSample,
    sim: ShipState,
    alpha: number,
    tuning: FlightTuning,
    arena: Arena,
    delta: number,
): void {
    const p = viewPose;
    p.position.set(
        prev.x + ( sim.x - prev.x ) * alpha,
        prev.y + ( sim.y - prev.y ) * alpha,
        prev.z + ( sim.z - prev.z ) * alpha,
    );
    _from.set( prev.qx, prev.qy, prev.qz, prev.qw );
    _to.set( sim.qx, sim.qy, sim.qz, sim.qw );
    p.quaternion.slerpQuaternions( _from, _to, alpha );
    p.forward.set( 0, 0, 1 ).applyQuaternion( p.quaternion );
    p.up.set( 0, 1, 0 ).applyQuaternion( p.quaternion );
    p.velocity.set( sim.vx, sim.vy, sim.vz );
    p.speed = p.velocity.length();
    p.boost = sim.boost;
    const top = topSpeed( tuning );
    const share = ( p.speed - top ) / Math.max( 1e-6, boostSpeed( tuning ) - top );
    p.boostShare = share < 0 ? 0 : share > 1 ? 1 : share;
    p.edgeDistance = arena.radius - p.position.length();
    p.impact = Math.max( sim.impact, p.impact * Math.exp( -IMPACT_DECAY * delta ) );
}

export function capturePrev( sim: ShipState, prev: PoseSample ): void {
    prev.x = sim.x;
    prev.y = sim.y;
    prev.z = sim.z;
    prev.qx = sim.qx;
    prev.qy = sim.qy;
    prev.qz = sim.qz;
    prev.qw = sim.qw;
}
