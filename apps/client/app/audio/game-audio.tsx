import { useFrame, useThree } from '@react-three/fiber';
import { boostSpeed, SHIP_CLASSES } from '@voidbrawl/shared';
import { useWorld } from 'koota/react';
import { useEffect } from 'react';
import { LocalPlayer, Pilot, Sim, Vital } from '../game/ecs/traits';
import { threatLevel } from '../game/threat';
import { stopMusic } from './audio-engine';
import { lockCue, threatCue } from './cue-audio';
import { setEngineSpeed, startEngineHum, stopEngineHum } from './engine-hum';
import { ensureListener } from './positional';
import { preloadAudio } from './sfx-map';

export function GameAudio() {
    const world = useWorld();
    const camera = useThree( ( s ) => s.camera );

    // JUSTIFIED EFFECT — syncs with the Web Audio engine: the listener on the camera, sample preload and the engine hum.
    useEffect( () => {
        ensureListener( camera );
        void preloadAudio();
        startEngineHum();
        return () => {
            stopEngineHum();
            stopMusic();
        };
    }, [ camera ] );

    useFrame( () => {
        const e = world.queryFirst( LocalPlayer, Sim, Pilot, Vital );
        const s = e?.get( Sim );
        const pilot = e?.get( Pilot );
        const vital = e?.get( Vital );
        if ( ! s || ! pilot || ! vital ) return;
        const top = boostSpeed( SHIP_CLASSES[ pilot.classId ].tuning );
        setEngineSpeed( vital.dead ? 0 : Math.hypot( s.vx, s.vy, s.vz ) / top );
        const now = performance.now() / 1000;
        lockCue( now, vital.lockProgress );
        threatCue( now, vital.dead ? 0 : threatLevel() );
    } );

    return null;
}
