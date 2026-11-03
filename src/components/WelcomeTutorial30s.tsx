import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  X,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Coffee,
  BookOpen,
  TreePine,
  Dog,
  Smartphone,
  MessageCircle,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Layers,
  ChevronDown,
  ChevronUp,
  Award,
  ChevronRight,
  ChevronLeft,
  Clock,
  Check
} from 'lucide-react';
import { GameSettings, GameState } from '../types';
import { stopSpeech, playCoinCollectSFX, playHarmfulHitSFX } from '../utils/audio';

interface WelcomeTutorial30sProps {
  gameTimer: number;
  gameState: GameState;
  soundEnabled?: boolean;
  gameSettings?: GameSettings;
  isOpen: boolean;
  onClose: () => void;
  onToggleSound?: () => void;
}

interface TutorialPhase {
  phaseId: number;
  tag: string;
  badgeBg: string;
  badgeTextColor: string;
  borderColor: string;
  glowColor: string;
  title: string;
  narration: string;
  shortSummary: string;
  highlightType: 'controls' | 'invasive' | 'wellness' | 'ready';
}

const PAUSE_BETWEEN_PHASES_SEC = 3; // Tempo de respiro/assimilação pós-narração antes da próxima fase
const SILENT_READING_TIME_SEC = 8; // Tempo de leitura caso a voz esteja silenciada

const TUTORIAL_PHASES: TutorialPhase[] = [
  {
    phaseId: 1,
    tag: 'FASE 1 DE 4 • INTRODUÇÃO & COMANDOS',
    badgeBg: 'bg-indigo-500/20',
    badgeTextColor: 'text-indigo-300',
    borderColor: 'border-indigo-500/40',
    glowColor: 'shadow-[0_0_25px_rgba(99,102,241,0.35)]',
    title: 'Bem-vindo ao Sobrecarga Digital!',
    narration:
      'Olá! Bem-vindo ao simulador Entre Redes Há Ansiedade. Pelos próximos momentos serei seu guia! Use as teclas A e D ou deslize o joystick para desviar e mudar de pista. Pressione W ou a barra de espaço para pular. Seu objetivo é controlar o estresse e manter a mente sã!',
    shortSummary:
      'Aprenda a mover seu avatar na pista e manter a calma antes que a sobrecarga se instale.',
    highlightType: 'controls',
  },
  {
    phaseId: 2,
    tag: 'FASE 2 DE 4 • NOTIFICAÇÕES INVASIVAS (EVITE!)',
    badgeBg: 'bg-rose-500/25',
    badgeTextColor: 'text-rose-300',
    borderColor: 'border-rose-500/50',
    glowColor: 'shadow-[0_0_30px_rgba(244,63,94,0.4)]',
    title: 'Perigo: Notificações Invasivas na Pista!',
    narration:
      'Atenção! Veja as notificações vermelhas e roxas que caem do céu: alertas do WhatsApp, feeds infinitos, likes e cobranças urgentes. Evite colidir com elas! Cada notificação invasiva eleva sua ansiedade, polui sua mente e ativa a sobrecarga por FOMO!',
    shortSummary:
      'Ícones vermelhos e roxos aumentam a barra de ansiedade em cascata. Desvie de todas!',
    highlightType: 'invasive',
  },
  {
    phaseId: 3,
    tag: 'FASE 3 DE 4 • ITENS DE BEM-ESTAR (COLETE!)',
    badgeBg: 'bg-emerald-500/25',
    badgeTextColor: 'text-emerald-300',
    borderColor: 'border-emerald-500/50',
    glowColor: 'shadow-[0_0_30px_rgba(16,185,129,0.4)]',
    title: 'Sua Proteção: Itens de Bem-Estar!',
    narration:
      'Agora observe os itens com auras verdes, douradas e azuis: moedas de ouro, xícaras de chá, livros, caminhadas ao ar livre e a companhia do cãozinho Luke. Colete todos que puder! Eles diminuem sua ansiedade, acionam escudos protetores e devolvem seu foco!',
    shortSummary:
      'Itens esmeralda e dourados curam sua ansiedade e ativam barreiras contra alertas invasivos!',
    highlightType: 'wellness',
  },
  {
    phaseId: 4,
    tag: 'FASE 4 DE 4 • TREINAMENTO CONCLUÍDO',
    badgeBg: 'bg-amber-500/25',
    badgeTextColor: 'text-amber-300',
    borderColor: 'border-amber-500/50',
    glowColor: 'shadow-[0_0_30px_rgba(245,158,11,0.4)]',
    title: 'Parabéns! Você Conquistou o Equilíbrio!',
    narration:
      'Excelente! Você agora domina a diferença essencial entre a sobrecarga invasiva das redes e a paz dos hábitos saudáveis. Mantenha os olhos na pista e tenha uma ótima corrida!',
    shortSummary:
      'Treinamento finalizado! Continue coletando bem-estar e desviando de notificações para vencer.',
    highlightType: 'ready',
  },
];

