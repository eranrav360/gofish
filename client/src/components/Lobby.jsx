import { useState } from 'react';
import socket from '../socket';

export default function Lobby({ error }) {
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState(null); // null | 'create' | 'join'

  const canSubmit = name.trim().length >= 2;

  function handleCreate() {
    if (!canSubmit) return;
    socket.emit('create-room', { playerName: name.trim() });
  }

  function handleJoin() {
    if (!canSubmit || joinCode.length < 4) return;
    socket.emit('join-room', { roomCode: joinCode.toUpperCase(), playerName: name.trim() });
  }

  return (
    <div className="lobby">
      <div className="lobby-title">🐟 Go Fish</div>
      <div className="lobby-subtitle">Countries Edition · 2–4 Players</div>

      <div className="lobby-card">
        <div>
          <h2>Your Name</h2>
          <input
            className="input"
            placeholder="Enter your name"
            value={name}
            maxLength={16}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && mode === 'create') handleCreate(); }}
          />
        </div>

        {!mode && (
          <>
            <button
              className="btn btn-success"
              disabled={!canSubmit}
              onClick={() => { setMode('create'); handleCreate(); }}
            >
              🌍 Create New Room
            </button>
            <div className="divider">or</div>
            <button
              className="btn btn-secondary"
              disabled={!canSubmit}
              onClick={() => setMode('join')}
            >
              🔗 Join with Code
            </button>
          </>
        )}

        {mode === 'join' && (
          <>
            <div>
              <h2>Room Code</h2>
              <div className="input-row">
                <input
                  className="input"
                  placeholder="XXXX"
                  maxLength={4}
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={e => { if (e.key === 'Enter') handleJoin(); }}
                  autoFocus
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => setMode(null)}>
                ← Back
              </button>
              <button
                className="btn btn-primary"
                disabled={!canSubmit || joinCode.length < 4}
                onClick={handleJoin}
              >
                Join Room
              </button>
            </div>
          </>
        )}
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      <div style={{ marginTop: 24, color: 'var(--text-muted)', fontSize: '0.78rem', textAlign: 'center', lineHeight: 1.8 }}>
        Collect all 4 characteristics of a country to score a book.<br />
        13 countries · 52 cards · First to finish wins!
      </div>
    </div>
  );
}
