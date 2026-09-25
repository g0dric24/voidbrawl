import type { Arena } from '@voidbrawl/shared';
import { Fragment } from 'react';
import { TEAM_COLORS } from '../team-colors';

const RING_RADIUS = 60;
const RING_TUBE = 0.8;
const RING_BEHIND = 50;
const GLOW = 1.6;

export function BaseMarkers( { arena }: { arena: Arena } ) {
    return (
        <Fragment>
            { arena.bases.map( ( base ) => {
                const behind = base.team === 0 ? -RING_BEHIND : RING_BEHIND;
                return (
                    <mesh key={ base.team } position={ [ base.center.x, base.center.y, base.center.z + behind ] }>
                        <torusGeometry args={ [ RING_RADIUS, RING_TUBE, 12, 160 ] } />
                        <meshStandardMaterial
                            color="#1b2229"
                            emissive={ TEAM_COLORS[ base.team ] }
                            emissiveIntensity={ GLOW }
                        />
                    </mesh>
                );
            } ) }
        </Fragment>
    );
}
