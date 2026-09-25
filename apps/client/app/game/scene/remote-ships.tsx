import { useQuery } from 'koota/react';
import { Fragment } from 'react';
import { Remote } from '../ecs/traits';
import { RemoteShipView } from './remote-ship-view';

export function RemoteShips() {
    const ships = useQuery( Remote );

    return (
        <Fragment>
            { ships.map( ( entity ) => (
                <RemoteShipView key={ entity.id() } entity={ entity } />
            ) ) }
        </Fragment>
    );
}
