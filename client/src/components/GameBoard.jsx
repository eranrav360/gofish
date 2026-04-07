import { useState, useEffect } from 'react';
import socket from '../socket';
import Card from './Card';
import GameLog from './GameLog';

const COUNTRY_FLAGS = {
  france: '🇫🇷', japan: '🇯🇵', brazil: '🇧🇷', egypt: '🇪🇬', india: '🇮🇳',
  australia: '🇦🇺', italy: '🇮🇹', mexico: '🇲🇽', china: '🇨🇳', usa: '🇺🇸',
  kenya: '🇰🇪', russia: '🇷🇺', peru: '🇵🇪',
};
const COUNTRY_NAMES = {
  france: 'France', japan: 'Japan', brazil: 'Brazil', egypt: 'Egypt', india: 'India',
  australia: 'Australia', italy: 'Italy', mexico: 'Mexico', china: 'China', usa: 'USA',
  kenya: 'Kenya', russia: 'Russia', peru: 'Peru',
};

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function GameBoard({ gameState, playerId, roomCode, error }) {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [toast, setToast] = useState(null);

  const { phase, players, currentPlayerIndex, deckCount, log } = gameState;
  const me = players.find(p => p.id === playerId);
  const opponents = players.filter(p => p.id !== playerId);
  const isMyTurn = me && players[currentPlayerIndex]?.id === playerId;
  const isHost = me?.isHost;

  // Dedup hand by country for selection purposes — show one card per country grouped
  const myHand = me?.hand || [];

  // Group hand cards by country for display (sorted by country)
  const handGrouped = [...myHand].sort((a, b) => a.country.localeCompare(b.country));

  useEffect(() => {
    if (gameState.lastAction) {
      const { type } = gameState.lastAction;
      if (type === 'gofish') showToast('🐟 Go Fish!', 'normal');
      else if (type === 'success') showToast('✅ Got some!', 'success');
    }
  }, [gameState.lastAction]);

  useEffect(() => {
    // Deselect if no longer my turn
    if (!isMyTurn) setSelectedCountry(null);
  }, [isMyTurn]);

  function showToast(msg, type = 'normal') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 1800);
  }

  function handleCardClick(card) {
    if (!isMyTurn) return;
    setSelectedCountry(prev => prev === card.country ? null : card.country);
  }

  function handleAsk(targetId) {
    if (!selectedCountry || !targetId) return;
    socket.emit('ask-for-country', { roomCode, targetPlayerId: targetId, country: selectedCountry });
    setSelectedCountry(null);
  }

  function handleStart() {
    socket.emit('start-game', { roomCode });
  }

  function handleRestart() {
    socket.emit('restart-game', { roomCode });
  }

  const selectedCardInfo = selectedCountry
    ? { flag: COUNTRY_FLAGS[selectedCountry], name: COUNTRY_NAMES[selectedCountry] }
    : null;

  // ── WAITING ROOM ──────────────────────────────────────────────────────
  if (phase === 'lobby') {
    return (
      <div className="waiting-room">
        <div className="room-code-box">
          <div className="label">Room Code — share with friends</div>
          <div className="code">{roomCode}</div>
        </div>

        <div className="players-list">
          <h3>Players ({players.length}/4)</h3>
          {players.map(p => (
            <div key={p.id} className="player-item">
              <div className="player-avatar">{initials(p.name)}</div>
              <span>{p.name}{p.id === playerId ? ' (you)' : ''}</span>
              {p.isHost && <span className="player-host-badge">host</span>}
            </div>
          ))}
        </div>

        {isHost ? (
          <button
            className="btn btn-success"
            style={{ width: '100%', maxWidth: 360 }}
            disabled={players.length < 2}
            onClick={handleStart}
          >
            {players.length < 2 ? 'Waiting for players…' : '🎮 Start Game'}
          </button>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 8 }}>
            Waiting for host to start…
          </div>
        )}

        {error && <div className="error-banner">⚠️ {error}</div>}
      </div>
    );
  }

  // ── END SCREEN ────────────────────────────────────────────────────────
  if (phase === 'ended') {
    const sorted = [...players].sort((a, b) => b.books.length - a.books.length);
    const winner = sorted[0];
    return (
      <div className="end-overlay">
        <div className="end-card">
          <div className="end-trophy">🏆</div>
          <div className="end-title">Game Over!</div>
          <div className="end-winner">{winner.name} wins!</div>
          <div className="scores-list">
            {sorted.map((p, i) => (
              <div key={p.id} className={`score-row${i === 0 ? ' winner' : ''}`}>
                <span>{i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : '🥉 '}{p.name}{p.id === playerId ? ' (you)' : ''}</span>
                <span>{p.books.length} book{p.books.length !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
          {isHost && (
            <button className="btn btn-success" onClick={handleRestart}>
              🔄 Play Again
            </button>
          )}
          {!isHost && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Waiting for host to restart…
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── PLAYING ───────────────────────────────────────────────────────────
  const currentPlayerName = players[currentPlayerIndex]?.name;

  return (
    <div className="game-board">
      {/* Top bar */}
      <div className="top-bar">
        <span className="top-bar-title">🐟 Go Fish</span>
        <span className="deck-count">🃏 {deckCount} in deck</span>
      </div>

      {/* Turn banner */}
      <div className={`turn-banner ${isMyTurn ? 'my-turn' : 'other-turn'}`}>
        {isMyTurn
          ? '⭐ Your turn — tap a card, then choose who to ask'
          : `⏳ ${currentPlayerName}'s turn…`}
      </div>

      {/* Opponents */}
      <div className="opponents-area">
        {opponents.map(opp => (
          <div
            key={opp.id}
            className={`opponent-card${isMyTurn && selectedCountry ? ' targetable' : ''}${players[currentPlayerIndex]?.id === opp.id ? ' active-turn' : ''}`}
            onClick={() => isMyTurn && selectedCountry && handleAsk(opp.id)}
          >
            <div className="opponent-avatar">{initials(opp.name)}</div>
            <div className="opponent-name">{opp.name}</div>
            <div className="opponent-cards">🃏 {opp.handCount}</div>
            {opp.books.length > 0 && (
              <div className="opponent-books">
                {opp.books.map(b => (
                  <span key={b} className="book-flag">{COUNTRY_FLAGS[b]}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Game log */}
      <GameLog log={log} />

      {/* My books */}
      <div className="my-books-strip">
        <span className="my-books-label">My Books</span>
        <div className="my-books-flags">
          {(me?.books || []).length === 0
            ? <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>none yet</span>
            : (me?.books || []).map(b => (
              <div key={b} className="my-book-item">
                <span>{COUNTRY_FLAGS[b]}</span>
                <span style={{ fontSize: '0.72rem' }}>{COUNTRY_NAMES[b]}</span>
              </div>
            ))
          }
        </div>
      </div>

      {/* Ask panel — appears when a country is selected */}
      {isMyTurn && selectedCountry && (
        <div className="ask-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="ask-panel-label">Ask about:</div>
              <div className="ask-panel-country">
                {selectedCardInfo.flag} {selectedCardInfo.name}
              </div>
            </div>
            <button className="ask-cancel-btn" onClick={() => setSelectedCountry(null)}>✕ cancel</button>
          </div>
          <div className="ask-panel-players">
            {opponents.map(opp => (
              <button
                key={opp.id}
                className="ask-player-btn"
                onClick={() => handleAsk(opp.id)}
              >
                {initials(opp.name)} {opp.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hand */}
      <div className="hand-area">
        <div className="hand-scroll">
          {handGrouped.map(card => (
            <Card
              key={card.id}
              card={card}
              selected={selectedCountry === card.country}
              disabled={!isMyTurn}
              onClick={() => handleCardClick(card)}
            />
          ))}
          {myHand.length === 0 && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '10px 0' }}>
              No cards in hand
            </span>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast${toast.type === 'success' ? ' success' : ''}`}>
          {toast.msg}
        </div>
      )}

      {/* Error */}
      {error && <div className="toast error">⚠️ {error}</div>}
    </div>
  );
}
