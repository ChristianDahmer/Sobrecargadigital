// Web Audio API Synthesizer & SpeechSynthesis TTS Voice Reader
import { AppLanguage } from '../types';

let audioCtx: AudioContext | null = null;
let globalSFXVolumeMultiplier = 1.0;

export function setGlobalSFXVolume(volumePercent: number) {
  globalSFXVolumeMultiplier = Math.max(0, Math.min(1, (volumePercent ?? 100) / 100));
}

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Ensure AudioContext is unlocked on user interaction
export function initAudio() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  } catch {
    // Ignore audio initialization errors on restricted browsers
  }
}

let globalAudioSettingsProvider: (() => { soundEnabled: boolean; settings: any }) | null = null;

export function setGlobalAudioSettingsProvider(provider: () => { soundEnabled: boolean; settings: any }) {
  globalAudioSettingsProvider = provider;
}

function checkAudioAllowed(sfxKey?: string): boolean {
  if (!globalAudioSettingsProvider) return true;
  try {
    const { soundEnabled, settings } = globalAudioSettingsProvider();
    if (!soundEnabled || settings.enableSound === false) return false;
    if (sfxKey && settings[sfxKey] === false) return false;
    return true;
  } catch {
    return true;
  }
}

// --- SYNTHESIZED SOUND EFFECTS (SFX) ---

/**
 * Obstacle hit / crash sound effect (soft gentle subtle notification)
 */
export function playObstacleHitSFX(soundEnabled: boolean) {
  if (!checkAudioAllowed('sfxObstacleHit') || globalSFXVolumeMultiplier <= 0) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.15);

    const targetGain = 0.08 * globalSFXVolumeMultiplier;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(targetGain, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  } catch {
    // Ignore sound errors
  }
}

/**
 * Bright metallic coin pickup SFX for gold coin collection
 */
export function playCoinCollectSFX(soundEnabled: boolean) {
  if (!checkAudioAllowed('sfxCoinCollect') || globalSFXVolumeMultiplier <= 0) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const freqs = [987.77, 1318.51]; // B5 -> E6 classic coin arpeggio
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      const targetGain = 0.22 * globalSFXVolumeMultiplier;
      gain.gain.setValueAtTime(targetGain, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.38);
    });
  } catch {
    // Ignore sound errors
  }
}

/**
 * Cheerful major chime when collecting beneficial wellness items
 */
export function playCollectWellnessSFX(soundEnabled: boolean) {
  if (!checkAudioAllowed('sfxWellnessCollect') || globalSFXVolumeMultiplier <= 0) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      const targetGain = 0.15 * globalSFXVolumeMultiplier;
      gain.gain.setValueAtTime(targetGain, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.35);
    });
  } catch {
    // Ignore sound errors
  }
}

/**
 * Gentle soft notification tone when hit by harmful items (no harsh thud or hammering noise)
 */
export function playHarmfulHitSFX(soundEnabled: boolean) {
  if (!checkAudioAllowed('sfxHarmfulHit') || globalSFXVolumeMultiplier <= 0) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.12);

    const targetGain = 0.08 * globalSFXVolumeMultiplier;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(targetGain, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  } catch {
    // Ignore sound errors
  }
}

/**
 * Strummed guitar triad chord when collecting Coffee/Guitar
 */
export function playGuitarChordSFX(soundEnabled: boolean) {
  if (!checkAudioAllowed('sfxWellnessCollect') || globalSFXVolumeMultiplier <= 0) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const freqs = [164.81, 246.94, 329.63, 415.30, 493.88]; // E3, B3, E4, G#4, B4
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.03);

      gain.gain.setValueAtTime(0.2, now + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.03);
      osc.stop(now + idx * 0.03 + 0.85);
    });
  } catch {
    // Ignore sound errors
  }
}

/**
 * Attention chime when SAS Evaluation Question appears
 */
export function playSASQuestionChime(soundEnabled: boolean) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const notes = [587.33, 880.00]; // D5 -> A5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.2, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.45);
    });
  } catch {
    // Ignore sound errors
  }
}

/**
 * Calming harmonic swell when entering MODO ZEN
 */
export function playZenEnterSFX(soundEnabled: boolean) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const freqs = [220, 330, 440, 660];
    freqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.25);
    });
  } catch {
    // Ignore sound errors
  }
}

/**
 * Fanfare arpeggio on game victory
 */
export function playVictorySFX(soundEnabled: boolean) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.2, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.65);
    });
  } catch {
    // Ignore sound errors
  }
}

/**
 * Descending minor tone on digital collapse / defeat
 */
