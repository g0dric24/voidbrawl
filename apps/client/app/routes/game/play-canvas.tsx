import type { Room } from '@colyseus/sdk';
import { Canvas } from '@react-three/fiber';
import { type ArenaDescriptor, type MatchState, materializeArena } from '@voidbrawl/shared';
import { WorldProvider } from 'koota/react';
import { useMemo } from 'react';
import { world } from '../../game/ecs/world';
import { PlayHud } from '../../game/hud/play-hud';
import { ArenaScene } from '../../game/scene/arena-scene';
import { CANVAS_CAMERA, CANVAS_GL } from '../../game/scene/canvas-gl';
import { MineField } from '../../game/scene/mine-field';
import { MissileField } from '../../game/scene/missile-field';
import { RemoteShips } from '../../game/scene/remote-ships';
import { createPredictor } from '../../net/prediction';
import { MatchLink } from './match-link';
import { PlayControls } from './play-controls';
import { PlayLoop } from './play-loop';

export function PlayCanvas( { room, descriptor }: { room: Room< MatchState >; descriptor: ArenaDescriptor } ) {
    const arena = useMemo( () => materializeArena( descriptor ), [ descriptor ] );
    const predictor = useMemo( createPredictor, [ room ] );

    return (
        <WorldProvider world={ world }>
            <Canvas gl={ CANVAS_GL } camera={ CANVAS_CAMERA } style={ { position: 'fixed', inset: 0 } }>
                <MatchLink room={ room } predictor={ predictor } arena={ arena } />
                <PlayControls room={ room } />
                <PlayLoop arena={ arena } predictor={ predictor } />
                <ArenaScene arena={ arena }>
                    <RemoteShips />
                    <MissileField />
                    <MineField />
                </ArenaScene>
            </Canvas>
            <PlayHud />
        </WorldProvider>
    );
}
