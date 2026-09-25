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
] );

function onDown( e: KeyboardEvent ): void {
    if ( typingTarget( e.target ) ) return;
    if ( GAME_KEYS.has( e.code ) ) e.preventDefault();
    held.add( e.code );
}

function onUp( e: KeyboardEvent ): void {
    held.delete( e.code );
}

function onBlur(): void {
    held.clear();
}

export function isHeld( code: string ): boolean {
    return held.has( code );
}

export function axis( negative: string, positive: string ): number {
    return ( held.has( positive ) ? 1 : 0 ) - ( held.has( negative ) ? 1 : 0 );
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
    };
}
