import { useState, useEffect } from 'react';
import socket from './socket';
import Lobby from './components/Lobby';
import GameBoard from './components/GameBoard';

export default function App() {
  const [playerId, setPlayerId] = useState(null);
  const [roomCode, setRoomCode] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    socket.connect();

    socket.on('room-joined', ({ roomCode, playerId }) => {
      setRoomCode(roomCode);
      setPlayerId(playerId);
      setError(null);
    });

    socket.on('game-state', (state) => {
      setGameState(state);
    });

    socket.on('error', (msg) => {
      setError(msg);
      setTimeout(() => setError(null), 3000);
    });

    return () => {
      socket.off('room-joined');
      socket.off('game-state');
      socket.off('error');
    };
  }, []);

  if (!roomCode || !gameState) {
    return <Lobby error={error} />;
  }

  return (
    <GameBoard
      gameState={gameState}
      playerId={playerId}
      roomCode={roomCode}
      error={error}
    />
  );
}
