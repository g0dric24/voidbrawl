import { num } from '../../dev/tuning';

export type AimMode = 'direct' | 'joystick';

const MAX_CARRY = 0.15;

const state = {
    locked: false,
    mode: 'direct' as AimMode,
    dx: 0,
    dy: 0,
    stickX: 0,
    stickY: 0,
    firing: false,
};

const PRIMARY_BUTTON = 0;

const listeners = new Set< () => void >();

function notify(): void {
    for ( const listener of listeners ) listener();
}

export function subscribeMouse( listener: () => void ): () => void {
    listeners.add( listener );
    return () => {
        listeners.delete( listener );
    };
}

export function pointerLocked(): boolean {
    return state.locked;
}

export function aimMode(): AimMode {
    return state.mode;
}

export function stickOffset(): { x: number; y: number } {
    return { x: state.stickX, y: state.stickY };
}

export function toggleAimMode(): void {
    state.mode = state.mode === 'direct' ? 'joystick' : 'direct';
    state.dx = 0;
    state.dy = 0;
    state.stickX = 0;
    state.stickY = 0;
    notify();
}

function onMove( e: MouseEvent ): void {
    if ( ! state.locked ) return;
    if ( state.mode === 'direct' ) {
        state.dx += e.movementX;
        state.dy += e.movementY;
        return;
    }
    const r = num( 'Mouse.stickRadius' );
    const x = state.stickX + e.movementX;
    const y = state.stickY + e.movementY;
    const len = Math.hypot( x, y );
    const k = len > r ? r / len : 1;
    state.stickX = x * k;
    state.stickY = y * k;
}

function onLockChange(): void {
    state.locked = document.pointerLockElement !== null;
    state.dx = 0;
    state.dy = 0;
    state.firing = false;
    notify();
}

function onDown( e: MouseEvent ): void {
    if ( state.locked && e.button === PRIMARY_BUTTON ) state.firing = true;
}

function onUp( e: MouseEvent ): void {
    if ( e.button === PRIMARY_BUTTON ) state.firing = false;
}

export function triggerHeld(): boolean {
    return state.locked && state.firing;
}

function onKey( e: KeyboardEvent ): void {
    if ( e.code === 'KeyV' && ! e.repeat ) toggleAimMode();
}

async function lockPlain( el: HTMLElement ): Promise< void > {
    try {
        await el.requestPointerLock();
    } catch {}
}

export async function requestLock( el: HTMLElement ): Promise< void > {
    try {
        await el.requestPointerLock( { unadjustedMovement: true } );
    } catch {
        await lockPlain( el );
    }
}

export function attachMouse(): () => void {
    addEventListener( 'mousemove', onMove );
    addEventListener( 'mousedown', onDown );
    addEventListener( 'mouseup', onUp );
    addEventListener( 'keydown', onKey );
    document.addEventListener( 'pointerlockchange', onLockChange );
    return () => {
        removeEventListener( 'mousemove', onMove );
        removeEventListener( 'mousedown', onDown );
        removeEventListener( 'mouseup', onUp );
        removeEventListener( 'keydown', onKey );
        document.removeEventListener( 'pointerlockchange', onLockChange );
    };
}

function clampCarry( v: number ): number {
    return v < -MAX_CARRY ? -MAX_CARRY : v > MAX_CARRY ? MAX_CARRY : v;
}

function deadzone( v: number, dz: number ): number {
    const a = Math.abs( v );
    if ( a <= dz ) return 0;
    return ( Math.sign( v ) * ( a - dz ) ) / ( 1 - dz );
}

export interface Turn {
    pitch: number;
    yaw: number;
}

export function takeTurn( turnRate: number, dt: number, out: Turn ): Turn {
    const flip = num( 'Mouse.invertY' ) >= 0.5 ? -1 : 1;
    const cap = turnRate * dt;
    if ( state.mode === 'joystick' ) {
        const r = num( 'Mouse.stickRadius' );
        const dz = num( 'Mouse.stickDeadzone' );
        out.yaw = deadzone( state.stickX / r, dz ) * cap;
        out.pitch = -deadzone( state.stickY / r, dz ) * cap * flip;
        return out;
    }
    const sens = num( 'Mouse.sensitivity' );
    const wantYaw = state.dx * sens;
    const wantPitch = -state.dy * sens * flip;
    out.yaw = Math.max( -cap, Math.min( cap, wantYaw ) );
    out.pitch = Math.max( -cap, Math.min( cap, wantPitch ) );
    state.dx = clampCarry( wantYaw - out.yaw ) / sens;
    state.dy = ( clampCarry( wantPitch - out.pitch ) / sens ) * -flip;
    return out;
}
