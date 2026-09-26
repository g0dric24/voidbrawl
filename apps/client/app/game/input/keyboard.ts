import { typingTarget } from '../../dev/typing-target';

const held = new Set< string >();

const GAME_KEYS = new Set( [
    'KeyW',
    'KeyA',
    'KeyS',
    'KeyD',
    'KeyQ',
    'KeyE',
    'KeyC',
    'Space',
    'ShiftLeft',
    'ShiftRight',
    'Tab',
] );

const DOUBLE_TAP_MS = 250;
const DASH_KEYS: Record< string, number > = { KeyA: -1, KeyD: 1 };
const lastTap = new Map< string, number >();
let pendingDash = 0;

function noteTap( code: string, at: number ): void {
    const side = DASH_KEYS[ code ];
    if ( side === undefined ) return;
    const before = lastTap.get( code );
    lastTap.set( code, at );
    if ( before !== undefined && at - before < DOUBLE_TAP_MS ) {
        pendingDash = side;
        lastTap.delete( code );
    }
}

function onDown( e: KeyboardEvent ): void {
    if ( typingTarget( e.target ) ) return;
    if ( GAME_KEYS.has( e.code ) ) e.preventDefault();
    if ( ! e.repeat ) noteTap( e.code, e.timeStamp );
    held.add( e.code );
}

function onUp( e: KeyboardEvent ): void {
    held.delete( e.code );
}

function onBlur(): void {
    held.clear();
    pendingDash = 0;
}

export function isHeld( code: string ): boolean {
    return held.has( code );
}

export function axis( negative: string, positive: string ): number {
    return ( held.has( positive ) ? 1 : 0 ) - ( held.has( negative ) ? 1 : 0 );
}

export function takeDash(): number {
    const side = pendingDash;
    pendingDash = 0;
    return side;
}

export function attachKeyboard(): () => void {
    addEventListener( 'keydown', onDown );
    addEventListener( 'keyup', onUp );
    addEventListener( 'blur', onBlur );
    return () => {
        removeEventListener( 'keydown', onDown );
        removeEventListener( 'keyup', onUp );
        removeEventListener( 'blur', onBlur );
        held.clear();
        pendingDash = 0;
    };
}
