/* ==========================================================================
   PARTY ARCADE WEBAUDIO SOUND ENGINE - SFX.JS
   Punchy, synthesized sound effects with zero external audio assets
   ========================================================================== */
const SFX = (() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) ctx = new AudioCtx();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  // Basic synthesized tone generator
  function tone(freq, type = 'sine', duration = 0.1, gainVal = 0.15, pitchEnd = null) {
    try {
      const c = getCtx();
      if (!c) return;
      const osc = c.createOscillator();
      const gain = c.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, c.currentTime);
      if (pitchEnd !== null) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(10, pitchEnd), c.currentTime + duration);
      }

      gain.gain.setValueAtTime(gainVal, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);

      osc.connect(gain);
      gain.connect(c.destination);

      osc.start();
      osc.stop(c.currentTime + duration);
    } catch(e) {}
  }

  // Noise generator for tactile card slides and chips
  function noise(duration = 0.05, gainVal = 0.1) {
    try {
      const c = getCtx();
      if (!c) return;
      const bufferSize = c.sampleRate * duration;
      const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noiseNode = c.createBufferSource();
      noiseNode.buffer = buffer;
      const gain = c.createGain();
      gain.gain.setValueAtTime(gainVal, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);

      noiseNode.connect(gain);
      gain.connect(c.destination);
      noiseNode.start();
    } catch(e) {}
  }

  return {
    tap() {
      tone(440, 'sine', 0.06, 0.12, 600);
    },
    pop() {
      tone(320, 'triangle', 0.09, 0.2, 700);
    },
    cardDeal() {
      noise(0.04, 0.08);
      tone(350, 'triangle', 0.05, 0.08, 180);
    },
    cardPlay() {
      tone(520, 'sine', 0.08, 0.15, 680);
      noise(0.03, 0.06);
    },
    chip() {
      tone(1200, 'sine', 0.04, 0.12, 900);
      setTimeout(() => tone(1500, 'sine', 0.04, 0.1, 1100), 30);
    },
    drop() {
      // Connect 4 disk clonk
      tone(220, 'sine', 0.12, 0.25, 80);
      setTimeout(() => tone(140, 'triangle', 0.08, 0.15), 50);
    },
    unoCall() {
      // Party trumpet sound
      tone(587.33, 'square', 0.15, 0.15); // D5
      setTimeout(() => tone(880, 'square', 0.25, 0.2), 140); // A5
    },
    win() {
      // Victory fanfare
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((f, i) => {
        setTimeout(() => tone(f, 'triangle', 0.25, 0.2), i * 110);
      });
    },
    loss() {
      tone(300, 'sawtooth', 0.2, 0.15, 120);
    },
    join() {
      tone(523.25, 'sine', 0.1, 0.15, 659.25);
    }
  };
})();
