import { Fragment } from 'react';
import { CountdownOverlay } from './countdown-overlay';
import { LobbyPanel } from './lobby-panel';
import { ResultsPanel } from './results-panel';
import { ScoreBar } from './score-bar';

export function MatchOverlays() {
    return (
        <Fragment>
            <ScoreBar />
            <CountdownOverlay />
            <LobbyPanel />
            <ResultsPanel />
        </Fragment>
    );
}
