import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, SASQuestion, FallingItem, GamepadConfig } from './types';
import { generateRandomSASQuestions, getShuffledSASQuestions } from './data/sasQuestions';
import { Navbar } from './components/Navbar';
import { ThreeCanvas } from './components/ThreeCanvas';
import { GameHUD } from './components/GameHUD';
import { LuauCodeViewer } from './components/LuauCodeViewer';
import { RobloxSetupGuide } from './components/RobloxSetupGuide';
import { FomoAnalytics } from './components/FomoAnalytics';
import { GamepadConfigModal } from './components/GamepadConfigModal';
import { QRCodeCard } from './components/QRCodeCard';
import { PrintViewPage } from './components/PrintViewPage';
import { Play, RotateCcw, ShieldCheck, Sparkles, Volume2, VolumeX, Keyboard, Gamepad2, Gamepad, X, BookOpen, Download, Instagram } from 'lucide-react';
import confetti from 'canvas-confetti';

import instagramLogo from './assets/images/entreredes_logo_1787106204844.jpg';
import researchersImage from './assets/images/pesquisadores_1787106642560.jpg';
import {
  initAudio,
  playCollectWellnessSFX,
  playHarmfulHitSFX,
  playGuitarChordSFX,
  playSASQuestionChime,
  playZenEnterSFX,
  playVictorySFX,
  playDefeatSFX,
  speakQuestion,
  stopSpeech,
  playDogBarkSFX,
} from './utils/audio';

