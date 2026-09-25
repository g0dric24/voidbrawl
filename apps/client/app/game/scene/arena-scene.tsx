import type { Arena } from '@voidbrawl/shared';
import { Fragment, type ReactNode, Suspense } from 'react';
import { AimReticle } from './aim-reticle';
import { AsteroidField } from './asteroid-field';
import { BaseMarkers } from './base-markers';
import { BoundaryShell } from './boundary-shell';
import { LocalShipView } from './local-ship-view';
import { NebulaSky } from './nebula-sky';
import { SceneEffects } from './scene-effects';
import { SceneLighting } from './scene-lighting';
import { SpaceDust } from './space-dust';

export function ArenaScene( { arena, children }: { arena: Arena; children?: ReactNode } ) {
    return (
        <Fragment>
            <NebulaSky />
            <SceneLighting />
            <Suspense fallback={ null }>
                <AsteroidField arena={ arena } />
            </Suspense>
            <BoundaryShell arena={ arena } />
            <BaseMarkers arena={ arena } />
            <SpaceDust />
            <LocalShipView />
            { children }
            <AimReticle />
            <SceneEffects />
        </Fragment>
    );
}