export const WelcomeTutorial30s: React.FC<WelcomeTutorial30sProps> = ({
  gameTimer,
  gameState,
  soundEnabled = true,
  gameSettings,
  isOpen,
  onClose,
  onToggleSound,
}) => {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(0);
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('entre_redes_tutorial_voice_muted') === 'true';
    } catch {
      return false;
    }
  });

  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isInPause, setIsInPause] = useState<boolean>(false);
  const [pauseCountdown, setPauseCountdown] = useState<number>(PAUSE_BETWEEN_PHASES_SEC);
  const [readingCountdown, setReadingCountdown] = useState<number>(SILENT_READING_TIME_SEC);
  const [showComparisonModal, setShowComparisonModal] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // Timer references for robust cleanup
  const pauseIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const silentReadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const currentPhase = TUTORIAL_PHASES[currentPhaseIndex] || TUTORIAL_PHASES[0];

  // Clear all pending transition and pause intervals
  const clearTimers = () => {
    if (pauseIntervalRef.current) {
      clearInterval(pauseIntervalRef.current);
      pauseIntervalRef.current = null;
    }
    if (silentReadingTimerRef.current) {
      clearInterval(silentReadingTimerRef.current);
      silentReadingTimerRef.current = null;
    }
  };

  // Start the requested post-narration pause before progressing
  const startInterPhasePause = () => {
    clearTimers();
    setIsSpeaking(false);
    setIsInPause(true);
    setPauseCountdown(PAUSE_BETWEEN_PHASES_SEC);

    pauseIntervalRef.current = setInterval(() => {
      setPauseCountdown((prev) => {
        if (prev <= 1) {
          clearTimers();
          setIsInPause(false);

          // If there is another phase, advance to next phase; otherwise finish tutorial
          if (currentPhaseIndex < TUTORIAL_PHASES.length - 1) {
            setCurrentPhaseIndex((curr) => curr + 1);
          } else {
            // Final phase concluded after its pause!
            stopSpeech();
            onClose();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Helper to narrate text with Web Speech Synthesis
  const speakPhaseText = (text: string) => {
    clearTimers();
    setIsInPause(false);

    // If voice is muted or sound disabled or no browser support, run silent reading timer
    if (isVoiceMuted || !soundEnabled || !('speechSynthesis' in window)) {
      setIsSpeaking(false);
      setReadingCountdown(SILENT_READING_TIME_SEC);

      silentReadingTimerRef.current = setInterval(() => {
        setReadingCountdown((prev) => {
          if (prev <= 1) {
            clearTimers();
            startInterPhasePause();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return;
    }

    try {
      stopSpeech();
      setIsSpeaking(true);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.pitch = gameSettings?.ttsPitch ?? 1.0;
      utterance.rate = gameSettings?.ttsRate ?? 1.0;
      utterance.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      if (gameSettings?.ttsVoiceURI) {
        const found = voices.find(
          (v) => v.voiceURI === gameSettings.ttsVoiceURI || v.name === gameSettings.ttsVoiceURI
        );
        if (found) utterance.voice = found;
      }

      if (!utterance.voice) {
        const ptVoices = voices.filter(
          (v) => v.lang.includes('pt') || v.lang.includes('PT') || v.name.toLowerCase().includes('portuguese')
        );
        if (ptVoices.length > 0) {
          const premium = ['google', 'microsoft', 'neural', 'natural', 'apple'];
          const best = ptVoices.sort((a, b) => {
            const aScore = premium.some((k) => a.name.toLowerCase().includes(k)) ? 10 : 0;
            const bScore = premium.some((k) => b.name.toLowerCase().includes(k)) ? 10 : 0;
            return bScore - aScore;
          })[0];
          utterance.voice = best;
        }
      }

      utterance.onend = () => {
        if (!isMountedRef.current) return;
        // Narration finished! Enter pause/breathing room before the next phase
        startInterPhasePause();
      };

      utterance.onerror = (e) => {
        if (!isMountedRef.current) return;
        // If canceled or error, enter inter-phase pause safely
        startInterPhasePause();
      };

      currentUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
      startInterPhasePause();
    }
  };

  // Trigger phase narration whenever currentPhaseIndex changes or when tutorial opens
  useEffect(() => {
    isMountedRef.current = true;

    if (!isOpen || (gameState !== 'PLAYING' && gameState !== 'PAUSED_SAS' && gameState !== 'MODO_ZEN')) {
      clearTimers();
      stopSpeech();
      setIsSpeaking(false);
      return;
    }

    // Play subtle SFX for phase transitions
    if (currentPhase.phaseId === 2) {
      playHarmfulHitSFX(soundEnabled);
    } else if (currentPhase.phaseId === 3) {
      playCoinCollectSFX(soundEnabled);
    }

    speakPhaseText(currentPhase.narration);

    return () => {
      clearTimers();
    };
  }, [currentPhaseIndex, isOpen, gameState]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      clearTimers();
      stopSpeech();
    };
  }, []);

  // Stop speech if voice is muted or closed
  useEffect(() => {
    if (isVoiceMuted || !isOpen || (gameState !== 'PLAYING' && gameState !== 'PAUSED_SAS' && gameState !== 'MODO_ZEN')) {
      stopSpeech();
      setIsSpeaking(false);
    }
  }, [isVoiceMuted, isOpen, gameState]);

  const handleToggleVoiceMute = () => {
    setIsVoiceMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('entre_redes_tutorial_voice_muted', String(next));
      } catch {}
      if (next) {
        stopSpeech();
        setIsSpeaking(false);
      } else {
        speakPhaseText(currentPhase.narration);
      }
      return next;
    });
  };

  const handleReplayCurrentPhase = () => {
    speakPhaseText(currentPhase.narration);
  };

  const handleAdvanceImmediately = () => {
    clearTimers();
    stopSpeech();
    setIsInPause(false);

    if (currentPhaseIndex < TUTORIAL_PHASES.length - 1) {
      setCurrentPhaseIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePreviousPhase = () => {
    if (currentPhaseIndex > 0) {
      clearTimers();
      stopSpeech();
      setIsInPause(false);
      setCurrentPhaseIndex((prev) => prev - 1);
    }
  };

  if (!isOpen || (gameState !== 'PLAYING' && gameState !== 'PAUSED_SAS' && gameState !== 'MODO_ZEN')) {
    return null;
  }

  // Progress percentage across the 4 phases
  const stepPercent = Math.round(((currentPhaseIndex + 1) / TUTORIAL_PHASES.length) * 100);

  return (
    <>
      {/* --- FLOATING TUTORIAL BANNER --- */}
      <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-[45] w-[95%] max-w-2xl pointer-events-auto transition-all duration-300">
        <div
          className={`backdrop-blur-xl bg-slate-950/92 rounded-2xl border ${currentPhase.borderColor} ${currentPhase.glowColor} overflow-hidden shadow-2xl transition-all duration-500`}
        >
          {/* Top Multi-Phase Progress Bar */}
          <div className="w-full h-2 bg-slate-900/90 relative overflow-hidden flex">
            {TUTORIAL_PHASES.map((p, idx) => {
              const isPast = idx < currentPhaseIndex;
              const isCurrent = idx === currentPhaseIndex;
              return (
                <div key={p.phaseId} className="flex-1 h-full relative border-r border-slate-800/80 last:border-none bg-slate-900/90">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isPast
                        ? 'bg-emerald-500 w-full'
                        : isCurrent
                        ? isInPause
                          ? 'bg-cyan-400 animate-pulse w-full'
                          : 'bg-indigo-500 w-full'
                        : 'w-0'
                    }`}
                  />
                  {isCurrent && (
                    <div
                      className="absolute inset-y-0 right-0 w-2 bg-white/90 shadow-[0_0_8px_#ffffff] blur-[0.5px]"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Banner Header Info */}
          <div className="px-3.5 sm:px-5 py-2.5 flex items-center justify-between border-b border-white/10 bg-slate-900/60 gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <span
                className={`text-[9px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${currentPhase.borderColor} ${currentPhase.badgeBg} ${currentPhase.badgeTextColor} shrink-0 flex items-center gap-1.5`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                {currentPhase.tag}
              </span>

              {/* Phase Step Dots */}
              <div className="hidden sm:flex items-center gap-1.5">
                {TUTORIAL_PHASES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      clearTimers();
                      stopSpeech();
                      setCurrentPhaseIndex(idx);
                    }}
                    title={`Ir para Fase ${idx + 1}`}
                    className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                      idx === currentPhaseIndex
                        ? 'bg-cyan-400 ring-2 ring-cyan-400/50 scale-110'
                        : idx < currentPhaseIndex
                        ? 'bg-emerald-400'
                        : 'bg-slate-700 hover:bg-slate-500'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Quick Action Controls */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Previous Phase */}
              {currentPhaseIndex > 0 && (
                <button
                  onClick={handlePreviousPhase}
                  title="Fase anterior"
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Replay Narration Audio */}
              <button
                onClick={handleReplayCurrentPhase}
                title="Ouvir novamente esta explicação narrada"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Mute/Unmute Narration */}
              <button
                onClick={handleToggleVoiceMute}
                title={isVoiceMuted ? 'Ativar narração por voz' : 'Silenciar narração por voz'}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold ${
                  isVoiceMuted
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {isVoiceMuted ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-red-400" />
                    <span className="hidden sm:inline">Mudo</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Voz Ativa</span>
                  </>
                )}
              </button>

              {/* Toggle Comparison Modal */}
              <button
                onClick={() => setShowComparisonModal(true)}
                title="Ver tabela comparativa: Bem-Estar vs Notificações"
                className="p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Comparativo</span>
              </button>

              {/* Minimize / Maximize */}
              <button
                onClick={() => setIsMinimized((prev) => !prev)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title={isMinimized ? 'Expandir tutorial' : 'Minimizar banner'}
              >
                {isMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>

              {/* Skip / Close Tutorial */}
              <button
                onClick={() => {
                  clearTimers();
                  stopSpeech();
                  onClose();
                }}
                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/30 text-red-300 hover:text-red-100 transition-colors cursor-pointer"
                title="Pular tutorial"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Banner Body Content (Collapsible) */}
          {!isMinimized && (
            <div className="p-3.5 sm:p-5 space-y-3">
              {/* Title & Speech Status Indicator */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-sm sm:text-base font-black text-white tracking-wide flex items-center gap-2">
                    {currentPhase.highlightType === 'invasive' && (
                      <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse shrink-0" />
                    )}
                    {currentPhase.highlightType === 'wellness' && (
                      <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
                    )}
                    {currentPhase.highlightType === 'controls' && (
                      <Sparkles className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                    )}
                    {currentPhase.highlightType === 'ready' && (
                      <Award className="w-4 h-4 text-amber-400 animate-bounce shrink-0" />
                    )}
                    {currentPhase.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1 leading-snug">
                    {currentPhase.shortSummary}
                  </p>
                </div>

                {/* Status Badges: Speaking vs Inter-Phase Pause */}
                <div className="shrink-0 flex items-center gap-1.5">
                  {isSpeaking && !isVoiceMuted && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-[10px] font-bold text-cyan-300 animate-pulse">
                      <span className="w-1 h-3 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1 h-4 bg-cyan-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1 h-2 bg-cyan-400 rounded-full animate-bounce" />
                      <span className="hidden sm:inline">Narrando...</span>
                    </div>
                  )}

                  {isInPause && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-[11px] font-black text-amber-200 animate-pulse">
                      <Clock className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                      <span>
                        Pausa: {pauseCountdown}s
                      </span>
                    </div>
                  )}

                  {isVoiceMuted && !isInPause && (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300">
                      <span>Leitura: {readingCountdown}s</span>
                    </div>
                  )}
                </div>
              </div>

              {/* PHASE-SPECIFIC VISUAL SHOWCASE TILES */}
              {currentPhase.highlightType === 'controls' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="bg-slate-900/80 border border-white/10 rounded-xl p-2 text-center">
                    <span className="text-[10px] font-mono font-bold text-indigo-300 block">[A] / [D]</span>
                    <span className="text-[9px] text-slate-400">Mudar Pista</span>
                  </div>
                  <div className="bg-slate-900/80 border border-white/10 rounded-xl p-2 text-center">
                    <span className="text-[10px] font-mono font-bold text-cyan-300 block">[W] / Espaço</span>
                    <span className="text-[9px] text-slate-400">Pular Buracos</span>
                  </div>
                  <div className="bg-slate-900/80 border border-white/10 rounded-xl p-2 text-center">
                    <span className="text-[10px] font-mono font-bold text-amber-300 block">[S] / Baixo</span>
                    <span className="text-[9px] text-slate-400">Agachar / Deslizar</span>
                  </div>
                  <div className="bg-slate-900/80 border border-white/10 rounded-xl p-2 text-center">
                    <span className="text-[10px] font-mono font-bold text-emerald-300 block">Touch / Joystick</span>
                    <span className="text-[9px] text-slate-400">Controles Virtuais</span>
                  </div>
                </div>
              )}

              {currentPhase.highlightType === 'invasive' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-2.5 flex flex-col items-center text-center">
                    <MessageCircle className="w-5 h-5 text-green-400 mb-1" />
                    <span className="text-[10px] font-black text-rose-200">WhatsApp</span>
                    <span className="text-[8px] font-mono text-rose-300/80">+3% Ansiedade</span>
                  </div>
                  <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-2.5 flex flex-col items-center text-center">
                    <Flame className="w-5 h-5 text-rose-400 mb-1 animate-pulse" />
                    <span className="text-[10px] font-black text-rose-200">TikTok & Feeds</span>
                    <span className="text-[8px] font-mono text-rose-300/80">Efeito FOMO Multiplicador</span>
                  </div>
                  <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-2.5 flex flex-col items-center text-center">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mb-1" />
                    <span className="text-[10px] font-black text-rose-200">Alertas Pendentes</span>
                    <span className="text-[8px] font-mono text-rose-300/80">+6% Ansiedade</span>
                  </div>
                  <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-2.5 flex flex-col items-center text-center">
                    <Smartphone className="w-5 h-5 text-purple-400 mb-1" />
                    <span className="text-[10px] font-black text-rose-200">Likes & Telas</span>
                    <span className="text-[8px] font-mono text-rose-300/80">Sobrecarga Atencional</span>
                  </div>
                </div>
              )}

              {currentPhase.highlightType === 'wellness' && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                  <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2 flex flex-col items-center text-center">
                    <Sparkles className="w-4 h-4 text-amber-400 mb-1" />
                    <span className="text-[10px] font-black text-emerald-200">Moedas de Ouro</span>
                    <span className="text-[8px] font-mono text-emerald-300/90">+100 Pontos</span>
                  </div>
                  <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2 flex flex-col items-center text-center">
                    <Coffee className="w-4 h-4 text-amber-300 mb-1" />
                    <span className="text-[10px] font-black text-emerald-200">Chá / Café</span>
                    <span className="text-[8px] font-mono text-emerald-300/90">-10% Ansiedade</span>
                  </div>
                  <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2 flex flex-col items-center text-center">
                    <BookOpen className="w-4 h-4 text-cyan-300 mb-1" />
                    <span className="text-[10px] font-black text-emerald-200">Livros</span>
                    <span className="text-[8px] font-mono text-emerald-300/90">-3% Ansiedade</span>
                  </div>
                  <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2 flex flex-col items-center text-center">
                    <TreePine className="w-4 h-4 text-emerald-400 mb-1" />
                    <span className="text-[10px] font-black text-emerald-200">Ar Livre</span>
                    <span className="text-[8px] font-mono text-emerald-300/90">-9% + Escudo</span>
                  </div>
                  <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2 flex flex-col items-center text-center col-span-2 sm:col-span-1">
                    <Dog className="w-4 h-4 text-amber-400 mb-1" />
                    <span className="text-[10px] font-black text-emerald-200">Pet Luke</span>
                    <span className="text-[8px] font-mono text-emerald-300/90">-15% Ansiedade</span>
                  </div>
                </div>
              )}

              {currentPhase.highlightType === 'ready' && (
                <div className="p-3 bg-gradient-to-r from-emerald-950/60 to-cyan-950/60 border border-emerald-400/40 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Você está pronto para o desafio completo!
                      </span>
                      <span className="text-[10px] text-emerald-300 block">
                        Equilibre sua mente, colete itens de bem-estar e responda às perguntas SAS com honestidade.
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      clearTimers();
                      stopSpeech();
                      onClose();
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider shrink-0 cursor-pointer shadow-lg"
                  >
                    Começar!
                  </button>
                </div>
              )}

              {/* INTER-PHASE PAUSE FOOTER BAR */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  {isInPause ? (
                    <span className="text-amber-300 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                      Narração concluída. Tempo de respiro ({pauseCountdown}s) antes da {currentPhaseIndex < TUTORIAL_PHASES.length - 1 ? `Fase ${currentPhaseIndex + 2}` : 'conclusão'}...
                    </span>
                  ) : isSpeaking ? (
                    <span className="text-cyan-300/90 font-medium flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                      Ouvindo explicação completa... A transição aguardará o fim da fala.
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      Fase {currentPhaseIndex + 1} de {TUTORIAL_PHASES.length}
                    </span>
                  )}
                </div>

                {/* Quick Advance / Next Button */}
                <button
                  onClick={handleAdvanceImmediately}
                  className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  title={currentPhaseIndex < TUTORIAL_PHASES.length - 1 ? 'Avançar para a próxima fase' : 'Concluir tutorial'}
                >
                  {currentPhaseIndex < TUTORIAL_PHASES.length - 1 ? (
                    <>
                      <span>{isInPause ? 'Próxima Fase' : 'Avançar'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <span>Concluir</span>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- DETAILED COMPARISON MODAL (BEM-ESTAR vs INVASIVOS) --- */}
      {showComparisonModal && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base sm:text-lg font-black text-white">
                  Guia Clínico: Bem-Estar vs Notificações Invasivas
                </h2>
              </div>
              <button
                onClick={() => setShowComparisonModal(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Baseado na pesquisa clínica da Turma 61 da EEEM Felipe Camarão sobre uso consciente de telas,
              ansiedade e sobrecarga digital (FOMO):
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Coluna 1: Notificações Invasivas */}
              <div className="bg-rose-950/30 border border-rose-500/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-rose-300 border-b border-rose-500/20 pb-2">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  <h3 className="font-black text-sm uppercase tracking-wider">
                    Notificações Invasivas (Evite!)
                  </h3>
                </div>
                <ul className="text-xs space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold shrink-0">⚠️</span>
                    <div>
                      <strong className="text-white block">WhatsApp & Mensagens:</strong>
                      Causam sensação de urgência artificial e ansiedade (+3% a cada impacto).
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold shrink-0">🔥</span>
                    <div>
                      <strong className="text-white block">Feeds & TikTok:</strong>
                      Estimulam busca incessante de dopamina, gerando cansaço mental e multiplicador de ansiedade.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold shrink-0">🚨</span>
                    <div>
                      <strong className="text-white block">Alertas Vermelhos & Pop-ups:</strong>
                      Fragmentam a concentração, aumentando a ansiedade em até +6%.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold shrink-0">🛑</span>
                    <div>
                      <strong className="text-white block">Consequência no Jogo:</strong>
                      Ao atingir 100% de ansiedade, o jogador entra em Colapso Digital (Game Over).
                    </div>
                  </li>
                </ul>
              </div>

              {/* Coluna 2: Itens de Bem-Estar */}
              <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-300 border-b border-emerald-500/20 pb-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-black text-sm uppercase tracking-wider">
                    Itens de Bem-Estar (Colete!)
                  </h3>
                </div>
                <ul className="text-xs space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">🪙</span>
                    <div>
                      <strong className="text-white block">Moedas de Ouro:</strong>
                      Recompensam o foco na pista com +100 pontos de saúde mental.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">🍵</span>
                    <div>
                      <strong className="text-white block">Chá & Café Quente:</strong>
                      Representam pausas ativas conscientes, reduzindo -10% de ansiedade.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">🌳</span>
                    <div>
                      <strong className="text-white block">Ar Livre & Pet Luke:</strong>
                      Reduzem até -15% de ansiedade e ativam escudo esférico protetor temporário.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">🔌</span>
                    <div>
                      <strong className="text-white block">Desconexão:</strong>
                      Ativa o guarda-chuva protetor que bloqueia danos de notificações por 3 segundos.
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowComparisonModal(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Voltar ao Jogo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
