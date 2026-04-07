import { useState, useEffect, useRef } from 'react';
import socket from '../socket';
import Card from './Card';
import { COUNTRIES_MAP } from '../countries';
import { playSoundForMessage } from '../sounds';

const COUNTRY_FLAGS = Object.fromEntries(Object.entries(COUNTRIES_MAP).map(([id, c]) => [id, c.flag]));
const COUNTRY_NAMES = Object.fromEntries(Object.entries(COUNTRIES_MAP).map(([id, c]) => [id, c.name]));

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function GameBoard({ gameState, playerId, roomCode, error }) {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [toast, setToast] = useState(null);
  const [bannerText, setBannerText] = useState('');
  const [bannerKey, setBannerKey] = useState(0);
  const [peekCountry, setPeekCountry] = useState(null);

  // Banner queue — ref-based so we don't need extra re-renders
  const queueRef = useRef([]);
  const processingRef = useRef(false);
  const prevLogRef = useRef([]);
  const timerRef = useRef(null);

  const { phase, players, currentPlayerIndex, deckCount, log, awaitingGuess } = gameState;
  const me = players.find(p => p.id === playerId);
  const opponents = players.filter(p => p.id !== playerId);
  const isMyTurn = me && players[currentPlayerIndex]?.id === playerId;
  const isHost = me?.isHost;
  const iAmGuessing = awaitingGuess?.askerId === playerId;

  const myHand = me?.hand || [];
  const handGrouped = [...myHand].sort((a, b) => a.country.localeCompare(b.country));

  function processQueue() {
    if (queueRef.current.length === 0) {
      processingRef.current = false;
      return;
    }
    const msg = queueRef.current.shift();
    setBannerText(msg);
    setBannerKey(k => k + 1);
    playSoundForMessage(msg);
    if (queueRef.current.length > 0) {
      // More messages waiting — show each for 2.2 seconds then advance
      timerRef.current = setTimeout(processQueue, 2200);
    } else {
      // Last message stays until next event
      processingRef.current = false;
    }
  }

  useEffect(() => {
    if (!log || log.length === 0) return;
    const prev = prevLogRef.current;

    // Detect full reset (game restart) vs incremental update
    const isReset = log.length <= 1 || (prev.length > 0 && log[0] !== prev[0]);
    const newEntries = isReset ? log : log.slice(prev.length);
    prevLogRef.current = log;

    if (newEntries.length === 0) return;

    if (isReset) {
      // Clear any pending queue on restart
      queueRef.current = [];
      if (timerRef.current) clearTimeout(timerRef.current);
      processingRef.current = false;
    }

    queueRef.current.push(...newEntries);

    if (!processingRef.current) {
      processingRef.current = true;
      processQueue();
    }
  }, [log]);

  useEffect(() => {
    if (!isMyTurn) setSelectedCountry(null);
  }, [isMyTurn]);

  function showToast(msg, type = 'normal') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 1800);
  }

  function handleCardClick(card) {
    if (!isMyTurn || !!awaitingGuess) return;
    // Open peek overlay for this country
    setPeekCountry(card.country);
    setSelectedCountry(card.country);
  }

  function handleAsk(targetId) {
    if (!selectedCountry || !targetId) return;
    socket.emit('ask-for-country', { roomCode, targetPlayerId: targetId, country: selectedCountry });
    setSelectedCountry(null);
    setPeekCountry(null);
  }

  function handleGuess(characteristicId) {
    socket.emit('guess-characteristic', { roomCode, characteristicId });
  }

  function handleStart() {
    socket.emit('start-game', { roomCode });
  }

  function handleRestart() {
    socket.emit('restart-game', { roomCode });
  }

  function closePeek() {
    setPeekCountry(null);
    setSelectedCountry(null);
  }

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
            style={{ width: '100%', maxWidth: 380 }}
            disabled={players.length < 2}
            onClick={handleStart}
          >
            {players.length < 2 ? 'Waiting for players…' : '🎮 Start Game'}
          </button>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 8 }}>
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
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Waiting for host to restart…
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── PLAYING ───────────────────────────────────────────────────────────
  const currentPlayerName = players[currentPlayerIndex]?.name;
  const peekData = peekCountry ? COUNTRIES_MAP[peekCountry] : null;

  return (
    <div className="game-board">
      {/* Top bar */}
      <div className="top-bar">
        <span className="top-bar-title">🐟 Go Fish</span>
        <span className="deck-count">🃏 {deckCount} in deck</span>
      </div>

      {/* Turn banner */}
      <div className={`turn-banner ${isMyTurn || iAmGuessing ? 'my-turn' : 'other-turn'}`}>
        {iAmGuessing
          ? `🎯 Guess which ${COUNTRY_FLAGS[awaitingGuess.country]} ${COUNTRY_NAMES[awaitingGuess.country]} card they hold!`
          : isMyTurn
            ? '⭐ Your turn — tap a card, then choose who to ask'
            : `⏳ ${currentPlayerName}'s turn…`}
      </div>

      {/* Opponents */}
      <div className="opponents-area">
        {opponents.map(opp => (
          <div
            key={opp.id}
            className={`opponent-card${isMyTurn && selectedCountry && !peekCountry ? ' targetable' : ''}${players[currentPlayerIndex]?.id === opp.id ? ' active-turn' : ''}`}
            onClick={() => isMyTurn && selectedCountry && !peekCountry && handleAsk(opp.id)}
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

      {/* Action banner */}
      <div className="action-banner">
        {bannerText && (
          <div className="action-banner-text" key={bannerKey}>
            {bannerText}
          </div>
        )}
      </div>

      {/* My books */}
      <div className="my-books-strip">
        <span className="my-books-label">My Books</span>
        <div className="my-books-flags">
          {(me?.books || []).length === 0
            ? <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>none yet</span>
            : (me?.books || []).map(b => (
              <div key={b} className="my-book-item">
                <span>{COUNTRY_FLAGS[b]}</span>
                <span style={{ fontSize: '0.75rem' }}>{COUNTRY_NAMES[b]}</span>
              </div>
            ))
          }
        </div>
      </div>

      {/* Guess panel */}
      {iAmGuessing && (
        <div className="guess-panel">
          <div className="guess-panel-title">
            Which {COUNTRY_FLAGS[awaitingGuess.country]} {COUNTRY_NAMES[awaitingGuess.country]} characteristic do they have?
          </div>
          <div className="guess-grid">
            {(COUNTRIES_MAP[awaitingGuess.country]?.characteristics || []).map(c => (
              <button
                key={c.id}
                className="guess-btn"
                onClick={() => handleGuess(c.id)}
              >
                <span className="guess-btn-emoji">{c.emoji}</span>
                <span className="guess-btn-label">{c.label}</span>
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
              disabled={!isMyTurn || !!awaitingGuess}
              onClick={() => handleCardClick(card)}
            />
          ))}
          {myHand.length === 0 && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '10px 0' }}>
              No cards in hand
            </span>
          )}
        </div>
      </div>

      {/* Peek overlay */}
      {peekCountry && peekData && (
        <div className="peek-overlay" onClick={closePeek}>
          <div className="peek-card" onClick={e => e.stopPropagation()}>
            <div className="peek-title">
              <span>{peekData.flag}</span>
              <span>{peekData.name}</span>
            </div>
            <div className="peek-items">
              {peekData.characteristics.map(c => {
                const iMine = myHand.some(card => card.id === c.id);
                return (
                  <div key={c.id} className={`peek-item${iMine ? ' peek-item-mine' : ''}`}>
                    <span className="peek-item-emoji">{c.emoji}</span>
                    <span className="peek-item-label">{c.label}</span>
                    {iMine && <span className="peek-item-badge">YOU</span>}
                  </div>
                );
              })}
            </div>
            {isMyTurn && (
              <div className="peek-ask-section">
                <div className="peek-ask-label">Ask who has it?</div>
                <div className="peek-ask-buttons">
                  {opponents.map(opp => (
                    <button
                      key={opp.id}
                      className="peek-ask-btn"
                      onClick={() => handleAsk(opp.id)}
                    >
                      {initials(opp.name)} {opp.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button className="peek-cancel-btn" onClick={closePeek}>✕ Close</button>
          </div>
        </div>
      )}

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
