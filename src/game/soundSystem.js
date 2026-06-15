import { useCallback, useRef } from 'react';

// --- 8bit BGM音符序列 ---
const NOTE_FREQ = {
  'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61,
  'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
  'G4': 392.00, 'A4': 440.00, 'B4': 493.88, 'C5': 523.25,
  'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99,
  'A5': 880.00, 'B5': 987.77, 'C6': 1046.50, 'REST': 0
};

// Loading界面BGM - 可爱狗狗主题，轻快跳跃感
const loadingBGM = [
  ['G4', 0.15], ['E4', 0.15], ['G4', 0.15], ['A4', 0.3],
  ['G4', 0.15], ['E4', 0.15], ['D4', 0.15], ['E4', 0.3],
  ['C4', 0.15], ['E4', 0.15], ['G4', 0.15], ['E4', 0.3],
  ['D4', 0.15], ['C4', 0.15], ['D4', 0.15], ['E4', 0.3],
  ['G4', 0.15], ['A4', 0.15], ['B4', 0.15], ['C5', 0.3],
  ['B4', 0.15], ['A4', 0.15], ['G4', 0.15], ['E4', 0.3],
  ['A4', 0.15], ['G4', 0.15], ['E4', 0.15], ['D4', 0.3],
  ['C4', 0.2], ['D4', 0.2], ['E4', 0.4],
];

// 战斗界面BGM - 紧张刺激
const battleBGM = [
  ['C3', 0.1], ['C3', 0.1], ['REST', 0.05], ['C3', 0.1], ['E3', 0.15],
  ['G3', 0.1], ['G3', 0.1], ['REST', 0.05], ['G3', 0.1], ['B3', 0.15],
  ['A3', 0.1], ['A3', 0.1], ['REST', 0.05], ['A3', 0.1], ['C4', 0.15],
  ['F3', 0.1], ['F3', 0.1], ['REST', 0.05], ['F3', 0.1], ['A3', 0.15],
  ['C4', 0.08], ['D4', 0.08], ['E4', 0.08], ['F4', 0.15],
  ['E4', 0.08], ['D4', 0.08], ['C4', 0.08], ['G3', 0.15],
  ['A3', 0.08], ['B3', 0.08], ['C4', 0.08], ['D4', 0.15],
  ['C4', 0.1], ['G3', 0.1], ['E3', 0.1], ['C3', 0.2],
];

