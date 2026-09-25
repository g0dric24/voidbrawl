import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MODES } from './modes.js';
import { canJoinTeam, canStart, forfeitWinner, judge, openTeam, scoringTeam } from './rules.js';

test( 'a side with no pilots left forfeits, and one leaver on a side with others does not', () => {
    assert.equal( forfeitWinner( { marigold: 0, cyan: 1 } ), 1 );
    assert.equal( forfeitWinner( { marigold: 3, cyan: 0 } ), 0 );
    assert.equal( forfeitWinner( { marigold: 1, cyan: 2 } ), null );
    assert.equal( forfeitWinner( { marigold: 0, cyan: 0 } ), null );
} );

test( 'a team is capped at the mode size', () => {
    assert.equal( canJoinTeam( 'duel', { marigold: 1, cyan: 0 }, 0 ), false );
    assert.equal( canJoinTeam( 'duel', { marigold: 1, cyan: 0 }, 1 ), true );
    assert.equal( canJoinTeam( 'team', { marigold: 3, cyan: 4 }, 0 ), true );
} );

test( 'joiners go to the smaller open team, and a full room has no team', () => {
    assert.equal( openTeam( 'squad', { marigold: 2, cyan: 1 } ), 1 );
    assert.equal( openTeam( 'squad', { marigold: 1, cyan: 1 } ), 0 );
    assert.equal( openTeam( 'duel', { marigold: 1, cyan: 1 } ), null );
} );

test( 'a match starts only with both teams present and at most one apart', () => {
    assert.equal( canStart( { marigold: 1, cyan: 0 } ), false );
    assert.equal( canStart( { marigold: 1, cyan: 1 } ), true );
    assert.equal( canStart( { marigold: 3, cyan: 2 } ), true );
    assert.equal( canStart( { marigold: 3, cyan: 1 } ), false );
} );

test( 'every death scores for the other team', () => {
    assert.equal( scoringTeam( 0 ), 1 );
    assert.equal( scoringTeam( 1 ), 0 );
} );

test( 'reaching the kill target wins', () => {
    const target = MODES.duel.target;
    assert.deepEqual( judge( 'duel', { score0: target, score1: 3, timeLeft: 100, suddenDeath: false } ), {
        over: true,
        winner: 0,
    } );
} );

test( 'at the time limit the leader wins and a tie waits for sudden death', () => {
    assert.deepEqual( judge( 'squad', { score0: 4, score1: 7, timeLeft: 0, suddenDeath: false } ), {
        over: true,
        winner: 1,
    } );
    assert.deepEqual( judge( 'squad', { score0: 5, score1: 5, timeLeft: 0, suddenDeath: true } ), { over: false } );
    assert.deepEqual( judge( 'squad', { score0: 6, score1: 5, timeLeft: 0, suddenDeath: true } ), {
        over: true,
        winner: 0,
    } );
} );
