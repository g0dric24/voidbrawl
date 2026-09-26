const COMMON: readonly [ string, string ][] = [
    [ 'Mouse', 'pitch / yaw' ],
    [ 'Left click', 'fire' ],
    [ 'Q / E', 'roll' ],
    [ 'W / S', 'thrust / reverse' ],
    [ 'A / D', 'strafe' ],
    [ 'Space / C', 'up / down' ],
    [ 'Shift', 'boost' ],
    [ 'V', 'aim mode' ],
];

const SANDBOX: readonly [ string, string ][] = [
    [ '1 2 3', 'ship class' ],
    [ 'R', 'respawn' ],
];

const PLAY: readonly [ string, string ][] = [
    [ 'Right hold / release', 'lock / fire seeker' ],
    [ 'F', 'drop mine' ],
    [ 'A A / D D', 'dash (Interceptor)' ],
    [ 'Tab', 'scoreboard' ],
    [ 'M', 'mute' ],
];

const TAIL: readonly [ string, string ][] = [
    [ '`', 'tuning panel' ],
    [ 'Esc', 'menu · change ship' ],
];

export function ControlsHint( { mode }: { mode: 'sandbox' | 'play' } ) {
    const rows = [ ...COMMON, ...( mode === 'play' ? PLAY : SANDBOX ), ...TAIL ];

    return (
        <div className="absolute right-0 bottom-0 grid grid-cols-[auto_auto] gap-x-4 gap-y-1 text-[clamp(9px,1.4vh,12px)] tracking-[0.16em]">
            { rows.map( ( [ key, action ] ) => (
                <div key={ key } className="contents">
                    <span className="text-right font-semibold text-readout">{ key }</span>
                    <span className="text-readout-dim">{ action }</span>
                </div>
            ) ) }
        </div>
    );
}
