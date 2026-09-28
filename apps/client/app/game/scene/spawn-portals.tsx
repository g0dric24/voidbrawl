import type { Arena } from '@voidbrawl/shared';
import { Fragment, Suspense } from 'react';
import { SpawnPortal } from './spawn-portal';

export function SpawnPortals( { arena }: { arena: Arena } ) {
    return (
        <Suspense fallback={ null }>
            <Fragment>
                { arena.bases.map( ( base ) => (
                    <SpawnPortal key={ base.team } base={ base } />
                ) ) }
            </Fragment>
        </Suspense>
    );
}
