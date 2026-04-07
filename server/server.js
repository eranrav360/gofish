const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createDeck, dealCards, extractBooks } = require('./gameLogic');
const COUNTRIES = require('./countries');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.get('/health', (_, res) => res.json({ status: 'ok' }));

const rooms = {};

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

function getCountryName(id) {
  return COUNTRIES.find(c => c.id === id)?.name || id;
}

function getPublicState(room, forPlayerId) {
  return {
    roomCode: room.code,
    phase: room.phase,
    currentPlayerIndex: room.currentPlayerIndex,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      handCount: p.hand.length,
      books: p.books,
      isHost: p.isHost,
      hand: p.id === forPlayerId ? p.hand : undefined,
    })),
    deckCount: room.deck.length,
    log: room.log.slice(-20),
    lastAction: room.lastAction,
    awaitingGuess: room.awaitingGuess || null,
  };
}

function broadcastState(room) {
  for (const p of room.players) {
    io.to(p.id).emit('game-state', getPublicState(room, p.id));
  }
}

function getNextPlayerIndex(room) {
  const total = room.players.length;
  let next = (room.currentPlayerIndex + 1) % total;
  let tries = 0;
  while (room.players[next].hand.length === 0 && room.deck.length === 0 && tries < total) {
    next = (next + 1) % total;
    tries++;
  }
  return next;
}

function checkGameOver(room) {
  const totalInHands = room.players.reduce((s, p) => s + p.hand.length, 0);
  if (totalInHands === 0 && room.deck.length === 0) {
    const winner = room.players.reduce((best, p) =>
      !best || p.books.length > best.books.length ? p : best, null);
    return winner;
  }
  return null;
}

function applyBooks(player, room) {
  const { hand, newBooks } = extractBooks(player.hand);
  player.hand = hand;
  if (newBooks.length > 0) {
    player.books.push(...newBooks);
    const names = newBooks.map(getCountryName).join(', ');
    room.log.push(`📚 ${player.name} completed a book: ${names}!`);
  }
  return newBooks;
}

