import { Link } from 'react-router';
import { VoidbrawlLogo } from '../game/brand/voidbrawl-logo';
import { leaveMatch } from '../net/matchmaking';

export function meta() {
    return [ { title: 'VOIDBRAWL' }, { name: 'description', content: 'Team deathmatch in space. 1v1 · 2v2 · 4v4.' } ];
}

export function clientLoader() {
    leaveMatch();
    return null;
}

const BUTTON =
    'border border-marigold px-8 py-3 text-sm font-bold tracking-[0.3em] text-marigold uppercase hover:bg-marigold hover:text-void focus-visible:bg-marigold focus-visible:text-void focus-visible:outline-none';

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-void font-readout text-readout">
            <div className="flex flex-col items-center gap-3">
                <h1 className="m-0">
                    <VoidbrawlLogo />
                </h1>
                <p className="text-sm tracking-[0.3em] text-readout-dim uppercase">Cold space. Warm energy.</p>
            </div>
            <div className="flex gap-6">
                <Link to="/lobby" className={ BUTTON }>
                    Play
                </Link>
            </div>
        </main>
    );
}
