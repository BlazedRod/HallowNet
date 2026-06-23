// AAA Procedural Audio Engine for HallowNet
// Generates high-quality sound effects dynamically without loading external files

let audioCtx = null;

const initAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

export const AudioEngine = {
  playTabOpenSound: () => {
    try {
      initAudioContext();
      const t = audioCtx.currentTime;
      
      // Punchy, spooky UI "bloom" (audible on laptops!)
      const osc = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      // Sharp transient "tick"
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(150, t + 0.1);

      // Warm harmonic body
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(300, t);
      osc2.frequency.exponentialRampToValueAtTime(100, t + 0.2);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.3, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(t);
      osc2.start(t);
      osc.stop(t + 0.3);
      osc2.stop(t + 0.3);
    } catch (e) {}
  },

  playTabCloseSound: () => {
    try {
      initAudioContext();
      const t = audioCtx.currentTime;
      
      // Smooth downward sci-fi/spooky "whomp" (no harsh white noise)
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      osc.type = 'triangle';
      // Fast downward sweep
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.2);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, t);
      filter.frequency.linearRampToValueAtTime(200, t + 0.2);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.3, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(t);
      osc.stop(t + 0.25);
    } catch (e) {}
  },

  playTypingSound: () => {
    try {
      initAudioContext();
      const t = audioCtx.currentTime;
      
      // Subtly pitched, very dry "bone tap" or typewriter click
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      // Sharp, high pitch drop simulates a physical strike
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.02);

      filter.type = 'lowpass';
      filter.frequency.value = 2000;

      // Incredibly short envelope for a dry "tick"
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(t);
      osc.stop(t + 0.04);
    } catch (e) {}
  },

  playTrapdoorSlam() {
    try {
      const ctx = getAudioContext();
      if (!ctx || ctx.state === 'suspended') return;
      const t = ctx.currentTime;

      // 1) Massive low-end metallic thud (Square wave + lowpass)
      const thudOsc = ctx.createOscillator();
      thudOsc.type = 'square';
      thudOsc.frequency.setValueAtTime(100, t);
      thudOsc.frequency.exponentialRampToValueAtTime(20, t + 0.3);

      const thudFilter = ctx.createBiquadFilter();
      thudFilter.type = 'lowpass';
      thudFilter.frequency.setValueAtTime(800, t);
      thudFilter.frequency.exponentialRampToValueAtTime(100, t + 0.4);

      const thudGain = ctx.createGain();
      thudGain.gain.setValueAtTime(0.8, t);
      thudGain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);

      thudOsc.connect(thudFilter);
      thudFilter.connect(thudGain);
      thudGain.connect(ctx.destination);

      thudOsc.start(t);
      thudOsc.stop(t + 0.8);

      // 2) Harsh metallic scraping/crashing noise
      const bufferSize = ctx.sampleRate * 1.5; // 1.5 seconds of noise
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1200, t);
      noiseFilter.Q.setValueAtTime(1.5, t);
      
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(1.0, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

      noiseSrc.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noiseSrc.start(t);
      noiseSrc.stop(t + 0.5);

    } catch (e) {}
  }
};