export function playDefeatSFX(soundEnabled: boolean) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const notes = [440, 415.30, 392, 349.23];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.15);

      gain.gain.setValueAtTime(0.0001, now + idx * 0.15);
      gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.15 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.15);
      osc.stop(now + idx * 0.15 + 0.4);
    });
  } catch {
    // Ignore sound errors
  }
}

/**
 * Distinct phone notification chime when popups appear/disappear
 */
export function playNotificationPopSFX(soundEnabled: boolean) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const notes = [880, 1320]; // A5 -> E6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.12, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.3);
    });
  } catch {
    // Ignore sound errors
  }
}


// --- WEATHER & ATMOSPHERE AMBIENT SYNTHESIZER ---

let activeAmbientType: string | null = null;
let ambientGainNode: GainNode | null = null;
let ambientSourceNodes: (AudioNode | { stop?: () => void; disconnect?: () => void })[] = [];
let ambientTimerId: number | null = null;
let ambientStartTimeoutId: number | null = null;
let lastSetAmbientGain: number = -1;

export function stopWeatherAmbient() {
  if (ambientTimerId !== null) {
    window.clearInterval(ambientTimerId);
    ambientTimerId = null;
  }
  if (ambientStartTimeoutId !== null) {
    window.clearTimeout(ambientStartTimeoutId);
    ambientStartTimeoutId = null;
  }
  if (ambientGainNode) {
    try {
      const ctx = getAudioContext();
      ambientGainNode.gain.cancelScheduledValues(ctx.currentTime);
      ambientGainNode.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
    } catch {
      // Ignore
    }
  }

  const nodesToClean = [...ambientSourceNodes];
  ambientSourceNodes = [];
  ambientGainNode = null;
  activeAmbientType = null;
  lastSetAmbientGain = -1;

  setTimeout(() => {
    nodesToClean.forEach((node) => {
      try {
        if ('stop' in node && typeof node.stop === 'function') node.stop();
        if ('disconnect' in node && typeof node.disconnect === 'function') node.disconnect();
      } catch {
        // Ignore
      }
    });
  }, 350);
}

export function updateWeatherAmbient(
  weatherPreset: string = 'auto',
  enabled: boolean = true,
  anxietyLevel: number = 0
) {
  if (!enabled || globalSFXVolumeMultiplier <= 0) {
    stopWeatherAmbient();
    return;
  }

  // Resolve effective preset
  let effectivePreset = weatherPreset;
  if (effectivePreset === 'auto') {
    if (anxietyLevel > 70) effectivePreset = 'rain';
    else if (anxietyLevel > 40) effectivePreset = 'sunset';
    else effectivePreset = 'clear';
  }

  const targetGain = 0.05 * globalSFXVolumeMultiplier; // Soft pleasant ambient volume

  if (activeAmbientType === effectivePreset && ambientGainNode) {
    // Already playing correct preset, only update volume if changed
    if (Math.abs(lastSetAmbientGain - targetGain) > 0.005) {
      try {
        const ctx = getAudioContext();
        ambientGainNode.gain.cancelScheduledValues(ctx.currentTime);
        ambientGainNode.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 0.3);
        lastSetAmbientGain = targetGain;
      } catch {
        // Ignore
      }
    }
    return;
  }

  // Stop current preset safely before starting new one
  stopWeatherAmbient();

  activeAmbientType = effectivePreset;

  ambientStartTimeoutId = window.setTimeout(() => {
    ambientStartTimeoutId = null;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      ambientGainNode = ctx.createGain();
      ambientGainNode.gain.setValueAtTime(0.0001, now);
      ambientGainNode.gain.linearRampToValueAtTime(targetGain, now + 0.6);
      ambientGainNode.connect(ctx.destination);
      lastSetAmbientGain = targetGain;

      if (effectivePreset === 'rain') {
        // Soft natural rain noise (pink noise + heavy 650Hz lowpass filter - no high pitch whistling)
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          data[i] *= 0.045;
          b6 = white * 0.115926;
        }

        const rainSource = ctx.createBufferSource();
        rainSource.buffer = buffer;
        rainSource.loop = true;

        const rainFilter = ctx.createBiquadFilter();
        rainFilter.type = 'lowpass';
        rainFilter.frequency.setValueAtTime(650, now);

        rainSource.connect(rainFilter);
        rainFilter.connect(ambientGainNode);
        rainSource.start(now);
        ambientSourceNodes.push(rainSource, rainFilter);

      } else {
        // Clear / Sunset / Night / Fog: Organic warm breeze noise (NO pure sine waves or high frequency whistles)
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = data[i];
          data[i] *= 0.08;
        }

        const breezeSource = ctx.createBufferSource();
        breezeSource.buffer = buffer;
        breezeSource.loop = true;

        const breezeFilter = ctx.createBiquadFilter();
        breezeFilter.type = 'lowpass';
        // Gentle low cutoff freq (180Hz) creates smooth wind movement with zero high pitched whistles
        const cutoff = effectivePreset === 'sunset' ? 220 : effectivePreset === 'night' ? 140 : 180;
        breezeFilter.frequency.setValueAtTime(cutoff, now);

        breezeSource.connect(breezeFilter);
        breezeFilter.connect(ambientGainNode);
        breezeSource.start(now);
        ambientSourceNodes.push(breezeSource, breezeFilter);
      }
    } catch {
      // Ignore audio ambient errors
    }
  }, 100);
}