io.on('connection', (socket) => {
  socket.on('create-room', ({ playerName }) => {
    const code = generateRoomCode();
    const room = {
      code,
      phase: 'lobby',
      players: [{ id: socket.id, name: playerName, hand: [], books: [], isHost: true }],
      deck: [],
      currentPlayerIndex: 0,
      log: [`${playerName} created the room`],
      lastAction: null,
    };
    rooms[code] = room;
    socket.join(code);
    socket.emit('room-joined', { roomCode: code, playerId: socket.id });
    broadcastState(room);
  });

  socket.on('join-room', ({ roomCode, playerName }) => {
    const room = rooms[roomCode];
    if (!room) return socket.emit('error', 'Room not found');
    if (room.phase !== 'lobby') return socket.emit('error', 'Game already in progress');
    if (room.players.length >= 4) return socket.emit('error', 'Room is full (max 4 players)');
    if (room.players.some(p => p.name.toLowerCase() === playerName.toLowerCase()))
      return socket.emit('error', 'Name already taken in this room');

    room.players.push({ id: socket.id, name: playerName, hand: [], books: [], isHost: false });
    room.log.push(`${playerName} joined the room`);
    socket.join(roomCode);
    socket.emit('room-joined', { roomCode, playerId: socket.id });
    broadcastState(room);
  });

  socket.on('start-game', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player?.isHost) return;
    if (room.players.length < 2) return socket.emit('error', 'Need at least 2 players to start');

    room.deck = createDeck();
    const { hands, deck } = dealCards(room.deck, room.players.length);
    room.deck = deck;

    room.players.forEach((p, i) => {
      p.hand = hands[i];
      p.books = [];
      applyBooks(p, room);
    });

    room.phase = 'playing';
    room.currentPlayerIndex = 0;
    room.log = [`🎮 Game started! ${room.players[0].name}'s turn.`];
    broadcastState(room);
  });

  socket.on('ask-for-country', ({ roomCode, targetPlayerId, country }) => {
    const room = rooms[roomCode];
    if (!room || room.phase !== 'playing') return;

    const currentPlayer = room.players[room.currentPlayerIndex];
    if (currentPlayer.id !== socket.id) return socket.emit('error', 'Not your turn');

    const target = room.players.find(p => p.id === targetPlayerId);
    if (!target || target.id === socket.id) return socket.emit('error', 'Invalid target');

    const hasCountry = currentPlayer.hand.some(c => c.country === country);
    if (!hasCountry) return socket.emit('error', 'You must hold a card of that country to ask for it');

    const countryName = getCountryName(country);
    const targetHas = target.hand.some(c => c.country === country);

    if (targetHas) {
      // Target has the country — asker must now guess the specific characteristic
      room.awaitingGuess = { askerId: socket.id, targetId: target.id, country };
      room.log.push(`🤔 ${currentPlayer.name} asked ${target.name} for ${countryName} — ${target.name} has one! Guess which characteristic…`);
    } else {
      // Go Fish immediately
      goFish(room, currentPlayer, target, country, countryName);
    }

    broadcastState(room);
  });

  socket.on('guess-characteristic', ({ roomCode, characteristicId }) => {
    const room = rooms[roomCode];
    if (!room || room.phase !== 'playing' || !room.awaitingGuess) return;
    if (room.awaitingGuess.askerId !== socket.id) return;

    const { askerId, targetId, country } = room.awaitingGuess;
    room.awaitingGuess = null;

    const currentPlayer = room.players.find(p => p.id === askerId);
    const target = room.players.find(p => p.id === targetId);
    const countryName = getCountryName(country);

    const matchedCard = target.hand.find(c => c.id === characteristicId);

    if (matchedCard) {
      target.hand = target.hand.filter(c => c.id !== characteristicId);
      currentPlayer.hand.push(matchedCard);
      applyBooks(currentPlayer, room);
      room.log.push(`✅ Correct! ${currentPlayer.name} guessed ${matchedCard.characteristic} and got the card!`);
      room.lastAction = { type: 'success', askerId, country, count: 1 };

      if (currentPlayer.hand.length === 0 && room.deck.length > 0) {
        currentPlayer.hand.push(room.deck.pop());
        room.log.push(`${currentPlayer.name}'s hand was empty — drew a card.`);
        applyBooks(currentPlayer, room);
      }

      const winner = checkGameOver(room);
      if (winner) {
        room.phase = 'ended';
        room.log.push(`🏆 ${winner.name} wins with ${winner.books.length} book${winner.books.length > 1 ? 's' : ''}!`);
      } else {
        room.log.push(`${currentPlayer.name}'s turn again.`);
      }
    } else {
      room.log.push(`❌ Wrong guess! ${currentPlayer.name} guessed wrong — Go Fish!`);
      goFish(room, currentPlayer, target, country, countryName);
    }

    broadcastState(room);
  });

  function goFish(room, currentPlayer, target, country, countryName) {
    room.log.push(`🐟 ${currentPlayer.name} asked ${target.name} for ${countryName} — Go Fish!`);
    room.lastAction = { type: 'gofish', askerId: currentPlayer.id, country };

    let lucky = false;
    if (room.deck.length > 0) {
      const drawn = room.deck.pop();
      currentPlayer.hand.push(drawn);
      if (drawn.country === country) {
        lucky = true;
        room.log.push(`🍀 Lucky! ${currentPlayer.name} drew ${countryName} — goes again!`);
      } else {
        room.log.push(`🃏 ${currentPlayer.name} drew a card from the deck.`);
      }
      applyBooks(currentPlayer, room);
    } else {
      room.log.push(`🃏 Deck is empty — no card to draw.`);
    }

    const winner = checkGameOver(room);
    if (winner) {
      room.phase = 'ended';
      room.log.push(`🏆 ${winner.name} wins with ${winner.books.length} book${winner.books.length > 1 ? 's' : ''}!`);
    } else if (!lucky) {
      room.currentPlayerIndex = getNextPlayerIndex(room);
      room.log.push(`${room.players[room.currentPlayerIndex].name}'s turn.`);
    } else {
      room.log.push(`${currentPlayer.name}'s turn again.`);
    }
  }

  socket.on('restart-game', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player?.isHost) return;

    room.phase = 'lobby';
    room.players.forEach(p => { p.hand = []; p.books = []; });
    room.deck = [];
    room.log = ['New game lobby. Host can start when ready.'];
    room.lastAction = null;
    room.awaitingGuess = null;
    broadcastState(room);
  });

  socket.on('disconnect', () => {
    for (const [code, room] of Object.entries(rooms)) {
      const idx = room.players.findIndex(p => p.id === socket.id);
      if (idx === -1) continue;

      const { name, isHost } = room.players[idx];
      room.players.splice(idx, 1);

      if (room.players.length === 0) {
        delete rooms[code];
        return;
      }

      room.log.push(`${name} disconnected.`);

      if (isHost && room.players.length > 0) {
        room.players[0].isHost = true;
        room.log.push(`${room.players[0].name} is now the host.`);
      }

      if (room.phase === 'playing') {
        if (room.currentPlayerIndex >= room.players.length) {
          room.currentPlayerIndex = 0;
        }
        const winner = checkGameOver(room);
        if (winner) {
          room.phase = 'ended';
          room.log.push(`🏆 ${winner.name} wins with ${winner.books.length} books!`);
        }
      }

      broadcastState(room);
      break;
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`GoFish server running on port ${PORT}`));
