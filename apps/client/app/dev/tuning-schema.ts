import { SKY_PRESET } from '../game/scene/nebula-presets';
import { ROCK_ALBEDO } from '../game/scene/rock-surface';
import { MARIGOLD } from '../game/team-colors';
import { FLIGHT_TUNABLES, type FlightPath, type NumberTunable } from './flight-tunables';

interface ColorTunable {
    value: string;
}

const DEVICE_DPR = Math.max( 0.5, globalThis.devicePixelRatio ?? 1 );

const VISUAL_TUNABLES = {
    'Render.dpr': { value: Math.min( 2, DEVICE_DPR ), min: 0.5, max: DEVICE_DPR, step: 0.25 },

    'Environment.intensity': { value: 1.2, min: 0, max: 20, step: 0.05 },
    'Environment.rotation': { value: 0, min: 0, max: 360, step: 1 },

    'Env.skyIntensity': { value: 0.6, min: 0, max: 5, step: 0.01 },
    'Env.fillIntensity': { value: 0.5, min: 0, max: 2, step: 0.01 },
    'Env.groundIntensity': { value: 0.35, min: 0, max: 5, step: 0.01 },
    'Env.bandIntensity': { value: 0.05, min: 0, max: 4, step: 0.05 },
    'Env.bandHeight': { value: 5, min: 0.5, max: 60, step: 0.5 },

    'Bloom.intensity': { value: 1.2, min: 0, max: 5, step: 0.05 },
    'Bloom.threshold': { value: 0.6, min: 0, max: 2, step: 0.01 },
    'Bloom.smoothing': { value: 0.2, min: 0, max: 1, step: 0.01 },

    'Camera.back': { value: 26, min: 4, max: 80, step: 0.5 },
    'Camera.height': { value: 8, min: 0, max: 40, step: 0.1 },
    'Camera.aim': { value: 90, min: 5, max: 400, step: 1 },
    'Camera.fov': { value: 72, min: 40, max: 110, step: 1 },
    'Camera.boostFov': { value: 10, min: 0, max: 40, step: 0.5 },
    'Camera.follow': { value: 0, min: 0, max: 40, step: 0.5 },

    'Mouse.sensitivity': { value: 0.0022, min: 0.0003, max: 0.01, step: 0.0001 },
    'Mouse.invertY': { value: 0, min: 0, max: 1, step: 1 },
    'Mouse.stickRadius': { value: 220, min: 40, max: 600, step: 5 },
    'Mouse.stickDeadzone': { value: 0.06, min: 0, max: 0.5, step: 0.01 },

    'Reticle.distance': { value: 220, min: 20, max: 600, step: 5 },

    'Boundary.near': { value: 90, min: 20, max: 600, step: 5 },
    'Boundary.glow': { value: 2.6, min: 0.5, max: 6, step: 0.05 },

    'Dust.count': { value: 1400, min: 0, max: 6000, step: 100 },
    'Dust.streak': { value: 0.035, min: 0, max: 0.2, step: 0.005 },

    'Sky.seed': { value: SKY_PRESET.seed, min: 0, max: 99, step: 1 },
    'Sky.scale': { value: SKY_PRESET.scale, min: 0.5, max: 6, step: 0.05 },
    'Sky.warp': { value: SKY_PRESET.warp, min: 0, max: 3, step: 0.05 },
    'Sky.bandTilt': { value: SKY_PRESET.bandTilt, min: 0, max: 180, step: 1 },
    'Sky.bandOffset': { value: SKY_PRESET.bandOffset, min: -1, max: 1, step: 0.01 },
    'Sky.bandWidth': { value: SKY_PRESET.bandWidth, min: 0.05, max: 1, step: 0.01 },
    'Sky.density': { value: SKY_PRESET.density, min: 0, max: 1, step: 0.01 },
    'Sky.voids': { value: SKY_PRESET.voids, min: 0, max: 1, step: 0.01 },
    'Sky.dust': { value: SKY_PRESET.dust, min: 0, max: 1, step: 0.01 },
    'Sky.hue': { value: SKY_PRESET.hue, min: 0, max: 360, step: 1 },
    'Sky.saturation': { value: SKY_PRESET.saturation, min: 0, max: 1, step: 0.01 },
    'Sky.brightness': { value: SKY_PRESET.brightness, min: 0, max: 4, step: 0.01 },
    'Sky.voidDepth': { value: SKY_PRESET.voidDepth, min: 0, max: 1, step: 0.01 },
    'Sky.clumps': { value: SKY_PRESET.clumps, min: 0.3, max: 0.95, step: 0.01 },
    'Sky.dustOpacity': { value: SKY_PRESET.dustOpacity, min: 0, max: 1, step: 0.01 },
    'Sky.rim': { value: SKY_PRESET.rim, min: 0, max: 6, step: 0.05 },
    'Sky.planetSize': { value: SKY_PRESET.planetSize, min: 0, max: 60, step: 0.5 },
    'Sky.planetAzimuth': { value: SKY_PRESET.planetAzimuth, min: -90, max: 90, step: 1 },
    'Sky.planetElevation': { value: SKY_PRESET.planetElevation, min: -30, max: 80, step: 1 },
    'Sky.planetPhase': { value: SKY_PRESET.planetPhase, min: 0, max: 180, step: 1 },
    'Sky.planetTilt': { value: SKY_PRESET.planetTilt, min: -180, max: 180, step: 1 },
    'Sky.planetLight': { value: SKY_PRESET.planetLight, min: 0, max: 3, step: 0.05 },
    'Sky.planetGlow': { value: SKY_PRESET.planetGlow, min: 0, max: 4, step: 0.05 },
    'Sky.planetRelief': { value: SKY_PRESET.planetRelief, min: 0, max: 3, step: 0.05 },
    'Sky.moons': { value: SKY_PRESET.moons, min: 0, max: 2, step: 1 },
    'Sky.moonSize': { value: SKY_PRESET.moonSize, min: 0.2, max: 6, step: 0.1 },
    'Sky.motion': { value: SKY_PRESET.motion, min: 0, max: 4, step: 0.05 },
    'Sky.environment': { value: SKY_PRESET.environment, min: 0, max: 6, step: 0.05 },
    'Sky.keyLight': { value: SKY_PRESET.keyLight, min: 0, max: 8, step: 0.05 },

    'Rock.textureScale': { value: 1.15, min: 0.2, max: 4, step: 0.05 },
    'Rock.normalScale': { value: 2.5, min: 0, max: 3, step: 0.05 },
    'Rock.roughness': { value: 1, min: 0.1, max: 1.5, step: 0.01 },
    'Rock.detail': { value: 1, min: 0, max: 3, step: 0.05 },
    'Rock.spin': { value: 1, min: 0, max: 6, step: 0.05 },

    'Ship.keyLight': { value: 2.5, min: 0, max: 10, step: 0.05 },
    'Ship.rimStrength': { value: 3.5, min: 0, max: 10, step: 0.05 },
    'Ship.rimPower': { value: 2.2, min: 0.5, max: 8, step: 0.05 },
    'Ship.bodyGlow': { value: 0.35, min: 0, max: 2, step: 0.01 },
    'Trail.width': { value: 1.6, min: 0, max: 8, step: 0.05 },
    'Trail.length': { value: 50, min: 2, max: 120, step: 1 },
    'Trail.glow': { value: 2.5, min: 0, max: 8, step: 0.05 },
} as const satisfies Record< string, NumberTunable >;

export type VisualPath = keyof typeof VISUAL_TUNABLES;

export type NumberPath = VisualPath | FlightPath;

export const NUMBER_TUNABLES: Record< NumberPath, NumberTunable > = { ...VISUAL_TUNABLES, ...FLIGHT_TUNABLES };

export const COLOR_TUNABLES = {
    'Env.fillColor': { value: '#8d96a3' },
    'Env.groundColor': { value: '#343639' },
    'Env.bandColor': { value: MARIGOLD },
    'Rock.color': { value: ROCK_ALBEDO },
} as const satisfies Record< string, ColorTunable >;

export type ColorPath = keyof typeof COLOR_TUNABLES;
