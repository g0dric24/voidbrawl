import { useSyncExternalStore } from 'react';
import { currentMatch, type MatchView, subscribeMatch } from '../../net/match-store';

export function useMatch(): MatchView {
    return useSyncExternalStore( subscribeMatch, currentMatch, currentMatch );
}
