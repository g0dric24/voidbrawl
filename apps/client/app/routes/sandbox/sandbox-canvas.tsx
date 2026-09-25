import { Canvas } from '@react-three/fiber';
import { DEFAULT_ARENA, materializeArena } from '@voidbrawl/shared';
import { WorldProvider } from 'koota/react';
import { Suspense, useMemo } from 'react';
import { world } from '../../game/ecs/world';
import { SandboxHud } from '../../game/hud/sandbox-hud';
import { AimReticle } from '../../game/scene/aim-reticle';
import { AsteroidField } from '../../game/scene/asteroid-field';
import { BaseMarkers } from '../../game/scene/base-markers';
import { BoundaryShell } from '../../game/scene/boundary-shell';
import { CANVAS_GL } from '../../game/scene/canvas-gl';
import { LocalShipView } from '../../game/scene/local-ship-view';
import { NebulaSky } from '../../game/scene/nebula-sky';
import { SceneEffects } from '../../game/scene/scene-effects';
import { SceneLighting } from '../../game/scene/scene-lighting';
import { SpaceDust } from '../../game/scene/space-dust';
import { SandboxLoop } from './sandbox-loop';
import { SandboxShip } from './sandbox-ship';

const CAMERA = { fov: 72, near: 0.3, far: 4000, position: [ 0, 0, 0 ] as [ number, number, number ] };

export function SandboxCanvas() {
    const arena = useMemo( () => materializeArena( DEFAULT_ARENA ), [] );

    return (
        <WorldProvider world={ world }>
            <Canvas gl={ CANVAS_GL } camera={ CAMERA } style={ { position: 'fixed', inset: 0 } }>
                <SandboxShip arena={ arena } />
                <SandboxLoop arena={ arena } />
                <NebulaSky />
                <SceneLighting />
                <Suspense fallback={ null }>
                    <AsteroidField arena={ arena } />
                </Suspense>
                <BoundaryShell arena={ arena } />
                <BaseMarkers arena={ arena } />
                <SpaceDust />
                <LocalShipView />
                <AimReticle />
                <SceneEffects />
            </Canvas>
            <SandboxHud />
        </WorldProvider>
    );
}
