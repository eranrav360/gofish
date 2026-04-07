let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function tone(freq, startTime, duration, volume = 0.25, type = 'sine') {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime + startTime);
  gain.gain.setValueAtTime(volume, ac.currentTime + startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + startTime + duration);
  osc.start(ac.currentTime + startTime);
  osc.stop(ac.currentTime + startTime + duration + 0.01);
}

// ✅ Got a card — bright ascending chord
export function playSuccess() {
  tone(523, 0,    0.12); // C5
  tone(659, 0.1,  0.12); // E5
  tone(784, 0.2,  0.25); // G5
}

// 📚 Book completed — short fanfare
export function playBook() {
  tone(523, 0,    0.1);
  tone(659, 0.08, 0.1);
  tone(784, 0.16, 0.1);
  tone(1047, 0.24, 0.4);
}

// ❌ Wrong guess — descending buzz
export function playFail() {
  tone(330, 0,    0.18, 0.22, 'sawtooth');
  tone(262, 0.15, 0.28, 0.18, 'sawtooth');
}

// 🐟 Go Fish — low plop
export function playGoFish() {
  tone(220, 0,    0.1, 0.2, 'triangle');
  tone(196, 0.08, 0.2, 0.15, 'triangle');
}

// 🃏 Drew a card — soft tick
export function playDraw() {
  tone(880, 0,    0.06, 0.15, 'triangle');
  tone(660, 0.05, 0.1,  0.1,  'triangle');
}

// 🍀 Lucky draw — playful bounce
export function playLucky() {
  tone(440, 0,    0.08);
  tone(554, 0.07, 0.08);
  tone(659, 0.14, 0.08);
  tone(880, 0.21, 0.2);
}

// 🏆 Game over — victory
export function playWin() {
  tone(523, 0,    0.12);
  tone(659, 0.12, 0.12);
  tone(784, 0.24, 0.12);
  tone(1047, 0.36, 0.5);
  tone(784, 0.5,  0.12);
  tone(1047, 0.62, 0.6);
}

export function playSoundForMessage(msg) {
  try {
    if (msg.includes('🏆')) { playWin(); return; }
    if (msg.includes('📚')) { playBook(); return; }
    if (msg.includes('✅')) { playSuccess(); return; }
    if (msg.includes('🍀')) { playLucky(); return; }
    if (msg.includes('❌')) { playFail(); return; }
    if (msg.includes('🐟')) { playGoFish(); return; }
    if (msg.includes('🃏')) { playDraw(); return; }
  } catch (e) {
    // AudioContext may be blocked until user interaction — silently ignore
  }
}