/**
 * Gentle friendly pet sound effect (soft double chime, no low hammering thud)
 */
export function playDogBarkSFX(soundEnabled: boolean) {
  if (!checkAudioAllowed('sfxDog') || globalSFXVolumeMultiplier <= 0) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const notes = [523.25, 659.25]; // Soft gentle C5 -> E5 chime
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);

      const targetGain = 0.04 * globalSFXVolumeMultiplier;
      gain.gain.setValueAtTime(0.0001, now + idx * 0.1);
      gain.gain.linearRampToValueAtTime(targetGain, now + idx * 0.1 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.28);
    });
  } catch {
    // Ignore sound errors
  }
}

/**
 * Reads aloud the SAS evaluation question in the selected language (pt, es, en, de)
 */
export function speakQuestion(
  text: string,
  soundEnabled: boolean,
  ttsSettings?: { voiceURI?: string; pitch?: number; rate?: number },
  language: AppLanguage = 'pt'
) {
  if (!soundEnabled || !('speechSynthesis' in window)) return;

  try {
    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    const localeMap: Record<AppLanguage, string> = {
      pt: 'pt-BR',
      es: 'es-ES',
      en: 'en-US',
      de: 'de-DE',
    };

    const targetLocale = localeMap[language] || 'pt-BR';
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetLocale;
    
    utterance.rate = ttsSettings?.rate ?? 1.0; 
    utterance.pitch = ttsSettings?.pitch ?? 1.0; 
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();

    if (ttsSettings?.voiceURI) {
      const selected = voices.find((v) => v.voiceURI === ttsSettings.voiceURI || v.name === ttsSettings.voiceURI);
      if (selected) {
        utterance.voice = selected;
      }
    }

    if (!utterance.voice) {
      const langPrefix = language === 'pt' ? 'pt' : language === 'es' ? 'es' : language === 'de' ? 'de' : 'en';
      const langKeywords =
        language === 'pt'
          ? ['portuguese', 'brasil', 'brazil']
          : language === 'es'
          ? ['spanish', 'español', 'espanol']
          : language === 'de'
          ? ['german', 'deutsch']
          : ['english', 'inglês', 'ingles'];

      const matchedVoices = voices.filter(
        (v) =>
          v.lang.toLowerCase().includes(langPrefix) ||
          langKeywords.some((k) => v.name.toLowerCase().includes(k))
      );

      if (matchedVoices.length > 0) {
        const premiumKeywords = ['google', 'microsoft', 'neural', 'natural', 'apple'];
        
        const bestVoice = matchedVoices.sort((a, b) => {
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();
          
          const aScore = premiumKeywords.some(k => aName.includes(k)) ? 10 : 0;
          const bScore = premiumKeywords.some(k => bName.includes(k)) ? 10 : 0;
          
          return bScore - aScore;
        })[0];

        utterance.voice = bestVoice;
      }
    }

    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore speech synthesis errors
  }
}

/**
 * Stops ongoing speech synthesis
 */
export function stopSpeech() {
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  }
}

/**
 * Crisp tactile mechanical click SFX on button press
 */
export function playButtonClickSFX(soundEnabled: boolean = true) {
  if (!soundEnabled || globalSFXVolumeMultiplier <= 0) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);

    const targetGain = 0.03 * globalSFXVolumeMultiplier;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(targetGain, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  } catch {
    // Ignore audio errors
  }
}

/**
 * Relaxing water splash SFX when casting line or fish strikes
 */
