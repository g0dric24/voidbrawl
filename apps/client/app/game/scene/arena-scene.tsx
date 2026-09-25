import type { Arena } from '@voidbrawl/shared';
import { Fragment, type ReactNode, Suspense } from 'react';
import { AimReticle } from './aim-reticle';
import { AsteroidField } from './asteroid-field';
import { BaseMarkers } from './base-markers';
import { BoltField } from './bolt-field';
import { BoundaryShell } from './boundary-shell';
import { FxField } from './fx-field';
import { LocalShipView } from './local-ship-view';
import { NebulaSky } from './nebula-sky';
import { PillarRing } from './pillar-ring';
import { SceneEffects } from './scene-effects';
import { SceneLighting } from './scene-lighting';
import { SpaceDust } from './space-dust';

export function ArenaScene( { arena, children }: { arena: Arena; children?: ReactNode } ) {
    return (
        <Fragment>
            <NebulaSky radius={ arena.radius } />
            <SceneLighting />
            <Suspense fallback={ null }>
                <AsteroidField arena={ arena } />
            </Suspense>
            <BoundaryShell arena={ arena } />
            <PillarRing arena={ arena } />
            <BaseMarkers arena={ arena } />
            <SpaceDust />
            <LocalShipView />
            { children }
            <BoltField />
            <FxField />
            <AimReticle />
            <SceneEffects />
        </Fragment>
    );
}
