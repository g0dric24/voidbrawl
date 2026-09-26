import type { FlightInput, ShipState } from '@voidbrawl/shared';
import { THREAT, type ThreatLevel } from '../game/threat';
import { playSfx } from './sfx-map';

const LOCK_GAP_SLOW = 0.2;
const LOCK_GAP_FAST = 0.07;
const THREAT_GAP: Record< ThreatLevel, number > = { 0: 0, 1: 0.6, 2: 0.32, 3: 0.14 };
const THREAT_RATE: Record< ThreatLevel, number > = { 0: 1, 1: 0.9, 2: 1.15, 3: 1.45 };

const cue = { nextBlip: 0, wasLocked: false, nextThreat: 0, boosting: false };

export function lockCue( now: number, progress: number ): void {
    if ( progress <= 0 ) {
        cue.wasLocked = false;
        return;
    }
    if ( progress >= 1 ) {
        if ( ! cue.wasLocked ) playSfx( 'locked' );
        cue.wasLocked = true;
        return;
    }
    cue.wasLocked = false;
    if ( now < cue.nextBlip ) return;
    playSfx( 'lockBlip', { rate: 1 + progress } );
    cue.nextBlip = now + LOCK_GAP_SLOW - ( LOCK_GAP_SLOW - LOCK_GAP_FAST ) * progress;
}

export function threatCue( now: number, level: ThreatLevel ): void {
    if ( level === THREAT.none || now < cue.nextThreat ) return;
    playSfx( 'threat', { rate: THREAT_RATE[ level ] } );
    cue.nextThreat = now + THREAT_GAP[ level ];
}

export function localStepCues( input: FlightInput, ship: ShipState, dashed: boolean ): void {
    const boosting = input.boost && input.thrust > 0 && ship.boost > 0;
    if ( boosting && ! cue.boosting ) playSfx( 'boost' );
    cue.boosting = boosting;
    if ( dashed ) playSfx( 'boost', { rate: 1.7, cut: false } );
    if ( ship.shot ) playSfx( 'fire' );
}
