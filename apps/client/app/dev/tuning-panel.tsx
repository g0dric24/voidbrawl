import { SHIP_CLASSES, SHIP_ORDER, type ShipClassId } from '@voidbrawl/shared';
import { button, folder, useControls } from 'leva';
import { FLIGHT_KEYS, flightPath } from './flight-tunables';
import { num, setNum } from './tuning';
import { forget } from './tuning-persist';
import { NUMBER_TUNABLES, type NumberPath } from './tuning-schema';

function numberControl( path: NumberPath ) {
    const spec = NUMBER_TUNABLES[ path ];
    return {
        value: num( path ),
        min: spec.min,
        max: spec.max,
        step: spec.step,
        onChange: ( value: number ) => setNum( path, value ),
        transient: true as const,
    };
}

function group( prefix: string, keys: readonly string[] ) {
    return Object.fromEntries( keys.map( ( key ) => [ key, numberControl( `${ prefix }.${ key }` as NumberPath ) ] ) );
}

function classFolder( id: ShipClassId ) {
    return folder(
        Object.fromEntries(
            FLIGHT_KEYS.map( ( key ) => [ `${ id } ${ key }`, numberControl( flightPath( id, key ) ) ] ),
        ),
        { collapsed: id !== 'fighter' },
    );
}

export default function TuningPanel() {
    useControls(
        'Flight',
        Object.fromEntries( SHIP_ORDER.map( ( id ) => [ SHIP_CLASSES[ id ].name, classFolder( id ) ] ) ),
    );
    useControls( 'Boundary', group( 'Boundary', [ 'idle', 'near', 'glow' ] ), { collapsed: true } );
    useControls( 'Mouse', group( 'Mouse', [ 'sensitivity', 'invertY', 'stickRadius', 'stickDeadzone' ] ) );
    useControls( 'Camera', group( 'Camera', [ 'back', 'height', 'aim', 'fov', 'boostFov', 'follow' ] ) );
    useControls( 'Reticle', group( 'Reticle', [ 'distance' ] ), { collapsed: true } );
    useControls( 'Dust', group( 'Dust', [ 'count', 'streak' ] ), { collapsed: true } );
    useControls( 'Bloom', group( 'Bloom', [ 'intensity', 'threshold', 'smoothing' ] ), { collapsed: true } );
    useControls( 'Render', group( 'Render', [ 'dpr' ] ), { collapsed: true } );
    useControls( 'Tuning', {
        'reset to defaults': button( () => {
            forget();
            location.reload();
        } ),
    } );
    return null;
}
