/**
 * ============================================================================
 * JAANESH FART COMMAND CENTER - WEB AUDIO ENGINE & INTERACTIVE LOGIC
 * ============================================================================
 */

// Global Audio Context initialized upon user interaction
let audioCtx = null;
let isAudioMuted = false;
let sirenOsc = null;
let isSirenPlaying = false;

function initAudio() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// Generate distortion curve for squelchy fart harmonics
function makeDistortionCurve(amount = 20) {
  const k = typeof amount === 'number' ? amount : 50;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

// Create a buffer of white/pink noise for air rush
function createNoiseBuffer(ctx, duration = 1.0) {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/**
 * Procedural Web Audio Fart Synthesizer
 * Produces ultra-realistic, dynamic, squelchy flatulence sounds offline!
 */
function synthesizeFart(type = 'random') {
  if (isAudioMuted) return;
  initAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;

  // Sound preset profiles
  const profiles = {
    atomic: {
      duration: 1.8,
      startFreq: 85,
      endFreq: 30,
      flutterFreq: 18,
      flutterDepth: 45,
      filterQ: 5,
      noiseGainVal: 0.35,
      oscGainVal: 0.9,
      type: 'sawtooth'
    },
    wet: {
      duration: 0.85,
      startFreq: 120,
      endFreq: 50,
      flutterFreq: 38,
      flutterDepth: 75,
      filterQ: 8,
      noiseGainVal: 0.45,
      oscGainVal: 0.85,
      type: 'triangle'
    },
    squeak: {
      duration: 0.45,
      startFreq: 360,
      endFreq: 190,
      flutterFreq: 45,
      flutterDepth: 50,
      filterQ: 10,
      noiseGainVal: 0.1,
      oscGainVal: 0.7,
      type: 'sawtooth'
    },
    trumpet: {
      duration: 1.1,
      startFreq: 145,
      endFreq: 75,
      flutterFreq: 24,
      flutterDepth: 35,
      filterQ: 4,
      noiseGainVal: 0.2,
      oscGainVal: 0.8,
      type: 'sawtooth'
    },
    sputter: {
      duration: 1.3,
      startFreq: 95,
      endFreq: 40,
      flutterFreq: 12,
      flutterDepth: 60,
      filterQ: 6,
      noiseGainVal: 0.4,
      oscGainVal: 0.8,
      type: 'sawtooth'
    },
    defconBrown: {
      duration: 2.2,
      startFreq: 110,
      endFreq: 22,
      flutterFreq: 15,
      flutterDepth: 65,
      filterQ: 7,
      noiseGainVal: 0.6,
      oscGainVal: 1.0,
      type: 'sawtooth'
    },
    sbd: {
      duration: 1.5,
      startFreq: 60,
      endFreq: 35,
      flutterFreq: 8,
      flutterDepth: 20,
      filterQ: 2,
      noiseGainVal: 0.55,
      oscGainVal: 0.3,
      type: 'sine'
    }
  };

  let chosen = profiles[type];
  if (!chosen) {
    const keys = Object.keys(profiles);
    chosen = profiles[keys[Math.floor(Math.random() * keys.length)]];
  }

  // 1. Primary Cheek Flap Oscillator
  const osc = audioCtx.createOscillator();
  osc.type = chosen.type;
  osc.frequency.setValueAtTime(chosen.startFreq, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(15, chosen.endFreq), now + chosen.duration);

  // 2. Flutter LFO (creates the vibration / flutter of intestinal gas escape)
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.setValueAtTime(chosen.flutterFreq, now);
  lfoGain.gain.setValueAtTime(chosen.flutterDepth, now);
  lfo.connect(osc.frequency);

  // 3. Noise generation for air pressure component
  const noiseBuffer = createNoiseBuffer(audioCtx, chosen.duration);
  const noiseSource = audioCtx.createBufferSource();
  noiseSource.buffer = noiseBuffer;

  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.setValueAtTime(800, now);
  noiseFilter.Q.setValueAtTime(3, now);

  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(chosen.noiseGainVal, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, now + chosen.duration);
  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);

  // 4. Main Biquad Filter (Sweeps downwards like real acoustics)
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1400, now);
  filter.frequency.exponentialRampToValueAtTime(150, now + chosen.duration);
  filter.Q.setValueAtTime(chosen.filterQ, now);

  // 5. Waveshaper Distortion (Adds raspy crunch)
  const distortion = audioCtx.createWaveShaper();
  distortion.curve = makeDistortionCurve(35);
  distortion.oversample = '4x';

  // 6. Master Volume Envelope
  const masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(chosen.oscGainVal, now);
  masterGain.gain.setValueAtTime(chosen.oscGainVal * 1.1, now + chosen.duration * 0.2);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + chosen.duration);

  // Route nodes
  osc.connect(distortion);
  distortion.connect(filter);
  filter.connect(masterGain);
  noiseGain.connect(masterGain);
  masterGain.connect(audioCtx.destination);

  // Trigger sound
  lfo.start(now);
  osc.start(now);
  noiseSource.start(now);

  lfo.stop(now + chosen.duration);
  osc.stop(now + chosen.duration);
  noiseSource.stop(now + chosen.duration);
}