export function useSoundSystem() {
  const audioContextRef = useRef(null);
  const bgmOscRef = useRef(null);
  const bgmGainRef = useRef(null);
  const bgmIntervalRef = useRef(null);
  const isPlayingBGM = useRef(false);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback((type) => {
    try {
      const audioContext = getAudioContext();
      const now = audioContext.currentTime;

      // 狗叫声合成
      const playBark = (pitch = 1, delay = 0) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioContext.destination);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600 * pitch, now + delay);
        filter.Q.setValueAtTime(3, now + delay);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500 * pitch, now + delay);
        osc.frequency.exponentialRampToValueAtTime(180 * pitch, now + delay + 0.12);

        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(0.4, now + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.15);

        osc.start(now + delay);
        osc.stop(now + delay + 0.18);
      };

      // 呜咽声
      const playWhine = () => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioContext.destination);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.linearRampToValueAtTime(400, now + 0.5);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.linearRampToValueAtTime(450, now + 0.15);
        osc.frequency.linearRampToValueAtTime(380, now + 0.3);
        osc.frequency.linearRampToValueAtTime(320, now + 0.5);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.1);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.3);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.6);

        osc.start(now);
        osc.stop(now + 0.65);
      };

      // 吃东西声
      const playEat = () => {
        for (let i = 0; i < 4; i++) {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          const filter = audioContext.createBiquadFilter();

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(audioContext.destination);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(300, now + i * 0.12);

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(120 + Math.random() * 40, now + i * 0.12);
          osc.frequency.exponentialRampToValueAtTime(80, now + i * 0.12 + 0.08);

          gain.gain.setValueAtTime(0, now + i * 0.12);
          gain.gain.linearRampToValueAtTime(0.15, now + i * 0.12 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.1);

          osc.start(now + i * 0.12);
          osc.stop(now + i * 0.12 + 0.12);
        }
      };

      // 低吼声
      const playGrowl = () => {
        const osc1 = audioContext.createOscillator();
        const osc2 = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(audioContext.destination);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, now);
        filter.frequency.linearRampToValueAtTime(150, now + 0.4);

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(75, now);
        osc1.frequency.linearRampToValueAtTime(55, now + 0.4);

        osc2.type = 'square';
        osc2.frequency.setValueAtTime(78, now);
        osc2.frequency.linearRampToValueAtTime(58, now + 0.4);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.35, now + 0.05);
        gain.gain.setValueAtTime(0.35, now + 0.35);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.45);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.5);
        osc2.stop(now + 0.5);
      };

      // 8bit风格音效
      const play8BitNoise = (freq, duration, waveType = 'square') => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioContext.destination);

        osc.type = waveType;
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 2, now);
        filter.Q.setValueAtTime(1, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.start(now);
        osc.stop(now + duration);
      };

      // 8bit扫频音效
      const playSweep = (startFreq, endFreq, duration, waveType = 'square') => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.type = waveType;
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.start(now);
        osc.stop(now + duration);
      };

      switch (type) {
        // === 卡牌音效 ===
        case 'claw':
          play8BitNoise(800, 0.1, 'sawtooth');
          setTimeout(() => play8BitNoise(600, 0.08, 'square'), 50);
          break;
        case 'bite':
          play8BitNoise(400, 0.15, 'sawtooth');
          setTimeout(() => play8BitNoise(300, 0.1, 'square'), 80);
          setTimeout(() => play8BitNoise(200, 0.1, 'sawtooth'), 150);
          break;
        case 'roll':
          playSweep(600, 200, 0.3, 'sawtooth');
          break;
        case 'defend':
          play8BitNoise(150, 0.2, 'square');
          setTimeout(() => play8BitNoise(100, 0.15, 'sawtooth'), 100);
          break;
        case 'heal':
          play8BitNoise(600, 0.08, 'sine');
          setTimeout(() => play8BitNoise(700, 0.08, 'sine'), 100);
          setTimeout(() => play8BitNoise(800, 0.1, 'sine'), 200);
          break;
        case 'buff':
          playSweep(400, 800, 0.25, 'square');
          break;

        // === Boss技能音效 ===
        case 'catClaw':
          play8BitNoise(1200, 0.05, 'square');
          setTimeout(() => play8BitNoise(1200, 0.05, 'square'), 80);
          setTimeout(() => play8BitNoise(1200, 0.05, 'square'), 160);
          break;
        case 'bark':
          play8BitNoise(300, 0.2, 'sawtooth');
          setTimeout(() => play8BitNoise(280, 0.15, 'sawtooth'), 150);
          break;
        case 'heavy':
          playSweep(200, 100, 0.4, 'sawtooth');
          setTimeout(() => play8BitNoise(80, 0.3, 'square'), 200);
          break;
        case 'net':
          playSweep(800, 400, 0.3, 'sawtooth');
          setTimeout(() => play8BitNoise(200, 0.2, 'square'), 250);
          break;
        case 'biteBoss':
          play8BitNoise(350, 0.18, 'sawtooth');
          setTimeout(() => play8BitNoise(250, 0.12, 'square'), 100);
          break;
        case 'stone':
          play8BitNoise(200, 0.1, 'square');
          setTimeout(() => play8BitNoise(150, 0.15, 'sawtooth'), 80);
          break;
        case 'ultimate':
          playSweep(1000, 100, 0.5, 'sawtooth');
          setTimeout(() => play8BitNoise(80, 0.4, 'square'), 300);
          setTimeout(() => play8BitNoise(60, 0.3, 'sawtooth'), 500);
          break;

        // === 通用音效 ===
        case 'play':
          playBark(1.4);
          break;
        case 'attack':
          play8BitNoise(440, 0.1, 'square');
          setTimeout(() => play8BitNoise(220, 0.15, 'sawtooth'), 50);
          break;
        case 'infect':
          play8BitNoise(523, 0.1, 'square');
          setTimeout(() => play8BitNoise(659, 0.1, 'square'), 100);
          setTimeout(() => play8BitNoise(784, 0.15, 'square'), 200);
          break;
        case 'mutate':
          playSweep(400, 1000, 0.4, 'square');
          break;
        case 'enemyAttack':
          playGrowl();
          break;
        case 'hit':
          playWhine();
          break;
        default:
          break;
      }
    } catch (e) {
      console.log('Sound play error:', e);
    }
  }, [getAudioContext]);

  const stopBGM = useCallback(() => {
    if (bgmIntervalRef.current) {
      clearInterval(bgmIntervalRef.current);
      bgmIntervalRef.current = null;
    }
    if (bgmOscRef.current) {
      try {
        bgmOscRef.current.stop();
      } catch (e) {}
      bgmOscRef.current = null;
    }
    isPlayingBGM.current = false;
  }, []);

  const playBGM = useCallback((type) => {
    if (isPlayingBGM.current) stopBGM();
    
    const audioContext = getAudioContext();
    const notes = type === 'loading' ? loadingBGM : battleBGM;
    let noteIndex = 0;
    
    isPlayingBGM.current = true;

    const playNextNote = () => {
      if (!isPlayingBGM.current) return;
      
      const [note, duration] = notes[noteIndex];
      
      if (note !== 'REST' && NOTE_FREQ[note]) {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.type = 'square';
        osc.frequency.value = NOTE_FREQ[note];
        
        const now = audioContext.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration * 0.9);
        
        osc.start(now);
        osc.stop(now + duration);
      }
      
      noteIndex = (noteIndex + 1) % notes.length;
      
      bgmIntervalRef.current = setTimeout(playNextNote, duration * 1000);
    };

    playNextNote();
  }, [getAudioContext, stopBGM]);

  return { playSound, playBGM, stopBGM };
}