export function playFishingSplashSFX(soundEnabled: boolean = true) {
  if (!checkAudioAllowed('sfxFishing') || globalSFXVolumeMultiplier <= 0) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // White noise / filtered water splash
    const bufferSize = ctx.sampleRate * 0.25;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(350, now + 0.22);
    filter.Q.setValueAtTime(2.5, now);

    const gain = ctx.createGain();
    const targetGain = 0.28 * globalSFXVolumeMultiplier;
    gain.gain.setValueAtTime(targetGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.26);
  } catch {
    // Ignore audio errors
  }
}

/**
 * Uplifting harmonic melody SFX when reeling in and catching a fish (-30% anxiety)
 */
export function playFishingCatchSFX(soundEnabled: boolean = true) {
  if (!checkAudioAllowed('sfxFishing') || globalSFXVolumeMultiplier <= 0) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Serene water drop + Pentatonic arpeggio (C5 -> E5 -> G5 -> B5 -> C6)
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.02, now + idx * 0.07 + 0.25);

      const targetGain = 0.20 * globalSFXVolumeMultiplier;
      gain.gain.setValueAtTime(targetGain, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.42);
    });
  } catch {
    // Ignore audio errors
  }
}

/**
 * Soft soothing pigeon coo and gentle rustle sound effect for feeding pigeons in park (-20% anxiety)
 */
export function playPigeonFeedingSFX(soundEnabled: boolean = true) {
  if (!checkAudioAllowed('sfxPigeon') || globalSFXVolumeMultiplier <= 0) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Pigeon coo pattern: two gentle frequency slides (e.g. 340Hz -> 310Hz)
    [0, 0.22].forEach((startTime, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(350 - idx * 30, now + startTime);
      osc.frequency.exponentialRampToValueAtTime(280 - idx * 20, now + startTime + 0.18);

      const targetGain = 0.176 * globalSFXVolumeMultiplier;
      gain.gain.setValueAtTime(targetGain, now + startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, now + startTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + startTime);
      osc.stop(now + startTime + 0.22);
    });

    // Gentle high chime of breadcrumb contentment
    const chimeOsc = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    chimeOsc.type = 'sine';
    chimeOsc.frequency.setValueAtTime(783.99, now + 0.1); // G5
    chimeOsc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.35); // C6
    chimeGain.gain.setValueAtTime(0.144 * globalSFXVolumeMultiplier, now + 0.1);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    chimeOsc.connect(chimeGain);
    chimeGain.connect(ctx.destination);
    chimeOsc.start(now + 0.1);
    chimeOsc.stop(now + 0.5);
  } catch {
    // Ignore audio errors
  }
}

/**
 * Warm gentle horse neigh & trot chime sound effect for horse petting (-30% anxiety)
 */
export function playHorsePettingSFX(soundEnabled: boolean = true) {
  if (!checkAudioAllowed('sfxHorse') || globalSFXVolumeMultiplier <= 0) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      const targetGain = 0.25 * globalSFXVolumeMultiplier;
      gain.gain.setValueAtTime(targetGain, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.5);
    });
  } catch {
    // Ignore audio errors
  }
}

/**
 * Sound effect for soccer ball kick with spatial attenuation & smooth attack
 */
export function playSoccerKickSFX(soundEnabled: boolean = true, volumeScale: number = 1.0) {
  if (!checkAudioAllowed('sfxSoccer') || globalSFXVolumeMultiplier <= 0 || volumeScale <= 0.01) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.06);

    const clampedVol = Math.max(0, Math.min(1, volumeScale));
    const targetGain = 0.02 * globalSFXVolumeMultiplier * clampedVol;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(targetGain, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  } catch {
    // Ignore audio errors
  }
}

/**
 * Triumphant crowd celebration sound effect for scoring a goal in soccer
 */
export function playSoccerGoalSFX(soundEnabled: boolean = true, volumeScale: number = 1.0) {
  if (!checkAudioAllowed('sfxSoccer') || globalSFXVolumeMultiplier <= 0 || volumeScale <= 0.01) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const clampedVol = Math.max(0, Math.min(1, volumeScale));
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      const targetGain = 0.25 * globalSFXVolumeMultiplier * clampedVol;
      gain.gain.setValueAtTime(0.0001, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(targetGain, now + idx * 0.08 + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.65);
    });
  } catch {
    // Ignore audio errors
  }
}

/**
 * Soothing gentle lullaby / harp bedtime chime when avatar rests or sleeps in the cozy house
 */
