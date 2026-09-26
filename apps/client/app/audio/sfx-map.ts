import { type Bus, loadSample, type PlayOpts, play, playAt, type Where } from './audio-engine';

const BASE = '/audio/sfx';

export type Sfx =
    | 'fire'
    | 'hit'
    | 'hurt'
    | 'threat'
    | 'death'
    | 'respawn'
    | 'boost'
    | 'countdown'
    | 'go'
    | 'tick'
    | 'lockBlip'
    | 'locked'
    | 'uiSelect'
    | 'uiConfirm'
    | 'uiError';

interface SfxDef {
    file: string;
    bus: Bus;
    gain?: number;
    rate?: number;
    cut?: boolean;
}

const TABLE: Record< Sfx, SfxDef > = {
    fire: { file: 'laser_fire.ogg', bus: 'combat', gain: 0.45 },
    hit: { file: 'hit_impact.ogg', bus: 'combat', gain: 0.7, rate: 1.4 },
    hurt: { file: 'stun.ogg', bus: 'threat', gain: 0.8 },
    threat: { file: 'threat.ogg', bus: 'threat', gain: 0.85, cut: true },
    death: { file: 'death_derezz.ogg', bus: 'combat', gain: 1 },
    respawn: { file: 'respawn.ogg', bus: 'combat', gain: 0.8 },
    boost: { file: 'boost.ogg', bus: 'combat', gain: 0.6, cut: true },
    countdown: { file: 'countdown_blip.ogg', bus: 'ui', gain: 0.9 },
    go: { file: 'go.ogg', bus: 'ui', gain: 1 },
    tick: { file: 'countdown_blip.ogg', bus: 'combat', gain: 0.35, rate: 1.8 },
    lockBlip: { file: 'ui_nav.ogg', bus: 'ui', gain: 0.55 },
    locked: { file: 'ui_confirm.ogg', bus: 'ui', gain: 0.7, cut: true },
    uiSelect: { file: 'ui_select.ogg', bus: 'ui', gain: 0.6 },
    uiConfirm: { file: 'ui_confirm.ogg', bus: 'ui', gain: 0.7 },
    uiError: { file: 'ui_error.ogg', bus: 'ui', gain: 0.7 },
};

export const MUSIC = {
    match: { name: 'music.match', file: '/audio/music/neon_laser_horizon.mp3' },
    lobby: { name: 'music.lobby', file: '/audio/music/lobby_calm_ambient.mp3' },
} as const;

let preloading: Promise< void > | null = null;

export function preloadAudio(): Promise< void > {
    preloading ??= Promise.all( [
        ...( Object.keys( TABLE ) as Sfx[] ).map( ( key ) => loadSample( key, `${ BASE }/${ TABLE[ key ].file }` ) ),
        loadSample( MUSIC.match.name, MUSIC.match.file ),
        loadSample( MUSIC.lobby.name, MUSIC.lobby.file ),
    ] ).then( () => undefined );
    return preloading;
}

function merged( sfx: Sfx, over: PlayOpts ): PlayOpts {
    const def = TABLE[ sfx ];
    return { bus: def.bus, gain: def.gain, rate: def.rate, cut: def.cut, ...over };
}

export function playSfx( sfx: Sfx, over: PlayOpts = {} ): void {
    play( sfx, merged( sfx, over ) );
}

export function playSfxAt( sfx: Sfx, at: Where, over: PlayOpts = {} ): void {
    playAt( sfx, at, merged( sfx, over ) );
}
