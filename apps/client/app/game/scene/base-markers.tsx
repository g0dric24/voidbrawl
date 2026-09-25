import type { Arena } from '@voidbrawl/shared';
import { Fragment } from 'react';
import { TEAM_COLORS } from '../team-colors';

const RING_RADIUS = 46;
const RING_TUBE = 0.6;
const GLOW = 3;

export function BaseMarkers( { arena }: { arena: Arena } ) {
    return (
        <Fragment>
            { arena.bases.map( ( base ) => (
                <group key={ base.team } position={ [ base.center.x, base.center.y, base.center.z ] }>
                    <mesh>
                        <torusGeometry args={ [ RING_RADIUS, RING_TUBE, 12, 128 ] } />
                        <meshBasicMaterial color={ TEAM_COLORS[ base.team ] } />
                    </mesh>
                    <mesh>
                        <torusGeometry args={ [ RING_RADIUS * 0.8, RING_TUBE * 0.5, 8, 128 ] } />
                        <meshStandardMaterial
                            color="#1b2229"
                            emissive={ TEAM_COLORS[ base.team ] }
                            emissiveIntensity={ GLOW }
                        />
                    </mesh>
                </group>
            ) ) }
        </Fragment>
    );
}
