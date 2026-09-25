import * as THREE from 'three';

export const MAX_PARTICLES = 1024;

export interface Particle {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    color: THREE.Color;
    age: number;
    life: number;
    size: number;
}

export const particles: Particle[] = [];

const _dir = new THREE.Vector3();

function emit( at: THREE.Vector3, color: string, count: number, speed: number, life: number, size: number ): void {
    for ( let i = 0; i < count; i++ ) {
        if ( particles.length >= MAX_PARTICLES ) particles.shift();
        _dir.set( Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1 ).normalize();
        particles.push( {
            position: at.clone(),
            velocity: _dir.clone().multiplyScalar( speed * ( 0.3 + Math.random() * 0.7 ) ),
            color: new THREE.Color( color ),
            age: 0,
            life: life * ( 0.6 + Math.random() * 0.4 ),
            size,
        } );
    }
}

export function spark( at: THREE.Vector3, color: string ): void {
    emit( at, color, 10, 18, 0.35, 0.35 );
}

export function explode( at: THREE.Vector3, color: string ): void {
    emit( at, '#fffbe7', 24, 30, 0.5, 1.4 );
    emit( at, color, 70, 45, 1.2, 0.8 );
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
}

export const feedback = {
    hitMarkerAt: -Infinity,
    damageAt: -Infinity,
};