export function playRestingSleepSFX(soundEnabled: boolean = true) {
  if (!checkAudioAllowed('sfxWellnessCollect') || globalSFXVolumeMultiplier <= 0) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Peaceful pentatonic lullaby sequence (E4, G4, A4, B4, D5, E5)
    const lullabyNotes = [329.63, 392.00, 440.00, 493.88, 587.33, 659.25];
    lullabyNotes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);

      const targetGain = 0.18 * globalSFXVolumeMultiplier;
      gain.gain.setValueAtTime(0.0001, now + idx * 0.14);
      gain.gain.linearRampToValueAtTime(targetGain, now + idx * 0.14 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.14 + 0.85);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.9);
    });
  } catch {
    // Ignore audio errors
  }
}

/**
 * Gentle wooden door / welcome chime when entering the house
 */
export function playHouseDoorSFX(soundEnabled: boolean = true) {
  if (!checkAudioAllowed('sfxWellnessCollect') || globalSFXVolumeMultiplier <= 0) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const notes = [440.0, 554.37, 659.25]; // A4, C#5, E5 cozy chord
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      const targetGain = 0.14 * globalSFXVolumeMultiplier;
      gain.gain.setValueAtTime(0.0001, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(targetGain, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.55);
    });
  } catch {
    // Ignore audio errors
  }
}

/**
 * Soothing herbal tea chime & serene infusion sound (warm harmonic tones with 528Hz Solfeggio resonance)
 */
export function playCalmingTeaSFX(soundEnabled: boolean = true) {
  if (!checkAudioAllowed('sfxWellnessCollect') || globalSFXVolumeMultiplier <= 0) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Peaceful Solfeggio & golden herbal harmonic frequencies (528Hz, 660Hz, 792Hz, 1056Hz)
    const teaHarmonics = [528.0, 660.0, 792.0, 1056.0];
    teaHarmonics.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      const targetGain = 0.18 * globalSFXVolumeMultiplier;
      gain.gain.setValueAtTime(0.0001, now + idx * 0.12);
      gain.gain.linearRampToValueAtTime(targetGain, now + idx * 0.12 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 1.25);
    });
  } catch {
    // Ignore audio errors
  }
}

/**
 * Deep 4-7-8 diaphragmatic breathing swell & parasympathetic vagal wave
 */
export function playBreathingCycleSFX(soundEnabled: boolean = true) {
  if (!checkAudioAllowed('sfxWellnessCollect') || globalSFXVolumeMultiplier <= 0) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Low gentle sine sweep representing deep diaphragmatic inhalation and relaxation wave (432Hz calming bell + low swell)
    const breathOsc = ctx.createOscillator();
    const breathGain = ctx.createGain();

    breathOsc.type = 'sine';
    breathOsc.frequency.setValueAtTime(140, now);
    breathOsc.frequency.exponentialRampToValueAtTime(260, now + 0.9);
    breathOsc.frequency.exponentialRampToValueAtTime(120, now + 2.0);

    const targetGain = 0.22 * globalSFXVolumeMultiplier;
    breathGain.gain.setValueAtTime(0.0001, now);
    breathGain.gain.linearRampToValueAtTime(targetGain, now + 0.5);
    breathGain.gain.linearRampToValueAtTime(targetGain * 0.6, now + 1.2);
    breathGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

    breathOsc.connect(breathGain);
    breathGain.connect(ctx.destination);

    breathOsc.start(now);
    breathOsc.stop(now + 2.05);

    // Complementary Tibetan bowl chime at 432 Hz
    const bowlOsc = ctx.createOscillator();
    const bowlGain = ctx.createGain();

    bowlOsc.type = 'triangle';
    bowlOsc.frequency.setValueAtTime(432, now);

    bowlGain.gain.setValueAtTime(0.0001, now);
    bowlGain.gain.linearRampToValueAtTime(0.2 * globalSFXVolumeMultiplier, now + 0.08);
    bowlGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

    bowlOsc.connect(bowlGain);
    bowlGain.connect(ctx.destination);

    bowlOsc.start(now);
    bowlOsc.stop(now + 2.25);
  } catch {
    // Ignore audio errors
  }
}

/**
 * Pure Solfeggio bio-resonance harmonic frequency generator (e.g. 528Hz, 432Hz, 639Hz)
 * Used in the Interactive Tech Lab to demonstrate real-time procedural Web Audio synthesis
 */
export function playSolfeggioTone(freq: number = 528, duration: number = 2.0) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const overtone = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    // Subtle 2nd harmonic for rich bell timbre
    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(freq * 2, now);

    const targetGain = 0.22 * globalSFXVolumeMultiplier;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(targetGain, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    overtone.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    overtone.start(now);
    osc.stop(now + duration + 0.05);
    overtone.stop(now + duration + 0.05);
  } catch {
    // Ignore audio errors
  }
}
