const ROWS: readonly [ string, string ][] = [
    [ 'Mouse', 'pitch / yaw' ],
    [ 'Q / E', 'roll' ],
    [ 'W / S', 'thrust / reverse' ],
    [ 'A / D', 'strafe' ],
    [ 'Space / C', 'up / down' ],
    [ 'Shift', 'boost' ],
    [ 'V', 'aim mode' ],
    [ '1 2 3', 'ship class' ],
    [ 'R', 'respawn' ],
    [ '`', 'tuning panel' ],
    [ 'Esc', 'release mouse' ],
];

export function ControlsHint() {
    return (
        <div className="absolute right-0 bottom-0 grid grid-cols-[auto_auto] gap-x-4 gap-y-1 text-[clamp(9px,1.4vh,12px)] tracking-[0.16em]">
            { ROWS.map( ( [ key, action ] ) => (
                <div key={ key } className="contents">
                    <span className="text-right font-semibold text-readout">{ key }</span>
                    <span className="text-readout-dim">{ action }</span>
                </div>
            ) ) }
        </div>
    );
}