// Machine Gun Rapid Burst Farts
function playMachineGunFart() {
  const burstCount = Math.floor(Math.random() * 3) + 4; // 4 to 6 bursts
  for (let i = 0; i < burstCount; i++) {
    setTimeout(() => {
      synthesizeFart(Math.random() > 0.4 ? 'wet' : 'squeak');
      triggerScreenShake(0.15);
    }, i * 140);
  }
}

// Emergency Warning Siren
function toggleEmergencySiren() {
  initAudio();
  if (!audioCtx) return;

  const sirenBtn = document.getElementById('sirenBtn');

  if (isSirenPlaying) {
    if (sirenOsc) {
      try { sirenOsc.stop(); } catch(e){}
      sirenOsc = null;
    }
    isSirenPlaying = false;
    if (sirenBtn) {
      sirenBtn.textContent = '🚨 SIREN';
      sirenBtn.style.background = '';
    }
    return;
  }

  isSirenPlaying = true;
  if (sirenBtn) {
    sirenBtn.textContent = '🛑 STOP SIREN';
    sirenBtn.style.background = 'var(--color-danger-red)';
    sirenBtn.style.color = '#fff';
  }

  const now = audioCtx.currentTime;
  sirenOsc = audioCtx.createOscillator();
  const sirenGain = audioCtx.createGain();
  sirenOsc.type = 'sawtooth';

  // Siren modulation
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.setValueAtTime(0.8, now); // Warbles every 1.25 sec
  lfoGain.gain.setValueAtTime(280, now);
  sirenOsc.frequency.setValueAtTime(650, now);

  lfo.connect(sirenOsc.frequency);
  sirenGain.gain.setValueAtTime(0.2, now);

  sirenOsc.connect(sirenGain);
  sirenGain.connect(audioCtx.destination);

  lfo.start(now);
  sirenOsc.start(now);
}

// Global hook for buttons in HTML
window.playFartSound = function(type) {
  if (type === 'machineGun') {
    playMachineGunFart();
  } else {
    synthesizeFart(type);
  }
  incrementFartScore();
  triggerScreenShake();
  createToxicFlash();
};

/**
 * Screen shake animation
 */
function triggerScreenShake(durationSec = 0.4) {
  document.body.classList.remove('screen-shake');
  void document.body.offsetWidth; // Trigger reflow
  document.body.classList.add('screen-shake');
  setTimeout(() => {
    document.body.classList.remove('screen-shake');
  }, durationSec * 1000);
}

/**
 * Toxic flash effect
 */
function createToxicFlash() {
  const flash = document.createElement('div');
  flash.className = 'toxic-flash';
  document.body.appendChild(flash);
  setTimeout(() => {
    flash.style.opacity = '0';
    setTimeout(() => flash.remove(), 500);
  }, 100);
}

/**
 * Floating Onomatopoeia (e.g. *PFFFRRRTTT*, *BRRRAP*)
 */
const fartWords = [
  '💨 *PFFFFFFFFFT!*',
  '💥 *BRAAAAAAP!*',
  '💦 *SQUELCH!*',
  '🦨 *SILENT BUT LETHAL*',
  '⚡ *DECIBEL OVERLOAD*',
  '☣️ *BIO-WEAPON RELEASED*',
  '☢️ *DEFCON BROWN!*',
  '💩 *ROOM EVACUATED!*',
  '🌪️ *ATMOSPHERIC RUPTURE*',
  '🎺 *TRUMPET OF DOOM*'
];

function spawnFloatingText(x, y) {
  const el = document.createElement('div');
  el.className = 'floating-onomatopoeia';
  el.textContent = fartWords[Math.floor(Math.random() * fartWords.length)];
  el.style.left = `${x || (window.innerWidth / 2)}px`;
  el.style.top = `${y || (window.innerHeight / 2)}px`;
  document.body.appendChild(el);

  setTimeout(() => {
    el.remove();
  }, 1200);
}

/**
 * GAME & STATS TRACKING
 */
let fartCount = parseInt(localStorage.getItem('jaanesh_fart_count') || '0', 10);

