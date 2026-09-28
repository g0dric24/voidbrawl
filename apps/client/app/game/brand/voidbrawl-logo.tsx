export function VoidbrawlLogo( { size = 'large' }: { size?: 'large' | 'small' } ) {
    const big = size === 'large';

    return (
        <span className="flex items-center gap-[0.35em] font-display font-black text-readout uppercase">
            <svg
                viewBox="0 0 64 64"
                className={ big ? 'size-[clamp(48px,9vw,110px)]' : 'size-9' }
                role="img"
                aria-label="VOIDBRAWL emblem"
            >
                <path d="M4 8 L28 58 L32 50 L14 12 Z" fill="#F59A24" />
                <path d="M60 8 L36 58 L32 50 L50 12 Z" fill="#ECEFF2" />
                <path d="M24 8 L32 26 L40 8 Z" fill="#F59A24" />
            </svg>
            <span className={ big ? 'text-[clamp(34px,7vw,92px)] tracking-[0.08em]' : 'text-2xl tracking-[0.08em]' }>
                Void<span className="text-marigold">brawl</span>
            </span>
        </span>
    );
}
