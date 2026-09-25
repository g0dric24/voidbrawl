const KEY = 'voidbrawl.callsign';
const MAX = 16;

function generated(): string {
    return `Pilot-${ String( Math.floor( Math.random() * 10_000 ) ).padStart( 4, '0' ) }`;
}

export function callSign(): string {
    try {
        const stored = localStorage.getItem( KEY )?.trim();
        if ( stored ) return stored;
        const name = generated();
        localStorage.setItem( KEY, name );
        return name;
    } catch {
        return generated();
    }
}

export function setCallSign( name: string ): string {
    const clean = name.trim().slice( 0, MAX ) || generated();
    try {
        localStorage.setItem( KEY, clean );
    } catch {}
    return clean;
}