const achievements = [
  { threshold: 1, text: "Achievement: First Blast! You've officially disrupted room oxygen." },
  { threshold: 5, text: "Achievement: Room Emptier! All bystanders have evacuated." },
  { threshold: 12, text: "Achievement: Bio-Weapon Status! NATO and UN council notified." },
  { threshold: 25, text: "Achievement: Ozone Slayer! Antarctic ice shelf fractured by 4%." },
  { threshold: 50, text: "Achievement: Legendary Flatulence God! Jaanesh declared a global disaster." }
];

function updateStatsDisplay() {
  const scoreEl = document.getElementById('fartScore');
  const ozoneEl = document.getElementById('ozoneTear');
  const evacEl = document.getElementById('evacueeCount');
  const aqiEl = document.getElementById('aqiCounter');
  const achievementTextEl = document.getElementById('achievementText');

  if (scoreEl) scoreEl.textContent = fartCount.toLocaleString();
  if (ozoneEl) ozoneEl.textContent = (fartCount * 0.18).toFixed(1);
  if (evacEl) evacEl.textContent = (fartCount * 14).toLocaleString();
  if (aqiEl) {
    const calculatedAQI = 9842 + (fartCount * 85);
    aqiEl.textContent = calculatedAQI.toLocaleString();
  }

  // Check achievements
  for (let i = achievements.length - 1; i >= 0; i--) {
    if (fartCount >= achievements[i].threshold) {
      if (achievementTextEl) achievementTextEl.textContent = achievements[i].text;
      break;
    }
  }

  localStorage.setItem('jaanesh_fart_count', fartCount.toString());
}

function incrementFartScore(amount = 1) {
  fartCount += amount;
  updateStatsDisplay();

  // Pulse the radar bar
  const radarBar = document.getElementById('gasGaugeBar');
  if (radarBar) {
    const randomPercent = Math.min(100, Math.max(30, 45 + (fartCount % 50)));
    radarBar.style.width = `${randomPercent}%`;
  }
}

/**
 * SOUNDBOARD DATA & SETUP
 */
const soundboardData = [
  { id: 'atomic', name: 'The Atomic Thunder', emoji: '💣', intensity: 'NUCLEAR', desc: 'Sub-bass Richter scale event. Causes walls to shudder.', class: 'intensity-nuclear' },
  { id: 'wet', name: 'The Wet & Wild', emoji: '💦', intensity: 'HIGH', desc: 'Deeply concerning liquid acoustic resonance. Panic guaranteed.', class: 'intensity-high' },
  { id: 'squeak', name: 'The Mouse Squeaker', emoji: '🐭', intensity: 'LOW', desc: 'High-pitched squeak. Sneaky, stealthy, and deadly.', class: 'intensity-low' },
  { id: 'machineGun', name: 'The AK-47 Rapid Fire', emoji: '🔫', intensity: 'HIGH', desc: 'Staccato 5-round bursts of high velocity biological gas.', class: 'intensity-high' },
  { id: 'trumpet', name: "The Gabriel's Trumpet", emoji: '🎺', intensity: 'MED', desc: 'Loud brassy blast. Impossible to deny under oath.', class: 'intensity-med' },
  { id: 'defconBrown', name: 'DEFCON Brown Meltdown', emoji: '☢️', intensity: 'NUCLEAR', desc: 'Maximum methane saturation. Requires immediate HAZMAT suit.', class: 'intensity-nuclear' },
  { id: 'sbd', name: 'Silent But Deadly (SBD)', emoji: '🦨', intensity: 'EXTREME', desc: 'Virtually silent hiss followed by instant eye tearing.', class: 'intensity-high' },
  { id: 'sputter', name: 'The Sputtering Engine', emoji: '🚜', intensity: 'MED', desc: 'Sounds like an old two-stroke diesel tractor struggling to start.', class: 'intensity-med' }
];

