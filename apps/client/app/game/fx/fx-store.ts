import * as THREE from 'three';

export const MAX_PARTICLES = 2048;
export const MAX_SHOCKWAVES = 32;

export interface Particle {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    color: THREE.Color;
    age: number;
    life: number;
    size: number;
}

export interface Shockwave {
    position: THREE.Vector3;
    color: THREE.Color;
    radius: number;
    age: number;
    life: number;
}

export const particles: Particle[] = [];
export const shockwaves: Shockwave[] = [];

const _dir = new THREE.Vector3();

interface Burst {
    count: number;
    speed: number;
    life: number;
    size: number;
}

function emit( at: THREE.Vector3, color: string, b: Burst, drift?: THREE.Vector3 ): void {
    for ( let i = 0; i < b.count; i++ ) {
        if ( particles.length >= MAX_PARTICLES ) particles.shift();
        _dir.set( Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1 ).normalize();
        const velocity = _dir.clone().multiplyScalar( b.speed * ( 0.3 + Math.random() * 0.7 ) );
        if ( drift ) velocity.add( drift );
        particles.push( {
            position: at.clone(),
            velocity,
            color: new THREE.Color( color ),
            age: 0,
            life: b.life * ( 0.6 + Math.random() * 0.4 ),
            size: b.size,
        } );
    }
}

export function shockwave( at: THREE.Vector3, color: string, radius: number, life = 0.45 ): void {
    if ( shockwaves.length >= MAX_SHOCKWAVES ) shockwaves.shift();
    shockwaves.push( { position: at.clone(), color: new THREE.Color( color ), radius, age: 0, life } );
}

export function spark( at: THREE.Vector3, color: string ): void {
    emit( at, color, { count: 10, speed: 18, life: 0.35, size: 0.35 } );
}

export function debris( at: THREE.Vector3 ): void {
    emit( at, '#9aa3ad', { count: 8, speed: 14, life: 0.6, size: 0.5 } );
}

export function impact( at: THREE.Vector3 ): void {
    emit( at, '#e8eef5', { count: 14, speed: 20, life: 0.35, size: 0.4 } );
}

export function smoke( at: THREE.Vector3 ): void {
    emit( at, '#5d6570', { count: 1, speed: 3, life: 0.8, size: 1.1 } );
}

export function dashBurst( at: THREE.Vector3, away: THREE.Vector3, color: string ): void {
    emit( at, color, { count: 22, speed: 8, life: 0.4, size: 0.55 }, away );
}

export function explode( at: THREE.Vector3, color: string ): void {
    emit( at, '#fffbe7', { count: 36, speed: 34, life: 0.55, size: 1.6 } );
    emit( at, color, { count: 110, speed: 52, life: 1.4, size: 0.9 } );
    emit( at, '#5d6570', { count: 20, speed: 12, life: 1.6, size: 1.4 } );
    shockwave( at, color, 34, 0.6 );
}

export function blast( at: THREE.Vector3, color: string, radius: number ): void {
    emit( at, '#fffbe7', { count: 20, speed: 30, life: 0.4, size: 1.2 } );
    emit( at, color, { count: 50, speed: 40, life: 0.8, size: 0.7 } );
    shockwave( at, color, radius, 0.4 );
}

function stepShockwaves( dt: number ): void {
    for ( let i = shockwaves.length - 1; i >= 0; i-- ) {
        const s = shockwaves[ i ];
        s.age += dt;
        if ( s.age >= s.life ) shockwaves.splice( i, 1 );
    }
}

export function stepParticles( dt: number ): void {
    for ( let i = particles.length - 1; i >= 0; i-- ) {
        const p = particles[ i ];
        p.age += dt;
        if ( p.age >= p.life ) {
            particles.splice( i, 1 );
            continue;
        }
        p.position.addScaledVector( p.velocity, dt );
        p.velocity.multiplyScalar( 1 - Math.min( 1, 1.5 * dt ) );
    }
    stepShockwaves( dt );
}

export const feedback = {
    hitMarkerAt: -Infinity,
    damageAt: -Infinity,
    killAt: -Infinity,
    damageFrom: new THREE.Vector3(),
    damageFromAt: -Infinity,
};

export const recentAttackers = new Map< string, number >();

export const lastDeath = {
    killerId: '',
    cause: '' as string,
};
