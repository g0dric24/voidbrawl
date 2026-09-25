import { Link } from 'react-router';
import { leaveMatch } from '../net/matchmaking';
import type { Route } from './+types/home';

export function meta() {
    return [ { title: 'VOIDBRAWL' }, { name: 'description', content: 'Team deathmatch in space. 1v1 · 2v2 · 4v4.' } ];
}

export function clientLoader( { request }: Route.ClientLoaderArgs ) {
    leaveMatch();
    return { serverDown: new URL( request.url ).searchParams.get( 'server' ) === 'down' };
}

const BUTTON =
    'border border-marigold px-8 py-3 text-sm font-bold tracking-[0.3em] text-marigold uppercase hover:bg-marigold hover:text-void focus-visible:bg-marigold focus-visible:text-void focus-visible:outline-none';

export default function Home( { loaderData }: Route.ComponentProps ) {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-void font-readout text-readout">
            <div className="flex flex-col items-center gap-3">
                <h1 className="text-[clamp(40px,8vw,96px)] font-bold tracking-[0.3em] text-marigold">VOIDBRAWL</h1>
                <p className="text-sm tracking-[0.3em] text-readout-dim uppercase">Cold space. Warm energy.</p>
            </div>
            <div className="flex gap-6">
                <Link to="/play" className={ BUTTON }>
                    Play
                </Link>
                <Link to="/sandbox" className={ BUTTON }>
                    Flight sandbox
                </Link>
            </div>
            { loaderData.serverDown && (
                <p className="text-sm tracking-[0.2em] text-danger uppercase">
                    Game server not reachable — is <code className="normal-case">pnpm dev</code> running?
                </p>
            ) }
        </main>
    );
}
