import { Canvas } from '@react-three/fiber';
import { DEFAULT_ARENA, materializeArena } from '@voidbrawl/shared';
import { WorldProvider } from 'koota/react';
import { useMemo } from 'react';
import { world } from '../../game/ecs/world';
import { SandboxHud } from '../../game/hud/sandbox-hud';
import { ArenaScene } from '../../game/scene/arena-scene';
import { CANVAS_CAMERA, CANVAS_GL } from '../../game/scene/canvas-gl';
import { SandboxLoop } from './sandbox-loop';
import { SandboxShip } from './sandbox-ship';

export function SandboxCanvas() {
    const arena = useMemo( () => materializeArena( DEFAULT_ARENA ), [] );

    return (
        <WorldProvider world={ world }>
            <Canvas gl={ CANVAS_GL } camera={ CANVAS_CAMERA } style={ { position: 'fixed', inset: 0 } }>
                <SandboxShip arena={ arena } />
                <SandboxLoop arena={ arena } />
                <ArenaScene arena={ arena } />
            </Canvas>
            <SandboxHud />
        </WorldProvider>
    );
}
