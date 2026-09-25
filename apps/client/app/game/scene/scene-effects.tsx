import { useFrame } from '@react-three/fiber';
import { EffectComposer, ToneMapping } from '@react-three/postprocessing';
import { BlendFunction, BloomEffect, type EffectComposer as ComposerImpl, ToneMappingMode } from 'postprocessing';
import { useEffect, useMemo, useRef } from 'react';
import { num } from '../../dev/tuning';

const MSAA_MAX_DPR = 2;
const MSAA_SAMPLES = 4;

export function SceneEffects() {
    const composer = useRef< ComposerImpl >( null );
    const bloom = useMemo( () => new BloomEffect( { blendFunction: BlendFunction.ADD, mipmapBlur: true } ), [] );

    // JUSTIFIED EFFECT — GPU render targets outlive React's tree: the bloom mip chain is released by hand.
    useEffect( () => () => bloom.dispose(), [ bloom ] );

    useFrame( ( state ) => {
        bloom.intensity = num( 'Bloom.intensity' );
        bloom.luminanceMaterial.threshold = num( 'Bloom.threshold' );
        bloom.luminanceMaterial.smoothing = num( 'Bloom.smoothing' );
        const dpr = num( 'Render.dpr' );
        if ( state.gl.getPixelRatio() !== dpr ) state.setDpr( dpr );
        const samples = dpr < MSAA_MAX_DPR ? MSAA_SAMPLES : 0;
        if ( composer.current && composer.current.multisampling !== samples ) composer.current.multisampling = samples;
    } );

    return (
        <EffectComposer ref={ composer } multisampling={ 0 }>
            <primitive object={ bloom } />
            <ToneMapping mode={ ToneMappingMode.NEUTRAL } />
        </EffectComposer>
    );
}