export default function App() {
  const isPrintMode = typeof window !== 'undefined' && window.location.search.includes('print=true');

  if (isPrintMode) {
    return <PrintViewPage />;
  }

  const [activeTab, setActiveTab] = useState<'simulator' | 'code' | 'guide' | 'analytics'>('simulator');

  // Game Engine States
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [gameTimer, setGameTimer] = useState<number>(0);
  const [anxietyLevel, setAnxietyLevel] = useState<number>(0);
  const [notificationSpeed, setNotificationSpeed] = useState<number>(1.0);
  const [anxietyMultiplier, setAnxietyMultiplier] = useState<number>(1.0);
  const [harmfulStreak, setHarmfulStreak] = useState<number>(0);
  const [lastChoiceFeedback, setLastChoiceFeedback] = useState<{ type: 'SIM' | 'NAO'; message: string } | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<SASQuestion | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [zenReason, setZenReason] = useState<string | null>(null);
  const [activeSASQuestions, setActiveSASQuestions] = useState<Record<number, SASQuestion>>(() =>
    generateRandomSASQuestions()
  );

  // Track session answers for end-of-game psychometric evaluation
  const [sessionAnswers, setSessionAnswers] = useState<
    Array<{ question: string; answer: 'SIM' | 'NÃO'; category?: string; timeTrigger: number }>
  >([]);

  // Gamepad/Bluetooth Controller States
  const [gamepadConfig, setGamepadConfig] = useState<GamepadConfig>({
    enabled: true,
    mode: 'analog',
    deadzone: 0.15,
    invert: false,
  });
  const [isGamepadModalOpen, setIsGamepadModalOpen] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [showStudyModal, setShowStudyModal] = useState<boolean>(false);

  // Protective Umbrella (Guarda-chuva) State and Ref
  const [umbrellaActive, setUmbrellaActive] = useState<boolean>(false);
  const umbrellaTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Beneficial items score counter
  const [wellnessCount, setWellnessCount] = useState<number>(0);

  // Temporary Outdoor Protection Shield (Escudo Esférico 2s Ar Livre) State and Ref
  const [outdoorShieldActive, setOutdoorShieldActive] = useState<boolean>(false);
  const outdoorShieldTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const downloadStudyTxt = () => {
    const text = `===========================================================
ESTUDO CIENTÍFICO: ENTRE REDES HÁ ANSIEDADE
MÓDULO DE PESQUISA & DIAGNÓSTICO
===========================================================

Tema: Cruzamento Científico: FOMO e Sobrecarga Digital
Data: ${new Date().toLocaleDateString('pt-BR')}

-----------------------------------------------------------
1. Metodologia do Estudo de Caso
-----------------------------------------------------------
O estudo investiga o impacto psicofisiológico da dependência de dispositivos móveis através de variáveis coletadas em tempo real durante o jogo.

- Análise de Input Ativo: Coleta de respostas (SIM/NÃO) baseadas na escala clínica adaptada SAS-SMU para medir impulsividade.
- Monitoramento de Locomoção (WalkSpeed): O acúmulo de ansiedade virtual reduz dinamicamente a velocidade operacional do avatar de 16 u/s para 8 u/s.
- Taxa de Sobrevivência: Avaliação estatística da colisão contra notificações e estímulos em tempo real de acordo com o nível de ansiedade.

-----------------------------------------------------------
2. Classificação de Perfis (Índice SAS-SMU)
-----------------------------------------------------------
- Resiliente Digital: Baixo índice de dependência (< 30% afirmativas). Autocontrole saudável sobre notificações e urgência.
- Uso Moderado: Índice intermediário (30% a 59% afirmativas). Vulnerabilidade ocasional e estresse leve sob alertas constantes.
- Hiperconectado: Alto índice de dependência (>= 60% afirmativas). Alta ansiedade social (FOMO) e dependência operacional de estímulos.

-----------------------------------------------------------
Conclusão
-----------------------------------------------------------
O cruzamento científico ajuda a identificar como a sobrecarga informativa digital afeta de modo empírico a atenção sustentada, a cognição espacial e o bem-estar psicológico.

===========================================================
Entre Redes Há Ansiedade - Simulador Educacional
https://sobrecarga-digital.ai.studio
===========================================================`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'estudo_caso_fomo_sobrecarga.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // References
  const playerPosRef = useRef<number>(0); // X axis between -24 and +24
  const keysDownRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const questionDeckRef = useRef<SASQuestion[]>([]);
  const questionIndexRef = useRef<number>(0);
  const usedQuestionIdsRef = useRef<Set<number>>(new Set());

  // Landscape & Fullscreen Orientation Detector
  const [isLandscape, setIsLandscape] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth > window.innerHeight;
  });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleOrientationChange = () => {
      const isLand = window.innerWidth > window.innerHeight;
      setIsLandscape(isLand);
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
    };

    handleOrientationChange();
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);
    document.addEventListener('fullscreenchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
      document.removeEventListener('fullscreenchange', handleOrientationChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen((prev) => !prev);
    }
  };

  const prevGameStateRef = useRef<GameState>('PLAYING');

  // --- Toggle Pause ---
  const handleTogglePause = useCallback(() => {
    setGameState((current) => {
      if (current === 'PAUSED') {
        return prevGameStateRef.current === 'MODO_ZEN' ? 'MODO_ZEN' : 'PLAYING';
      } else if (current === 'PLAYING' || current === 'MODO_ZEN') {
        prevGameStateRef.current = current;
        return 'PAUSED';
      }
      return current;
    });
  }, []);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (!next) {
        stopSpeech();
      }
      return next;
    });
  }, []);

  // --- Start Game ---
  const handleStartGame = () => {
    initAudio();
    stopSpeech();
    
    // Initialize fresh shuffled deck of 100 questions and reset used questions set
    usedQuestionIdsRef.current.clear();
    const shuffledDeck = getShuffledSASQuestions();
    questionDeckRef.current = shuffledDeck;
    questionIndexRef.current = 0;

    setGameState('PLAYING');
    setGameTimer(0);
    setAnxietyLevel(0);
    setWellnessCount(0);
    setNotificationSpeed(1.0);
    setAnxietyMultiplier(1.0);
    setHarmfulStreak(0);
    setLastChoiceFeedback(null);
    setCurrentQuestion(null);
    setZenReason(null);
    setSessionAnswers([]);
    playerPosRef.current = 0;
    keysDownRef.current = { left: false, right: false };
    setUmbrellaActive(false);
    if (umbrellaTimeoutRef.current) {
      clearTimeout(umbrellaTimeoutRef.current);
      umbrellaTimeoutRef.current = null;
    }
    setOutdoorShieldActive(false);
    if (outdoorShieldTimeoutRef.current) {
      clearTimeout(outdoorShieldTimeoutRef.current);
      outdoorShieldTimeoutRef.current = null;
    }
    window.focus();

    // Log gameplay start
    try {
      const currentStarted = Number(localStorage.getItem('fomo_games_started_count') || '0');
      localStorage.setItem('fomo_games_started_count', String(currentStarted + 1));
    } catch (err) {
      console.error(err);
    }
  };

  // Log game outcomes on victory/defeat
  useEffect(() => {
    if (gameState === 'VITORIA' || gameState === 'DERROTA') {
      try {
        const outcomes = JSON.parse(localStorage.getItem('fomo_games_outcomes') || '[]');
        const category = anxietyLevel >= 71 ? 'Hiperconectado' : anxietyLevel >= 31 ? 'Uso Moderado' : 'Resiliente Digital';
        
        const now = Date.now();
        // Prevent registering duplicates if they happen within 1s
        const lastOutcome = outcomes[outcomes.length - 1];
        if (!lastOutcome || now - lastOutcome.timestamp > 1000) {
          outcomes.push({
            status: gameState,
            anxiety: anxietyLevel,
            category,
            timestamp: now
          });
          localStorage.setItem('fomo_games_outcomes', JSON.stringify(outcomes));
        }
      } catch (err) {
        console.error(err);
      }
    }
  }, [gameState, anxietyLevel]);

  // --- Move Player ---
  const handleMovePlayer = useCallback((direction: -1 | 1) => {
    playerPosRef.current = Math.max(-180, Math.min(180, playerPosRef.current + direction * 6));
  }, []);

  const handleSetMovingLeft = useCallback((active: boolean) => {
    keysDownRef.current.left = active;
  }, []);

  const handleSetMovingRight = useCallback((active: boolean) => {
    keysDownRef.current.right = active;
  }, []);

  // --- Continuous Movement Loop (60 FPS Smooth Navigation Across Expanded Map) ---
  useEffect(() => {
    if (gameState !== 'PLAYING' && gameState !== 'MODO_ZEN') return;

    let animId: number;
    const updateMovement = () => {
      let dir = 0;
      if (keysDownRef.current.left) dir -= 1;
      if (keysDownRef.current.right) dir += 1;

      // --- Read Bluetooth Gamepad Inputs if Enabled ---
      if (gamepadConfig.enabled) {
        const gamepads = navigator.getGamepads();
        const gp = Array.from(gamepads).find((g) => g !== null);
        if (gp) {
          let gpDir = 0;
          if (gamepadConfig.mode === 'analog') {
            const axisVal = gp.axes[0] || 0; // Left Stick horizontal
            if (Math.abs(axisVal) > gamepadConfig.deadzone) {
              gpDir = axisVal;
            }
          } else if (gamepadConfig.mode === 'dpad') {
            const btnLeft = gp.buttons[14]?.pressed;
            const btnRight = gp.buttons[15]?.pressed;
            if (btnLeft) gpDir -= 1;
            if (btnRight) gpDir += 1;
          } else if (gamepadConfig.mode === 'buttons') {
            const btnL = gp.buttons[2]?.pressed || gp.buttons[4]?.pressed;
            const btnR = gp.buttons[1]?.pressed || gp.buttons[5]?.pressed;
            if (btnL) gpDir -= 1;
            if (btnR) gpDir += 1;
          }

          if (gamepadConfig.invert) {
            gpDir = -gpDir;
          }

          if (gpDir !== 0) {
            dir += gpDir;
          }
        }
      }

      if (dir !== 0) {
        const finalDir = Math.max(-1, Math.min(1, dir));
        playerPosRef.current = Math.max(-180, Math.min(180, playerPosRef.current + finalDir * 1.45));
      }
      animId = requestAnimationFrame(updateMovement);
    };

    animId = requestAnimationFrame(updateMovement);
    return () => cancelAnimationFrame(animId);
  }, [gameState, gamepadConfig]);

  // --- Reset Stuck Input Keys on GameState Transitions ---
  useEffect(() => {
    keysDownRef.current = { left: false, right: false };
  }, [gameState]);

  // --- Auto Logoff on Exiting Academic Diagnostic Tab ---
  useEffect(() => {
    if (activeTab !== 'analytics') {
      try {
        sessionStorage.removeItem('fomo_diagnostico_auth');
        sessionStorage.removeItem('fomo_diagnostico_user');
      } catch (err) {}
    }
  }, [activeTab]);

  // --- Keyboard Control Handler with Auto-Focus ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Pause with 'p', 'P' or 'Escape' during active game states
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (gameState === 'PLAYING' || gameState === 'MODO_ZEN' || gameState === 'PAUSED') {
          e.preventDefault();
          handleTogglePause();
          return;
        }
      }

      if (gameState === 'PLAYING' || gameState === 'MODO_ZEN') {
        if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
          keysDownRef.current.left = true;
        } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
          keysDownRef.current.right = true;
        }
      }

      if (gameState === 'PAUSED_SAS' && currentQuestion) {
        if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
          handleAnswerSAS(true);
        } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
          handleAnswerSAS(false);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        keysDownRef.current.left = false;
      } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        keysDownRef.current.right = false;
      }
    };

    const handleBlur = () => {
      keysDownRef.current.left = false;
      keysDownRef.current.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameState, currentQuestion, handleTogglePause]);

  // --- Item Collision Processing ---
  const handleItemCollect = useCallback((type: FallingItem['type']) => {
    let isWellness = false;
    let triggerMsg = '';

    // Check if protected by Umbrella or Outdoor Shield
    const isHarmful = type === 'CardNotificacao' || type === 'CardNotifPendente' || type === 'CardFeed' ||
                      type === 'Feed' || type === 'Like' || type === 'Wifi' || type === 'Smartphone' || type === 'Geometric' ||
                      type === 'WhatsApp' || type === 'YouTube' || type === 'Facebook';

    if (isHarmful && (outdoorShieldActive || umbrellaActive)) {
      playCollectWellnessSFX(soundEnabled);
      setLastChoiceFeedback({
        type: 'NAO',
        message: `🛡️ Escudo de Proteção Ativo! Dano Bloqueado!`,
      });
      setTimeout(() => {
        setLastChoiceFeedback(null);
      }, 1500);
      return;
    }

    if (type === 'CardNotificacao' || type === 'CardNotifPendente' || type === 'CardFeed') {
      playHarmfulHitSFX(soundEnabled);
      const cardDelta = Math.max(1, Math.round(2 * 1.07));
      setAnxietyLevel((prevVal) => {
        const nextVal = Math.max(0, Math.min(100, prevVal + cardDelta));
        if (nextVal >= 100) {
          setGameState('DERROTA');
          playDefeatSFX(soundEnabled);
        }
        return nextVal;
      });
      const labels = {
        CardNotificacao: 'Alerta Rápido',
        CardNotifPendente: 'Notificação Pendente',
        CardFeed: 'Novo Feed',
      };
      const label = labels[type] || 'Notificação';
      setLastChoiceFeedback({
        type: 'SIM',
        message: `💥 ${label} • Ansiedade +${cardDelta}%`,
      });
      setTimeout(() => {
        setLastChoiceFeedback(null);
      }, 2000);
      return;
    }

    if (type === 'Feed' || type === 'Like' || type === 'Wifi' || type === 'Smartphone' || type === 'Geometric' || type === 'WhatsApp' || type === 'YouTube' || type === 'Facebook') {
      playHarmfulHitSFX(soundEnabled);
      setHarmfulStreak((prevStreak) => {
        const nextStreak = prevStreak + 1;
        const multiplier = Number(Math.pow(1.35, nextStreak - 1).toFixed(1));
        setAnxietyMultiplier(multiplier);

        const baseDelta = type === 'Smartphone' ? 9 : type === 'Geometric' ? 8 : type === 'YouTube' ? 9 : type === 'WhatsApp' ? 7 : type === 'Facebook' ? 7 : 5;
        const actualDelta = Math.round(baseDelta * 1.07 * multiplier);

        setAnxietyLevel((prevVal) => {
          const nextVal = Math.max(0, Math.min(100, prevVal + actualDelta));
          if (nextVal >= 100) {
            setGameState('DERROTA');
            playDefeatSFX(soundEnabled);
          }
          return nextVal;
        });

        return nextStreak;
      });
    } else {
      // Wellness Items
      isWellness = true;
      setHarmfulStreak(0);
      setAnxietyMultiplier(1.0);

      // --- Progressive Difficulty Scaling After Diagnostic Minimum (10+ Questions) ---
      let protectionMultiplier = 1.0;
      if (sessionAnswers.length >= 10) {
        const extraQuestions = sessionAnswers.length - 10;
        // Starts at 80% protection on question 10 and decreases by 4% per additional question down to 40% floor
        protectionMultiplier = Math.max(0.40, 0.80 - extraQuestions * 0.04);
      }

      let baseDelta = -2;
      let itemLabel = '';

      if (type === 'Bola de Futebol') {
        baseDelta = -7;
        itemLabel = '⚽ Bola de Futebol';
        playCollectWellnessSFX(soundEnabled);
      } else if (type === 'Encontro Presencial') {
        baseDelta = -11;
        itemLabel = '🤝 Encontro Presencial';
        playCollectWellnessSFX(soundEnabled);
      } else if (type === 'Exercício Físico') {
        baseDelta = -5;
        itemLabel = '🏃 Exercício Físico';
        playCollectWellnessSFX(soundEnabled);
      } else if (type === 'Atividade ao Ar Livre') {
        baseDelta = -8;
        itemLabel = '🌳 Atividade ao Ar Livre';
        playCollectWellnessSFX(soundEnabled);

        // Activate temporary 2-second protective shield sphere
        setOutdoorShieldActive(true);
        if (outdoorShieldTimeoutRef.current) {
          clearTimeout(outdoorShieldTimeoutRef.current);
        }
        outdoorShieldTimeoutRef.current = setTimeout(() => {
          setOutdoorShieldActive(false);
          outdoorShieldTimeoutRef.current = null;
        }, 2000);
      } else if (type === 'Desconexão') {
        baseDelta = -13;
        itemLabel = '🔌 Desconexão';
        playCollectWellnessSFX(soundEnabled);

        // Activate protective umbrella for 3 seconds
        setUmbrellaActive(true);
        if (umbrellaTimeoutRef.current) {
          clearTimeout(umbrellaTimeoutRef.current);
        }
        umbrellaTimeoutRef.current = setTimeout(() => {
          setUmbrellaActive(false);
          umbrellaTimeoutRef.current = null;
        }, 3000);
      } else if (type === 'Coffee') {
        baseDelta = -2;
        itemLabel = '☕ Pausa Ativa';
        playCollectWellnessSFX(soundEnabled);
      } else if (type === 'Book') {
        baseDelta = -2;
        itemLabel = '📚 Leitura & Foco';
        playCollectWellnessSFX(soundEnabled);
      } else if (type === 'Hamburguer') {
        baseDelta = -1;
        itemLabel = '🍔 Lanche Consciente';
        playCollectWellnessSFX(soundEnabled);
      } else if (type === 'Violão') {
        baseDelta = -10;
        itemLabel = '🎸 Música & Violão Acústico';
        playGuitarChordSFX(soundEnabled);
      } else if (type === 'Cachorro') {
        baseDelta = -3;
        itemLabel = '🐶 Cachorrinho Amigo';
        playDogBarkSFX(soundEnabled);
      }

      // Calculate effective delta with protection multiplier applied
      setWellnessCount((prev) => prev + Math.abs(baseDelta) * 100);
      const delta = Math.min(-1, Math.round(baseDelta * protectionMultiplier));

      const protPct = Math.round(protectionMultiplier * 100);
      const diffTag = sessionAnswers.length >= 10 ? ` • ⚡ Proteção ${protPct}%` : '';
      const shieldTag = type === 'Atividade ao Ar Livre' ? ' + Escudo Proteção 2s!' : type === 'Desconexão' ? ' + Guarda-chuva Protetor!' : '';
      triggerMsg = `${itemLabel} (${delta}% Ansiedade${diffTag}${shieldTag})`;

      setAnxietyLevel((prev) => {
        const nextVal = Math.max(0, prev + delta);

        if (nextVal === 0 && prev > 0) {
          setLastChoiceFeedback({
            type: 'NAO',
            message: `🧘 Equilíbrio Pleno • Ansiedade zerada (0%)!`,
          });
          setTimeout(() => {
            setLastChoiceFeedback(null);
          }, 3500);
        } else {
          setLastChoiceFeedback({
            type: 'NAO',
            message: `🌱 ${triggerMsg} • Ansiedade reduzida para ${nextVal}%`,
          });
          setTimeout(() => {
            setLastChoiceFeedback(null);
          }, 2500);
        }

        return nextVal;
      });
    }

    setNotificationSpeed((prev) => {
      if (type === 'Geometric') return prev * 1.2;
      if (
        type === 'Exercício Físico' ||
        type === 'Atividade ao Ar Livre' ||
        type === 'Desconexão' ||
        type === 'Book' ||
        type === 'Bola de Futebol' ||
        type === 'Encontro Presencial' ||
        type === 'Hamburguer'
      ) {
        return Math.max(0.5, prev - 0.2);
      }
      return prev;
    });
  }, [soundEnabled, sessionAnswers.length]);

  // --- Game Loop Timer (1s ascending ticks - Free Open-Ended Play Time) ---
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const interval = setInterval(() => {
      setGameTimer((prevTimer) => {
        const nextTimer = prevTimer + 1;

        // Check SAS Question Trigger every 10 seconds of active play (10s, 20s, 30s, 40s, 50s, 60s, ...)
        if (nextTimer > 0 && nextTimer % 10 === 0) {
          // Find next unasked question from the 100 questions pool
          while (
            questionIndexRef.current < questionDeckRef.current.length &&
            usedQuestionIdsRef.current.has(questionDeckRef.current[questionIndexRef.current].id ?? questionIndexRef.current)
          ) {
            questionIndexRef.current++;
          }

          // If questions remain in deck, pick the next unique question
          if (questionIndexRef.current < questionDeckRef.current.length) {
            const q = questionDeckRef.current[questionIndexRef.current];
            usedQuestionIdsRef.current.add(q.id ?? questionIndexRef.current);
            questionIndexRef.current += 1;

            setGameState('PAUSED_SAS');
            setCurrentQuestion({ ...q, timeTrigger: nextTimer });
            playSASQuestionChime(soundEnabled);
            speakQuestion(q.question, soundEnabled);
          }
        }

        return nextTimer;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, soundEnabled]);

  // --- SAS Question Answer Handler (Pure Psychometric Evaluation - No In-Game Metric Alteration) ---
  const handleAnswerSAS = (choiceSim: boolean) => {
    if (!currentQuestion) return;

    // 1. Resume gameplay and close modal visually immediately to ensure zero UI delay
    setGameState('PLAYING');
    setCurrentQuestion(null);

    // 2. Stop speech synthesis asynchronously to prevent Web Speech API thread blocking from lagging the React re-render
    setTimeout(() => {
      stopSpeech();
    }, 10);

    const choiceStr = choiceSim ? 'SIM' : 'NÃO';

    const record = {
      question: currentQuestion.question,
      category: currentQuestion.category || 'GERAL',
      answer: choiceStr as 'SIM' | 'NÃO',
      timeTrigger: currentQuestion.timeTrigger,
    };

    setSessionAnswers((prev) => [...prev, record]);

    // Log user answer into persistent evaluations for research & diagnostic profiling
    try {
      const saved = JSON.parse(localStorage.getItem('fomo_games_evaluations') || '[]');
      saved.push({
        question: currentQuestion.question,
        category: currentQuestion.category || 'GERAL',
        answer: choiceStr,
        timeTrigger: currentQuestion.timeTrigger,
        timestamp: Date.now(),
      });
      localStorage.setItem('fomo_games_evaluations', JSON.stringify(saved));
    } catch (err) {
      console.error(err);
    }

    const totalAnswers = sessionAnswers.length + 1;

    // Display confirmation message and highlight difficulty scaling starting at question 10
    if (totalAnswers === 10) {
      setLastChoiceFeedback({
        type: 'SIM',
        message: `⚡ Diagnóstico Mínimo Atingido (10 Pgs)! Dificuldade aumentada: Proteção dos itens reduzida para 80%!`,
      });
      setTimeout(() => {
        setLastChoiceFeedback(null);
      }, 4500);
    } else {
      setLastChoiceFeedback({
        type: choiceSim ? 'SIM' : 'NAO',
        message: `📋 Resposta "${choiceStr}" registrada para a Avaliação Psicometria SAS (Sem alteração no jogo)`,
      });
      setTimeout(() => {
        setLastChoiceFeedback(null);
      }, 3500);
    }
  };

  // --- Finish Evaluation (Available from Question 10+ onwards) ---
  const handleFinishEvaluation = () => {
    // 1. Immediately transit to victory state visually
    setGameState('VITORIA');
    setCurrentQuestion(null);
    playVictorySFX(soundEnabled);
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });

    // 2. Stop speech synthesis asynchronously to ensure smooth screen transition
    setTimeout(() => {
      stopSpeech();
    }, 10);
  };

  return (
    <div className="min-h-screen bg-[#050508] bg-sleek-radial text-white flex flex-col font-sans selection:bg-cyan-500 selection:text-white relative overflow-x-hidden">
      {/* Background Sleek Grid Pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-sleek-grid" />

      {/* Header Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        gameState={gameState}
        onStartGame={handleStartGame}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        isGamepadModalOpen={isGamepadModalOpen}
        setIsGamepadModalOpen={setIsGamepadModalOpen}
        gamepadConfig={gamepadConfig}
        showQrModal={showQrModal}
        setShowQrModal={setShowQrModal}
        showStudyModal={showStudyModal}
        setShowStudyModal={setShowStudyModal}
      />

      {/* Main Content Area */}
      <main className={`flex-1 w-full mx-auto flex flex-col gap-6 relative z-10 ${
        (isLandscape || isFullscreen) && activeTab === 'simulator'
          ? 'p-0 m-0 max-w-none'
          : activeTab === 'simulator'
          ? 'max-w-none p-0 md:p-6 lg:p-8'
          : 'max-w-7xl p-4 sm:p-6 md:p-8'
      }`}>
        {/* --- TAB 1: 3D INTERACTIVE SIMULATOR --- */}
        {activeTab === 'simulator' && (
          <div className="flex flex-col gap-4">
            {/* 3D Canvas Stage (Occupies 100% full screen when in landscape / horizontal) */}
            <div 
              onClick={() => window.focus()}
              tabIndex={0}
              className={`relative overflow-hidden outline-none transition-all duration-300 ${
                isLandscape || isFullscreen
                  ? 'fixed inset-0 z-50 w-screen h-screen m-0 p-0 rounded-none border-none bg-black'
                  : 'w-full h-[580px] sm:h-[680px] rounded-none md:rounded-[40px] shadow-2xl border-y md:border border-white/15 bg-black/40 backdrop-blur-2xl'
              }`}
            >
              <ThreeCanvas
                gameState={gameState}
                gameTimer={gameTimer}
                anxietyLevel={anxietyLevel}
                notificationSpeed={notificationSpeed}
                onItemCollect={handleItemCollect}
                playerPosRef={playerPosRef}
                umbrellaActive={umbrellaActive}
                outdoorShieldActive={outdoorShieldActive}
              />

              {/* HUD Overlay */}
              <GameHUD
                gameState={gameState}
                gameTimer={gameTimer}
                anxietyLevel={anxietyLevel}
                notificationSpeed={notificationSpeed}
                anxietyMultiplier={anxietyMultiplier}
                lastChoiceFeedback={lastChoiceFeedback}
                currentQuestion={currentQuestion}
                sessionAnswers={sessionAnswers}
                zenTriggerReason={zenReason}
                isLandscape={isLandscape}
                isFullscreen={isFullscreen}
                onToggleFullscreen={toggleFullscreen}
                onTogglePause={handleTogglePause}
                onToggleSound={handleToggleSound}
                onAnswerSAS={handleAnswerSAS}
                onFinishEvaluation={handleFinishEvaluation}
                onRestart={handleStartGame}
                onMovePlayer={handleMovePlayer}
                onSetMovingLeft={handleSetMovingLeft}
                onSetMovingRight={handleSetMovingRight}
                soundEnabled={soundEnabled}
                wellnessCount={wellnessCount}
              />

              {/* Large Centered Start Button when in MENU state */}
              {gameState === 'MENU' && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/55 backdrop-blur-md pointer-events-auto gap-8 sm:gap-10 p-4 text-center">
                  {/* Instagram Follow Card */}
                  <a
                    href="https://www.instagram.com/entreredeshaansiedade?igsh=eXR5NXZyNGQ1bzc0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group max-w-sm bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 rounded-3xl p-5 flex flex-col items-center gap-3.5 transition-all duration-300 shadow-xl cursor-pointer hover:scale-[1.02]"
                  >
                    {/* Hand-drawn circular Brand Logo Badge */}
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-white/20 group-hover:border-purple-400/80 shadow-md transition-all">
                      <img
                        src={instagramLogo}
                        alt="Entre redes há ansiedade?"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] sm:text-xs font-black tracking-[0.2em] text-purple-400 uppercase flex items-center gap-1.5 justify-center">
                        <Instagram className="w-4 h-4 text-purple-400" /> Siga nosso trabalho
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-purple-300 transition-colors leading-tight">
                        @entreredeshaansiedade
                      </h3>
                      <p className="text-[11px] text-slate-400 leading-normal max-w-[280px]">
                        Acompanhe discussões e mapeamento comportamental sobre saúde digital!
                      </p>
                    </div>
                  </a>

                  {/* Start Button */}
                  <button
                    onClick={handleStartGame}
                    className="group relative inline-flex items-center justify-center gap-3 py-5 px-10 sm:py-6 sm:px-14 rounded-3xl bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600 text-white font-black text-xl sm:text-2xl uppercase tracking-widest shadow-[0_0_50px_rgba(34,211,238,0.5)] hover:shadow-[0_0_80px_rgba(34,211,238,0.8)] hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-cyan-300/60 cursor-pointer overflow-hidden animate-pulse"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current text-white drop-shadow-md" />
                    <span className="drop-shadow-md relative z-10">INICIAR JOGO</span>
                  </button>
                </div>
              )}
            </div>

            {/* Sleek Impact Metrics Cards */}
            {gameState !== 'VITORIA' && gameState !== 'DERROTA' && (
              <div className="max-w-7xl w-full mx-auto px-4 md:px-0">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-white/40 tracking-[0.2em] uppercase">
                    Métricas de Impacto dos Objetos 3D e Elementos de Bem-Estar (Disponíveis)
                  </span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {/* Wellness Items */}
                    <div className="flex items-center justify-between bg-cyan-500/10 py-1.5 px-2 rounded-xl border border-cyan-500/30 text-[10px] font-bold">
                      <span className="text-cyan-300 truncate">🔌 Desconexão</span>
                      <span className="font-mono text-cyan-400 font-extrabold shrink-0 ml-1">-13%</span>
                    </div>

                    <div className="flex items-center justify-between bg-pink-500/10 py-1.5 px-2 rounded-xl border border-pink-500/30 text-[10px] font-bold">
                      <span className="text-pink-300 truncate">🤝 Encontro</span>
                      <span className="font-mono text-pink-400 font-extrabold shrink-0 ml-1">-11%</span>
                    </div>

                    <div className="flex items-center justify-between bg-cyan-500/10 py-1.5 px-2 rounded-xl border border-cyan-500/30 text-[10px] font-bold">
                      <span className="text-cyan-300 truncate">🎸 Violão</span>
                      <span className="font-mono text-cyan-400 font-extrabold shrink-0 ml-1">-10%</span>
                    </div>

                    <div className="flex items-center justify-between bg-emerald-500/10 py-1.5 px-2 rounded-xl border border-emerald-500/30 text-[10px] font-bold">
                      <span className="text-emerald-300 truncate">🌳 Ar Livre</span>
                      <span className="font-mono text-emerald-400 font-extrabold shrink-0 ml-1">-8%</span>
                    </div>

                    <div className="flex items-center justify-between bg-sky-500/10 py-1.5 px-2 rounded-xl border border-sky-500/30 text-[10px] font-bold">
                      <span className="text-sky-300 truncate">⚽ Futebol</span>
                      <span className="font-mono text-sky-400 font-extrabold shrink-0 ml-1">-7%</span>
                    </div>

                    <div className="flex items-center justify-between bg-emerald-500/10 py-1.5 px-2 rounded-xl border border-emerald-500/30 text-[10px] font-bold">
                      <span className="text-emerald-300 truncate">🏃 Exercício</span>
                      <span className="font-mono text-emerald-400 font-extrabold shrink-0 ml-1">-5%</span>
                    </div>

                    <div className="flex items-center justify-between bg-amber-500/10 py-1.5 px-2 rounded-xl border border-amber-500/30 text-[10px] font-bold">
                      <span className="text-amber-300 truncate">🐶 Cachorro</span>
                      <span className="font-mono text-amber-400 font-extrabold shrink-0 ml-1">-3%</span>
                    </div>

                    <div className="flex items-center justify-between bg-amber-500/10 py-1.5 px-2 rounded-xl border border-amber-500/30 text-[10px] font-bold">
                      <span className="text-amber-300 truncate">☕ Café</span>
                      <span className="font-mono text-amber-400 font-extrabold shrink-0 ml-1">-2%</span>
                    </div>

                    <div className="flex items-center justify-between bg-cyan-500/10 py-1.5 px-2 rounded-xl border border-cyan-500/30 text-[10px] font-bold">
                      <span className="text-cyan-300 truncate">📚 Livro</span>
                      <span className="font-mono text-cyan-400 font-extrabold shrink-0 ml-1">-2%</span>
                    </div>

                    <div className="flex items-center justify-between bg-amber-500/10 py-1.5 px-2 rounded-xl border border-amber-500/30 text-[10px] font-bold">
                      <span className="text-amber-300 truncate">🍔 Lanche</span>
                      <span className="font-mono text-amber-400 font-extrabold shrink-0 ml-1">-1%</span>
                    </div>

                    {/* Harmful Items */}
                    <div className="flex items-center justify-between bg-red-500/10 py-1.5 px-2 rounded-xl border border-red-500/30 text-[10px] font-bold">
                      <span className="text-red-300 truncate">⚠️ Notif.</span>
                      <span className="font-mono text-red-400 font-extrabold shrink-0 ml-1">+8%</span>
                    </div>

                    <div className="flex items-center justify-between bg-white/5 py-1.5 px-2 rounded-xl border border-white/10 text-[10px] font-bold">
                      <span className="text-white/70 truncate">💬 WhatsApp</span>
                      <span className="font-mono text-red-400 font-extrabold shrink-0 ml-1">+5%</span>
                    </div>

                    <div className="flex items-center justify-between bg-white/5 py-1.5 px-2 rounded-xl border border-white/10 text-[10px] font-bold">
                      <span className="text-white/70 truncate">▶️ YouTube</span>
                      <span className="font-mono text-red-400 font-extrabold shrink-0 ml-1">+5%</span>
                    </div>

                    <div className="flex items-center justify-between bg-white/5 py-1.5 px-2 rounded-xl border border-white/10 text-[10px] font-bold">
                      <span className="text-white/70 truncate">📘 Facebook</span>
                      <span className="font-mono text-red-400 font-extrabold shrink-0 ml-1">+5%</span>
                    </div>

                    <div className="flex items-center justify-between bg-white/5 py-1.5 px-2 rounded-xl border border-white/10 text-[10px] font-bold">
                      <span className="text-white/70 truncate">📱 Feed</span>
                      <span className="font-mono text-red-400 font-extrabold shrink-0 ml-1">+5%</span>
                    </div>

                    <div className="flex items-center justify-between bg-white/5 py-1.5 px-2 rounded-xl border border-white/10 text-[10px] font-bold">
                      <span className="text-white/70 truncate">❤️ Like</span>
                      <span className="font-mono text-red-400 font-extrabold shrink-0 ml-1">+5%</span>
                    </div>

                    <div className="flex items-center justify-between bg-white/5 py-1.5 px-2 rounded-xl border border-white/10 text-[10px] font-bold">
                      <span className="text-white/70 truncate">📶 Wi-Fi</span>
                      <span className="font-mono text-red-400 font-extrabold shrink-0 ml-1">+5%</span>
                    </div>

                    <div className="flex items-center justify-between bg-white/5 py-1.5 px-2 rounded-xl border border-white/10 text-[10px] font-bold">
                      <span className="text-white/70 truncate">📐 Geométrico</span>
                      <span className="font-mono text-red-400 font-extrabold shrink-0 ml-1">+5%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 2: CODE & ARCHITECTURE VIEWER --- */}
        {activeTab === 'code' && <LuauCodeViewer />}

        {/* --- TAB 3: ROBLOX STUDIO SETUP GUIDE --- */}
        {activeTab === 'guide' && <RobloxSetupGuide />}

        {/* --- TAB 4: FOMO SCIENTIFIC ANALYTICS --- */}
        {activeTab === 'analytics' && <FomoAnalytics />}
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#050508]/90 border-t border-white/10 py-6 px-4 text-center text-xs text-white/50 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 font-medium text-white/70">
            <ShieldCheck className="w-4 h-4 text-cyan-400" /> Projeto Educacional Entre redes há ansiedade
          </span>
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/30">
            Saúde e Bem-estar Digital
          </span>
        </div>
      </footer>

      {/* Bluetooth Gamepad Config Modal */}
      <GamepadConfigModal
        isOpen={isGamepadModalOpen}
        onClose={() => setIsGamepadModalOpen(false)}
        config={gamepadConfig}
        onUpdateConfig={setGamepadConfig}
      />

      {/* QR Code Pop-up Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-2xl flex justify-center items-center overflow-y-auto p-4 py-8">
          <div className="bg-[#090d16] border-2 border-cyan-400/40 rounded-[36px] p-6 sm:p-8 max-w-md w-full relative shadow-[0_0_50px_rgba(34,211,238,0.25)] space-y-4 my-auto">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <span className="text-[10px] font-black text-cyan-300 tracking-[0.3em] uppercase block">
                Acesso Rápido Mobile / Compartilhamento
              </span>
              <h3 className="text-xl font-bold text-white uppercase">
                Entre Redes Há Ansiedade
              </h3>
            </div>

            <QRCodeCard url="https://sobrecarga-digital.ai.studio" title="Acesso Rápido ao Simulador" />
          </div>
        </div>
      )}

      {/* Informações sobre o Estudo Modal */}
      {showStudyModal && (
        <div className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-2xl flex justify-center items-center overflow-y-auto p-4 py-8">
          <div className="bg-[#090d16] border-2 border-cyan-400/40 rounded-[32px] p-6 sm:p-8 max-w-2xl w-full relative shadow-[0_0_50px_rgba(34,211,238,0.25)] space-y-6 text-white max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 my-auto">
            <button
              onClick={() => setShowStudyModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex flex-col items-center text-center gap-3 pb-4 border-b border-white/10">
              <div className="p-2.5 bg-cyan-400/10 border border-cyan-400/30 rounded-xl text-cyan-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase block mb-0.5">Módulo de Pesquisa & Diagnóstico</span>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight">Cruzamento Científico: FOMO e Sobrecarga Digital</h3>
              </div>
            </div>

            {/* Content Body */}
            <div className="space-y-6 text-sm leading-relaxed text-white/80 text-center">
              
              {/* Section 1 */}
              <section className="space-y-2.5">
                <h4 className="text-xs font-black text-cyan-300 uppercase tracking-wider flex items-center justify-center gap-1.5 font-mono">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                  1. Metodologia do Estudo de Caso
                </h4>
                <div className="bg-black/30 border border-white/5 p-4 rounded-xl space-y-3.5 text-xs text-center flex flex-col items-center">
                  <p className="max-w-prose text-slate-200">
                    O estudo investiga o impacto psicofisiológico da dependência de dispositivos móveis através de variáveis coletadas em tempo real durante o jogo.
                  </p>
                  <ul className="text-left space-y-2 text-slate-300 max-w-md mx-auto">
                    <li className="flex items-start gap-2.5">
                      <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
                      <span><strong>Análise de Input Ativo</strong>: Coleta de respostas (SIM/NÃO) baseadas na escala clínica adaptada SAS-SMU para medir impulsividade.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
                      <span><strong>Monitoramento de Locomoção (WalkSpeed)</strong>: O acúmulo de ansiedade virtual reduz dinamicamente a velocidade operacional do avatar de 16 u/s para 8 u/s.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
                      <span><strong>Taxa de Sobrevivência</strong>: Avaliação estatística da colisão contra notificações e estímulos em tempo real de acordo com o nível de ansiedade.</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 2 */}
              <section className="space-y-2.5">
                <h4 className="text-xs font-black text-cyan-300 uppercase tracking-wider flex items-center justify-center gap-1.5 font-mono">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                  2. Classificação de Perfis (Índice SAS-SMU)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="bg-emerald-500/5 border border-emerald-500/20 p-3.5 rounded-xl text-center space-y-1.5">
                    <span className="text-[10px] font-black bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Resiliente Digital
                    </span>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      Baixo índice de dependência (&lt; 30% afirmativas). Autocontrole saudável sobre notificações e urgência.
                    </p>
                  </div>

                  <div className="bg-amber-500/5 border border-amber-500/20 p-3.5 rounded-xl text-center space-y-1.5">
                    <span className="text-[10px] font-black bg-amber-500/20 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Uso Moderado
                    </span>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      Índice intermediário (30% a 59% afirmativas). Vulnerabilidade ocasional e estresse leve sob alertas constantes.
                    </p>
                  </div>

                  <div className="bg-red-500/5 border border-red-500/20 p-3.5 rounded-xl text-center space-y-1.5">
                    <span className="text-[10px] font-black bg-red-500/20 border border-red-500/30 text-red-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Hiperconectado
                    </span>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      Alto índice de dependência (&ge; 60% afirmativas). Alta ansiedade social (FOMO) e dependência operacional de estímulos.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 3 */}
              <section className="space-y-2.5">
                <h4 className="text-xs font-black text-cyan-300 uppercase tracking-wider flex items-center justify-center gap-1.5 font-mono">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                  3. Jovens Idealizadores & Alunos-Pesquisadores (Turma 61)
                </h4>
                <div className="bg-black/30 border border-white/5 p-4 rounded-xl text-xs space-y-3.5 flex flex-col items-center">
                  <p className="max-w-prose text-slate-200">
                    Este estudo científico e pedagógico foi integralmente idealizado e desenvolvido por alunos-pesquisadores com foco no mapeamento e conscientização sobre a sobrecarga digital em ambientes escolares.
                  </p>
                  
                  {/* Image Frame Container */}
                  <div className="relative max-w-lg w-full bg-[#050811] border border-white/10 rounded-2xl overflow-hidden p-2.5 shadow-2xl">
                    <img
                      src={researchersImage}
                      alt="Jovens Idealizadores e Pesquisadores"
                      className="w-full h-auto rounded-xl border border-white/5 object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <div className="mt-2.5 text-center text-[10px] text-slate-400 font-medium">
                      Turma 61 • Infográfico Oficial de Idealizadores da Pesquisa Científica
                    </div>
                  </div>
                </div>
              </section>

              {/* Extra explanation */}
              <div className="bg-cyan-500/5 border border-cyan-500/10 p-4 rounded-xl text-xs text-cyan-200 text-center">
                O cruzamento científico ajuda a identificar como a sobrecarga informativa digital afeta de modo empírico a atenção sustentada, a cognição espacial e o bem-estar psicológico.
              </div>

            </div>

            {/* Footer buttons */}
            <div className="pt-4 border-t border-white/10 flex justify-center items-center gap-4 flex-wrap">
              <button
                onClick={downloadStudyTxt}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-cyan-400/40 font-bold text-xs tracking-wider uppercase rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                title="Fazer o download do Estudo de Caso em formato TXT"
              >
                <Download className="w-4.5 h-4.5 text-cyan-400" /> Baixar Estudo (.txt)
              </button>

              <button
                onClick={() => setShowStudyModal(false)}
                className="px-6 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)] cursor-pointer"
              >
                Compreendi o Estudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
