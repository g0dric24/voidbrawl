import { Fragment } from 'react';
import { CountdownOverlay } from './countdown-overlay';
import { LobbyPanel } from './lobby-panel';
import { PauseMenu } from './pause-menu';
import { ResultsPanel } from './results-panel';
import { ScoreBar } from './score-bar';
import { Scoreboard } from './scoreboard';

export function MatchOverlays() {
    return (
        <Fragment>
            <ScoreBar />
            <CountdownOverlay />
            <LobbyPanel />
            <ResultsPanel />
            <PauseMenu />
            <Scoreboard />
        </Fragment>
    );
}
