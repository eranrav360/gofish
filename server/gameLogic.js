const COUNTRIES = require('./countries');

function createDeck() {
  const deck = [];
  for (const country of COUNTRIES) {
    for (const char of country.characteristics) {
      deck.push({
        id: char.id,
        country: country.id,
        countryName: country.name,
        countryFlag: country.flag,
        characteristic: char.label,
        emoji: char.emoji,
      });
    }
  }
  return shuffle(deck);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dealCards(deck, playerCount) {
  const handSize = 6;
  const hands = Array.from({ length: playerCount }, () => []);
  const deckCopy = [...deck];
  for (let i = 0; i < handSize * playerCount; i++) {
    hands[i % playerCount].push(deckCopy.pop());
  }
  return { hands, deck: deckCopy };
}

function extractBooks(hand) {
  const counts = {};
  for (const card of hand) {
    counts[card.country] = (counts[card.country] || []);
    counts[card.country].push(card);
  }
  const bookCountries = Object.keys(counts).filter(c => counts[c].length === 4);
  const newHand = hand.filter(card => !bookCountries.includes(card.country));
  return { hand: newHand, newBooks: bookCountries };
}

module.exports = { createDeck, dealCards, extractBooks };