function buildSoundboard() {
  const grid = document.getElementById('soundboardGrid');
  if (!grid) return;

  grid.innerHTML = '';
  soundboardData.forEach(item => {
    const card = document.createElement('div');
    card.className = 'sound-btn-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.innerHTML = `
      <div class="sound-header">
        <span class="sound-emoji">${item.emoji}</span>
        <span class="sound-intensity ${item.class}">${item.intensity}</span>
      </div>
      <div class="sound-name">${item.name}</div>
      <div class="sound-desc">${item.desc}</div>
    `;

    card.addEventListener('click', (e) => {
      window.playFartSound(item.id);
      spawnFloatingText(e.clientX, e.clientY);
    });

    grid.appendChild(card);
  });
}

/**
 * TOXIC CANVAS PARTICLE SYSTEM
 * Floating bubbles, fart clouds, and skulls
 */
function initCanvasParticles() {
  const canvas = document.getElementById('fartCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const particleCount = 35;

  class Particle {
    constructor() {
      this.reset();
      this.y = Math.random() * height; // initial random spread
    }

    reset() {
      this.x = Math.random() * width;
      this.y = height + Math.random() * 50;
      this.radius = Math.random() * 30 + 10;
      this.speedY = Math.random() * 1.5 + 0.5;
      this.speedX = (Math.random() - 0.5) * 1.2;
      this.opacity = Math.random() * 0.4 + 0.1;
      this.hue = Math.random() > 0.3 ? 120 : 60; // green or yellow
    }

    update() {
      this.y -= this.speedY;
      this.x += this.speedX;
      if (this.y < -this.radius || this.x < -this.radius || this.x > width + this.radius) {
        this.reset();
      }
    }

    draw() {
      ctx.beginPath();
      const grad = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, this.radius
      );
      grad.addColorStop(0, `hsla(${this.hue}, 100%, 50%, ${this.opacity})`);
      grad.addColorStop(1, `hsla(${this.hue}, 100%, 30%, 0)`);
      ctx.fillStyle = grad;
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animate);
  }

  animate();
}

/**
 * INITIALIZATION & EVENT LISTENERS
 */
document.addEventListener('DOMContentLoaded', () => {
  buildSoundboard();
  updateStatsDisplay();
  initCanvasParticles();

  // Enter button on Gas Mask modal
  const enterBtn = document.getElementById('enterBtn');
  const introModal = document.getElementById('introModal');
  if (enterBtn && introModal) {
    enterBtn.addEventListener('click', () => {
      initAudio();
      synthesizeFart('defconBrown');
      triggerScreenShake(0.6);
      introModal.classList.add('hidden');
    });
  }

  // Big Jaanesh Hero Interactive Button
  const jaaneshBtn = document.getElementById('jaaneshBigBtn');
  if (jaaneshBtn) {
    jaaneshBtn.addEventListener('click', (e) => {
      jaaneshBtn.classList.remove('detonated');
      void jaaneshBtn.offsetWidth;
      jaaneshBtn.classList.add('detonated');

      const randType = ['atomic', 'wet', 'squeak', 'trumpet', 'sputter', 'defconBrown'][Math.floor(Math.random() * 6)];
      window.playFartSound(randType);
      spawnFloatingText(e.clientX, e.clientY);
    });
  }

  // Panic Dock Controls
  const sirenBtn = document.getElementById('sirenBtn');
  if (sirenBtn) {
    sirenBtn.addEventListener('click', toggleEmergencySiren);
  }

  const randomFartBtn = document.getElementById('randomFartBtn');
  if (randomFartBtn) {
    randomFartBtn.addEventListener('click', (e) => {
      window.playFartSound('random');
      spawnFloatingText(e.clientX, e.clientY);
    });
  }

  const muteBtn = document.getElementById('muteBtn');
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      isAudioMuted = !isAudioMuted;
      muteBtn.textContent = isAudioMuted ? '🔇 AUDIO MUTED' : '🔊 AUDIO ON';
      muteBtn.style.borderColor = isAudioMuted ? 'var(--color-danger-red)' : 'var(--color-toxic-green)';
      muteBtn.style.color = isAudioMuted ? 'var(--color-danger-red)' : 'var(--color-toxic-green)';
    });
  }

  // Maximum Burst Radar Test Button
  const detonateTestBtn = document.getElementById('detonateTestBtn');
  if (detonateTestBtn) {
    detonateTestBtn.addEventListener('click', () => {
      const radarBar = document.getElementById('gasGaugeBar');
      if (radarBar) {
        radarBar.style.width = '100%';
        radarBar.style.background = 'var(--color-danger-red)';
      }
      synthesizeFart('defconBrown');
      triggerScreenShake(0.8);
      createToxicFlash();
      incrementFartScore(5);
      spawnFloatingText(window.innerWidth / 2, window.innerHeight / 2);
    });
  }

  // Official Citation Stamp button
  const stampBtn = document.getElementById('stampCitationBtn');
  if (stampBtn) {
    stampBtn.addEventListener('click', () => {
      synthesizeFart('trumpet');
      stampBtn.textContent = '✅ OFFICIALLY CITATED & REGISTERED!';
      stampBtn.style.background = 'var(--color-danger-red)';
      stampBtn.style.color = '#fff';
      alert('🚨 Official Citation logged! Share this website link directly with Jaanesh to serve him his biohazard penalty! 💨');
    });
  }
});
