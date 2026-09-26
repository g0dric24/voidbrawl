import * as THREE from 'three';
import { getContext, getListener, setListener } from './audio-engine';

export function ensureListener( camera: THREE.Camera ): THREE.AudioListener | null {
    if ( ! getContext() ) return null;
    let listener = getListener();
    if ( ! listener ) {
        listener = new THREE.AudioListener();
        setListener( listener );
    }
    if ( listener.parent !== camera ) camera.add( listener );
    return listener;
}
