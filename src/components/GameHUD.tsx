import React, { useState, useEffect, useRef } from 'react';
import { GameState, SASQuestion, GameSettings, PlayerProfile, CollectedCase, GamepadConfig } from '../types';
import { ShieldCheck, HeartPulse, Sparkles, RefreshCw, Clock, Volume2, VolumeX, Award, Maximize, Minimize, Smartphone, Pause, Play, Instagram, Settings, Coins, User, FileText, Download, BarChart3, CheckCircle2, Store, Gamepad } from 'lucide-react';
import { speakQuestion, playNotificationPopSFX, playButtonClickSFX } from '../utils/audio';
import { QRCodeCard } from './QRCodeCard';
import { getEvaluationReliability } from '../data/sasQuestions';
import { exportSingleCaseDossierTxt } from '../utils/caseStorage';
import researchersImage from '../assets/images/pesquisadores_1787106642560.jpg';
import instagramLogo from '../assets/images/entreredes_logo_1787106204844.jpg';
import goldTrophyImage from '../assets/images/gold_trophy_1787171556924.jpg'; // NEW
import { motion } from 'motion/react'; // NEW
import { CylindricalJoystickButton } from './CylindricalJoystickButton';
import { useLanguage } from '../i18n/LanguageContext';

interface GameHUDProps {
  gameState: GameState;
  gameTimer: number;
  anxietyLevel: number;
  notificationSpeed: number;
  anxietyMultiplier?: number;
  lastChoiceFeedback?: { type: 'SIM' | 'NAO'; message: string } | null;
  currentQuestion: SASQuestion | null;
  sessionAnswers?: Array<{ question: string; answer: 'SIM' | 'NÃO'; category?: string; timeTrigger: number }>;
  zenTriggerReason?: string | null;
  isLandscape?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onTogglePause?: () => void;
  onToggleSound?: () => void;
  onAnswerSAS: (choiceSim: boolean) => void;
  onFinishEvaluation?: () => void;
  onRestart: () => void;
  onMovePlayer: (direction: -1 | 1) => void;
  onSetMovingLeft?: (active: boolean) => void;
  onSetMovingRight?: (active: boolean) => void;
  onSetJumping?: (active: boolean) => void;
  onSetCrouching?: (active: boolean) => void;
  soundEnabled?: boolean;
  wellnessCount?: number;
  goldCoinsCount?: number;
  hasGoldTrophy?: boolean;
  onOpenControlPanel?: () => void;
  gameSettings?: GameSettings;
  graceTimer?: number | null;
  playerProfile?: PlayerProfile;
  onOpenPlayerProfileModal?: () => void;
  onViewInAnalytics?: () => void;
  lastSavedCase?: CollectedCase | null;
  medicineSideEffectsActive?: boolean;
  medicineRemainingSeconds?: number;
  onOpenShop?: () => void;
  onOpenHistory?: () => void;
  gamepadConfig?: GamepadConfig;
  onlineUsersCount?: number;
  onUpdateSettings?: (newSettings: Partial<GameSettings>) => void;
  selectedCharacter?: string;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  gameState,
  gameTimer,
  anxietyLevel,
  notificationSpeed,
  anxietyMultiplier = 1.0,
  lastChoiceFeedback,
  currentQuestion,
  sessionAnswers = [],
  zenTriggerReason,
  isLandscape = false,
  isFullscreen = false,
  onToggleFullscreen,
  onTogglePause,
  onToggleSound,
  onAnswerSAS,
  onFinishEvaluation,
  onRestart,
  onMovePlayer,
  onSetMovingLeft,
  onSetMovingRight,
  onSetJumping,
  onSetCrouching,
  soundEnabled = true,
  wellnessCount = 0,
  goldCoinsCount = 0,
  hasGoldTrophy = false,
  onOpenControlPanel,
  gameSettings,
  graceTimer = null,
  playerProfile,
  onOpenPlayerProfileModal,
  onViewInAnalytics,
  lastSavedCase = null,
  medicineSideEffectsActive = false,
  medicineRemainingSeconds = 0,
  onOpenShop,
  onOpenHistory,
  gamepadConfig,
  onlineUsersCount = 1,
  onUpdateSettings,
  selectedCharacter = 'guto',
}) => {
  const { language, t, getLocalizedQuestion } = useLanguage();
  const touchStartY = useRef<number | null>(null);
  const [fps, setFps] = React.useState<number>(60);
  const frameCountRef = useRef<number>(0);
  const lastFpsTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    if (!gameSettings?.showFPSCounter) return;
    let animId: number;
    const calcFps = () => {
      frameCountRef.current += 1;
      const now = performance.now();
      if (now - lastFpsTimeRef.current >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / (now - lastFpsTimeRef.current)));
        frameCountRef.current = 0;
        lastFpsTimeRef.current = now;
      }
      animId = requestAnimationFrame(calcFps);
    };
    animId = requestAnimationFrame(calcFps);
    return () => cancelAnimationFrame(animId);
  }, [gameSettings?.showFPSCounter]);

  // Immediate visual dismissal of question card to eliminate any perceived click latency
  const [isQuestionLocallyDismissed, setIsQuestionLocallyDismissed] = useState<boolean>(false);
  const hasAnsweredCurrentRef = useRef<boolean>(false);

  useEffect(() => {
    setIsQuestionLocallyDismissed(false);
    hasAnsweredCurrentRef.current = false;
  }, [currentQuestion]);

  const handleInstantAnswer = (choiceSim: boolean) => {
    if (hasAnsweredCurrentRef.current) return;
    hasAnsweredCurrentRef.current = true;
    setIsQuestionLocallyDismissed(true);
    playButtonClickSFX(soundEnabled);
    onAnswerSAS(choiceSim);
  };
  
  const handleTouchStart = (e: React.TouchEvent, moveAction: (active: boolean) => void) => {
    e.preventDefault();
    moveAction(true);
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const diffY = touchStartY.current - currentY; // positive = up, negative = down
    
    if (diffY > 30) {
      // Swipe Up
      onSetJumping?.(true);
      onSetCrouching?.(false);
    } else if (diffY < -30) {
      // Swipe Down
      onSetCrouching?.(true);
      onSetJumping?.(false);
    } else {
      // Return to neutral
      onSetJumping?.(false);
      onSetCrouching?.(false);
    }
  };

  const handleTouchEnd = (moveAction: (active: boolean) => void) => {
    moveAction(false);
    onSetJumping?.(false);
    onSetCrouching?.(false);
    touchStartY.current = null;
  };
  // Track notification pop-ups presence to play alert sounds on disappearance
  const prevPopupsRef = useRef<{ p1: boolean; p2: boolean; p3: boolean; p4: boolean; p5: boolean }>({
    p1: false,
    p2: false,
    p3: false,
    p4: false,
    p5: false,
  });

  useEffect(() => {
    if (gameState !== 'PLAYING' && gameState !== 'MODO_ZEN') {
      prevPopupsRef.current = { p1: false, p2: false, p3: false, p4: false, p5: false };
      return;
    }

    const currentPopups = {
      p1: anxietyLevel >= 25,
      p2: anxietyLevel >= 40,
      p3: anxietyLevel >= 60,
      p4: anxietyLevel >= 75,
      p5: anxietyLevel >= 85,
    };

    const prev = prevPopupsRef.current;
    
    // Check if any active pop-up notification disappeared (changed from true to false)
    const anyDisappeared = 
      (prev.p1 && !currentPopups.p1) ||
      (prev.p2 && !currentPopups.p2) ||
      (prev.p3 && !currentPopups.p3) ||
      (prev.p4 && !currentPopups.p4) ||
      (prev.p5 && !currentPopups.p5);

    if (anyDisappeared) {
      playNotificationPopSFX(soundEnabled);
    }

    prevPopupsRef.current = currentPopups;
  }, [gameState, anxietyLevel, soundEnabled]);

  const getDiagnostic = (val: number, state: GameState) => {
    if (state === 'DERROTA' || val >= 100) {
      return {
        title: 'COLAPSO DIGITAL (100%) - GAME OVER',
        badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40',
        desc: 'Seu nível de ansiedade atingiu o limite crítico. O fluxo ininterrupto de notificações e telas sobrecarregou sua mente. Priorize pausas de desconexão e exercícios.',
        recs: [
          'Pratique atividades ao ar livre diariamente.',
          'Realize exercícios físicos para liberar endorfina e diminuir a tensão.',
          'Pratique a desconexão programada 1h antes de dormir.',
        ],
      };
    }
    if (val < 40) {
      return {
        title: `ESTRESSE BAIXO (${val}%)`,
        badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
        desc: 'Excelente equilíbrio digital! Ao praticar a desconexão, exercícios e atividades ao ar livre, você ativou o Modo Zen e dominou o estresse.',
        recs: [
          'Mantenha a rotina de exercícios físicos e contato com a natureza.',
          'Preserve momentos diários sem celular para consolidar a paz mental.',
        ],
      };
    }
    if (val <= 70) {
      return {
        title: `ESTRESSE MODERADO (${val}%)`,
        badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
        desc: 'Atenção moderada. Você conseguiu resistir à sobrecarga usando pausas e momentos de bem-estar, mas acumulo certo estresse.',
        recs: [
          'Aumente a frequência de exercícios físicos durante a semana.',
          'Substitua o uso noturno de redes sociais por atividades ao ar livre ou leitura.',
        ],
      };
    }
    return {
      title: `ESTRESSE ALTO (${val}%)`,
      badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
      desc: 'Nível limítrofe de sobrecarga! Sua mente esteve perto do colapso. Fortaleça hábitos de desconexão e movimento físico.',
      recs: [
        'Faça um detox digital no final de semana.',
        'Pratique esportes ou caminhadas ao ar livre para restaurar a atenção.',
      ],
    };
  };

  const diag = getDiagnostic(anxietyLevel, gameState);

  // Psychometric Evaluation Calculation from Session Answers (Compact)
  const sasTotal = sessionAnswers.length;
  const sasSimCount = sessionAnswers.filter((a) => a.answer === 'SIM').length;
  const sasPercent = sasTotal > 0 ? Math.round((sasSimCount / sasTotal) * 100) : 0;

  let sasEvaluationLabel = 'Resiliente Digital';
  let sasEvaluationColor = 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40';
  let sasEvaluationDesc = 'Ótimo autocontrole, hábitos de desconexão saudáveis e baixa ansiedade social.';

  if (sasPercent >= 60) {
    sasEvaluationLabel = 'Hiperconectado';
    sasEvaluationColor = 'text-red-400 bg-red-500/20 border-red-500/40';
    sasEvaluationDesc = 'Alta vulnerabilidade ao FOMO, necessidade impulsiva de checar notificações e dependência digital.';
  } else if (sasPercent >= 30) {
    sasEvaluationLabel = 'Uso Moderado';
    sasEvaluationColor = 'text-amber-400 bg-amber-500/20 border-amber-500/40';
    sasEvaluationDesc = 'Atenção intermediária ao FOMO e estresse ocasional com notificações sociais.';
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 sm:p-8 select-none font-sans">
      {/* --- TOP BAR (SLEEK INTERFACE HEADERS) --- */}
      <div className="flex justify-between items-start w-full gap-4">
        {/* Left Status Indicator */}
        <div className="pointer-events-auto flex flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase flex items-center gap-1.5 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              🟢 {onlineUsersCount} {onlineUsersCount === 1 ? 'Usuário Online' : 'Usuários Online'}
            </span>
          </div>
          {!gameSettings?.hideTrophiesScoreCard && (
            <div className="flex flex-col gap-1.5">
            {/* Player Profile & Small Beneficial Items Score Counter */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl backdrop-blur-md w-fit shadow-lg">
                <span className="text-xs font-black text-emerald-400">🌿 Pontos Bem-Estar:</span>
                <span className="text-sm font-mono font-extrabold text-emerald-300">+{wellnessCount} pts</span>
              </div>
              {gameSettings?.enableGoldCoins !== false && (
                <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-400/40 px-3 py-1 rounded-xl backdrop-blur-md w-fit shadow-lg animate-pulse">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black text-amber-300">Moedas / Saldo:</span>
                  <span className="text-sm font-mono font-extrabold text-amber-200">
                    {goldCoinsCount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              )}
              {medicineSideEffectsActive && (
                <div className="flex items-center gap-1.5 bg-rose-500/20 border border-rose-500/40 px-3 py-1 rounded-xl backdrop-blur-md w-fit shadow-lg animate-pulse">
                  <span className="text-xs animate-bounce">😴</span>
                  <span className="text-xs font-black text-rose-300">Efeitos Colaterais:</span>
                  <span className="text-[10px] font-bold text-rose-200 uppercase tracking-wider">
                    Lentidão ({Math.floor((medicineRemainingSeconds || 0) / 60)}:{String((medicineRemainingSeconds || 0) % 60).padStart(2, '0')})
                  </span>
                </div>
              )}
            </div>
              {hasGoldTrophy && (
                <motion.div
                  initial={{ rotateY: 0 }}
                  animate={{ rotateY: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1 rounded-xl backdrop-blur-md w-fit shadow-lg"
                >
                  <img src={goldTrophyImage} alt="Troféu de Ouro" className="w-6 h-6 animate-pulse" />
                  <span className="text-xs font-black text-yellow-400">TROFÉU DE OURO!</span>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Center Tempo de Jogo */}
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="flex flex-col items-center gap-1 bg-black/40 border border-white/10 backdrop-blur-xl p-2 sm:p-2.5 rounded-xl shadow-xl">
            <div className="text-[9px] font-bold text-cyan-300 tracking-widest uppercase flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" /> Tempo de Jogo
            </div>
            <div className="text-base sm:text-[22px] font-mono text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              {String(Math.floor(Math.max(0, gameTimer) / 60)).padStart(2, '0')}:{String(Math.max(0, gameTimer) % 60).padStart(2, '0')}
            </div>
          </div>

          {gameSettings?.showFPSCounter && (
            <div className="flex flex-col items-center justify-center bg-black/60 border border-emerald-500/40 backdrop-blur-xl px-3 py-2 rounded-xl shadow-xl">
              <span className="text-[8px] font-black text-emerald-400 tracking-widest uppercase">Estatísticas</span>
              <span className="text-sm font-mono font-bold text-emerald-300">{fps} FPS</span>
            </div>
          )}
        </div>

        {/* Right Anxiety Bar & Speed Metrics */}
        {!gameSettings?.hideAnxietySpeedCard && (
          <div className="pointer-events-auto flex flex-col items-end gap-2.5 w-64 sm:w-80">
            <div className="flex justify-between w-full px-1 items-center">
              <span className="text-xs font-bold tracking-widest uppercase text-red-400 flex items-center gap-1">
                <HeartPulse className="w-3.5 h-3.5 animate-pulse" /> Nível de Ansiedade
              </span>
              <div className="flex items-center gap-2">
                {anxietyMultiplier > 1.0 && (
                  <span className="bg-red-500/20 border border-red-500/40 text-red-400 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]">
                    🔥 {anxietyMultiplier.toFixed(1)}x MULT.
                  </span>
                )}
                <span className="text-xs font-mono font-bold text-red-400">{anxietyLevel}%</span>
              </div>
            </div>

            <div className="w-full h-4 bg-gray-900 rounded-full border border-white/10 p-[2px] shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-green-500 via-orange-500 to-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, anxietyLevel))}%` }}
              />
            </div>

            <div className="flex gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase opacity-40 font-bold tracking-widest">Velocidade</span>
                <span className="text-sm font-mono text-cyan-400 font-bold">{notificationSpeed.toFixed(1)}x</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase opacity-40 font-bold tracking-widest">Modo Ativo</span>
                <span className="text-sm font-mono text-white italic">
                  {gameState === 'MODO_ZEN' ? 'MODO ZEN' : 'PADRÃO'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- TOP CENTRAL OVERLAYS (Immunity & Interaction Feedback) --- */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[50] flex flex-col items-center gap-2.5 pointer-events-none">
        {/* CRITICAL GRACE PERIOD COUNTDOWN BANNER (60 SECONDS TO SAVE OR GAME OVER) */}
        {graceTimer !== null && (
          <div className="pointer-events-auto px-6 py-3.5 bg-red-950/95 border border-red-500/60 rounded-3xl backdrop-blur-2xl shadow-[0_0_35px_rgba(239,68,68,0.85)] text-center flex flex-col items-center gap-1 animate-pulse">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-red-400 animate-spin" />
              <span className="text-[10px] font-black tracking-widest text-red-300 uppercase">
                {sessionAnswers.length < 10 ? '🛡️ IMUNIDADE DE AVALIAÇÃO ATIVA' : '🚨 COLAPSO IMINENTE • DESCONECTE JÁ!'}
              </span>
            </div>
            <span className="text-2xl font-mono font-black text-red-500 tracking-wider">
              {graceTimer}s
            </span>
            <span className="text-[6px] font-bold text-red-400 uppercase tracking-widest">
              {sessionAnswers.length < 10 
                ? `Responda mais ${10 - sessionAnswers.length} pergunta(s) para habilitar o término!`
                : 'Colete itens de bem-estar para baixar a ansiedade!'}
            </span>
          </div>
        )}

        {/* IMMEDIATE SAS CHOICE FEEDBACK BANNER (Interaction Label) */}
        {lastChoiceFeedback && (
          <div className={`pointer-events-auto px-6 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl animate-fade-in flex items-center gap-2 font-bold text-[8px] uppercase tracking-wider ${
            lastChoiceFeedback.type === 'SIM'
              ? 'bg-red-500/20 border-red-500/50 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
              : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
          }`}>
            {lastChoiceFeedback.message}
          </div>
        )}
      </div>

      {/* --- FLASHING POP-UPS OVERLAY (SCALES WITH ANSIETY LEVEL) --- */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED_SAS' || gameState === 'MODO_ZEN') && anxietyLevel > 5 && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-20">
          {/* Pop-up 1: Lower Left (Base) */}
          {anxietyLevel > 15 && (
            <div className="absolute bottom-[100px] sm:bottom-[134px] md:bottom-[169px] left-6 bg-red-950/80 border border-red-500/60 text-red-300 px-3 py-1.5 rounded-xl text-[6px] font-bold tracking-wider uppercase animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              ⚠️ +1 NOTIFICAÇÃO PENDENTE
            </div>
          )}

          {/* Pop-up 2: Lower Right (Base) */}
          {anxietyLevel > 35 && (
            <div className="absolute bottom-[100px] sm:bottom-[134px] md:bottom-[169px] right-6 bg-purple-950/80 border border-purple-500/60 text-purple-300 px-3 py-1.5 rounded-xl text-[6px] font-bold tracking-wider uppercase animate-bounce shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              ❤️ NOVO LIKE NO FEED!
            </div>
          )}

          {/* Pop-up 3: Lower Right Stacked 1 */}
          {anxietyLevel > 55 && (
            <div className="absolute bottom-[140px] sm:bottom-[174px] md:bottom-[209px] right-6 bg-amber-950/80 border border-amber-500/60 text-amber-300 px-3.5 py-2 rounded-xl text-[6px] font-bold tracking-wider uppercase animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.5)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              🔥 FEED ATUALIZADO • VEJA AGORA
            </div>
          )}

          {/* Pop-up 4: Lower Left Stacked 1 */}
          {anxietyLevel > 75 && (
            <div className="absolute bottom-[140px] sm:bottom-[174px] md:bottom-[209px] left-6 bg-red-900/90 border-2 border-red-500 text-white px-4 py-2.5 rounded-2xl text-[8px] font-black tracking-widest uppercase animate-bounce shadow-[0_0_30px_rgba(239,68,68,0.8)] flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400 animate-ping" />
              🚨 SOBRECARGA DIGITAL CRÍTICA!
            </div>
          )}

          {/* Pop-up 5: Lower Right Stacked 2 */}
          {anxietyLevel > 90 && (
            <div className="absolute bottom-[185px] sm:bottom-[219px] md:bottom-[254px] right-6 bg-rose-950/90 border-2 border-rose-500 text-rose-200 px-4 py-2.5 rounded-2xl text-[8px] font-black tracking-widest uppercase animate-pulse shadow-[0_0_35px_rgba(244,63,94,0.9)] flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-400 animate-ping" />
              ⚡ +99 MENSAGENS NÃO LIDAS!
            </div>
          )}
        </div>
      )}

      {/* --- MODO ZEN BANNER --- */}
      {gameState === 'MODO_ZEN' && (
        <div className="pointer-events-auto fixed bottom-[100px] sm:bottom-[134px] md:bottom-[169px] left-1/2 -translate-x-1/2 z-[40] bg-cyan-500/10 border border-cyan-400/30 backdrop-blur-2xl px-8 py-3.5 rounded-full shadow-[0_0_30px_rgba(34,211,238,0.4)] animate-bounce text-center flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-yellow-300 animate-spin" />
          <div className="flex flex-col items-center">
            <span className="text-[14px] font-black tracking-[0.3em] uppercase text-cyan-300">
              MODO ZEN ATIVO
            </span>
            {zenTriggerReason && (
              <span className="text-[6px] font-mono tracking-widest text-emerald-300 uppercase">
                {zenTriggerReason}
              </span>
            )}
          </div>
          <Sparkles className="w-6 h-6 text-yellow-300 animate-spin" />
        </div>
      )}

      {/* --- SLEEK SAS QUESTION MODAL (SYSTEM EVALUATION - TRANSPARENT OVERLAY) --- */}
      {gameState === 'PAUSED_SAS' && currentQuestion && !isQuestionLocallyDismissed && (
        <div className="fixed inset-0 z-[10000] bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto">
          <div className="w-[540px] max-w-full bg-[#090d16]/30 border-2 border-cyan-400/50 rounded-[32px] p-6 sm:p-8 flex flex-col items-center gap-5 sm:gap-6 shadow-[0_0_50px_rgba(34,211,238,0.3)] relative overflow-hidden text-white max-h-[90vh] overflow-y-auto backdrop-blur-md">
            {/* Top Cyan Accent Line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <div className="px-4 py-1 bg-cyan-400/20 rounded-full border border-cyan-400/30">
                  <span className="text-[10px] font-black text-cyan-300 tracking-[0.3em] uppercase">
                    {t('hud.sasQuestion')} nº {sessionAnswers.length + 1} • {currentQuestion.timeTrigger}s
                  </span>
                </div>
                {currentQuestion.category && (
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-wider ${
                    currentQuestion.category === 'CRITICO'
                      ? 'bg-red-500/20 border-red-500/40 text-red-300'
                      : currentQuestion.category === 'ALTO'
                      ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                      : currentQuestion.category === 'MEDIO'
                      ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
                      : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  }`}>
                    {currentQuestion.category === 'CRITICO'
                      ? t('hud.criticalCategory')
                      : currentQuestion.category === 'ALTO'
                      ? t('hud.highCategory')
                      : currentQuestion.category === 'MEDIO'
                      ? t('hud.mediumCategory')
                      : t('hud.lowCategory')}
                  </span>
                )}
                {!gameSettings?.hideQuestionTTSCard && (
                  <button
                    onClick={() => {
                      const qText = getLocalizedQuestion(currentQuestion.id || 0, currentQuestion.question);
                      speakQuestion(qText, true, {
                        voiceURI: gameSettings?.ttsVoiceURI,
                        pitch: gameSettings?.ttsPitch,
                        rate: gameSettings?.ttsRate,
                      }, language);
                    }}
                    className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 rounded-full text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(34,211,238,0.3)] active:scale-95 cursor-pointer"
                    title="Audio"
                  >
                    <Volume2 className="w-3.5 h-3.5 animate-pulse text-cyan-300" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">
                      {language === 'es' ? 'Escuchar' : language === 'en' ? 'Listen' : language === 'de' ? 'Anhören' : 'Ouvir Pergunta'}
                    </span>
                  </button>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-medium text-center leading-tight max-w-[440px]">
                {getLocalizedQuestion(currentQuestion.id || 0, currentQuestion.question)}
              </h2>
            </div>

            {/* SIM / NÃO Action Grid */}
            <div className="flex gap-4 sm:gap-6 w-full px-2 sm:px-4">
              <div className="flex-1 flex flex-col items-center gap-3">
                <button
                  id="demo-btn-sim"
                  onClick={() => handleInstantAnswer(true)}
                  onPointerDown={() => handleInstantAnswer(true)}
                  className="w-full py-5 sm:py-6 bg-gradient-to-b from-red-500/30 via-red-600/40 to-red-700/50 hover:from-red-500/40 hover:to-red-600/50 border-2 border-red-400/80 border-b-[6px] border-b-red-700 rounded-2xl flex flex-col items-center justify-center transition-all duration-75 ease-out cursor-pointer transform active:translate-y-[4px] active:border-b-[2px] active:scale-[0.97] active:shadow-inner group shadow-[0_8px_25px_rgba(239,68,68,0.4)] select-none touch-manipulation"
                >
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-active:scale-95 transition-transform">
                    {t('hud.yes')}
                  </span>
                </button>
              </div>

              <div className="flex-1 flex flex-col items-center gap-3">
                <button
                  id="demo-btn-nao"
                  onClick={() => handleInstantAnswer(false)}
                  onPointerDown={() => handleInstantAnswer(false)}
                  className="w-full py-5 sm:py-6 bg-gradient-to-b from-emerald-500/30 via-emerald-600/40 to-emerald-700/50 hover:from-emerald-500/40 hover:to-emerald-600/50 border-2 border-emerald-400/80 border-b-[6px] border-b-emerald-700 rounded-2xl flex flex-col items-center justify-center transition-all duration-75 ease-out cursor-pointer transform active:translate-y-[4px] active:border-b-[2px] active:scale-[0.97] active:shadow-inner group shadow-[0_8px_25px_rgba(16,185,129,0.4)] select-none touch-manipulation"
                >
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-active:scale-95 transition-transform">
                    {t('hud.no')}
                  </span>
                </button>
              </div>
            </div>

            {/* Pure Evaluation Purpose Pill & Precision Note */}
            <div className="bg-black/30 px-5 py-2.5 rounded-2xl border border-cyan-400/30 flex items-center justify-center gap-2 text-center max-w-[480px]">
              <span className="text-[10px] sm:text-xs text-cyan-300 font-medium tracking-wide leading-relaxed">
                📋 <strong className="font-bold text-white">Precisão do Estudo:</strong> Quanto mais perguntas respondidas, maior é a confiabilidade do diagnóstico.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* --- END GAME DIAGNOSTIC MODAL (MODO CHEIO) --- */}
      {(gameState === 'VITORIA' || gameState === 'DERROTA') && (
        <div className="pointer-events-auto fixed inset-0 z-[10000] bg-[#050508] overflow-y-auto backdrop-blur-3xl p-4 sm:p-8 md:p-12 text-white overscroll-contain">
          <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 font-sans animate-fade-in my-4 sm:my-8 pb-40">
            
            {/* Header / Brand Title */}
            <div className="flex flex-col sm:flex-row justify-between items-center border-b border-white/10 pb-6 gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xl shrink-0 ${
                    gameState === 'VITORIA'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  }`}
                >
                  {gameState === 'VITORIA' ? (
                    <ShieldCheck className="w-6 h-6" />
                  ) : (
                    <HeartPulse className="w-6 h-6 animate-pulse" />
                  )}
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase block mb-0.5">Estudo Clínico Adaptativo</span>
                  <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                    Entre redes <span className="text-cyan-400">há ansiedade</span>
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`inline-block text-[10px] font-bold px-3 py-1.5 rounded-full border uppercase tracking-widest ${diag.badgeColor}`}>
                  {gameState === 'VITORIA' ? 'Sobreviveu à Sobrecarga' : 'Colapso Digital - GAME OVER'}
                </span>
              </div>
            </div>

            {/* Main Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Side: Diagnostic Outcome and Recommendations */}
              <div className="lg:col-span-7 flex flex-col gap-6 text-left">
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-3 shadow-xl">
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block">Resultado do Diagnóstico</span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                    {diag.title}
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed pt-2">
                    {diag.desc}
                  </p>
                </div>

                {/* Sample Reliability Quality Meter */}
                <div className="bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border border-cyan-400/30 p-6 rounded-3xl space-y-3.5 shadow-xl">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-cyan-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                        Precisão Amostral ({sasTotal} Perguntas)
                      </span>
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider ${getEvaluationReliability(sasTotal).badgeColor}`}>
                      {getEvaluationReliability(sasTotal).level} ({getEvaluationReliability(sasTotal).margin})
                    </span>
                  </div>

                  <div className="w-full h-3 bg-black/60 rounded-full border border-white/10 overflow-hidden p-[2px]">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400 rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(34,211,238,0.6)]"
                      style={{ width: `${getEvaluationReliability(sasTotal).percentage}%` }}
                    />
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {getEvaluationReliability(sasTotal).desc}
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block">
                    💡 Recomendações de Saúde Digital:
                  </span>
                  <ul className="text-sm text-slate-300 space-y-3 list-disc list-inside leading-relaxed">
                    {diag.recs.map((rec, idx) => (
                      <li key={idx} className="marker:text-cyan-400">{rec}</li>
                    ))}
                  </ul>
                </div>

                {/* Play Again Button Moved Above Idealizadores */}
                <div className="flex justify-center pt-2">
                  <button
                    onClick={onRestart}
                    className="w-full max-w-md py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-none font-bold rounded-2xl shadow-xl hover:shadow-[0_0_40px_rgba(34,211,238,0.4)] transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2.5 tracking-widest uppercase text-sm cursor-pointer"
                  >
                    <RefreshCw className="w-5 h-5 animate-spin" /> Jogar Novamente
                  </button>
                </div>

                {/* Dedicated Card for Idealizadores do Projeto */}
                <div className="bg-gradient-to-br from-slate-900 via-sky-950/20 to-slate-900 border border-cyan-500/25 p-5 rounded-3xl space-y-4 shadow-2xl">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                    <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-300">
                      Idealizadores do Projeto
                    </span>
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-5">
                    {/* Beautifully-framed Image of Researchers */}
                    <div className="w-full md:w-2/5 rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_20px_rgba(34,211,238,0.15)] bg-black/40 p-1.5 flex items-center justify-center shrink-0">
                      <img
                        src={researchersImage}
                        alt="Idealizadores do Projeto e Alunos-Pesquisadores - Turma 61"
                        className="w-full h-32 md:h-36 object-contain rounded-xl hover:scale-105 transition-all duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Educational Details and Background */}
                    <div className="flex-1 space-y-2 text-left">
                      <h4 className="text-sm font-black text-white leading-snug uppercase tracking-wide">
                        Alunos-Pesquisadores • Turma 61
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Este simulador interativo faz parte de um projeto de pesquisa voltado ao mapeamento do estresse comportamental, FOMO e dependência digital entre adolescentes.
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-mono">
                        <span>🎓 Escola de Ensino Médio</span>
                        <span>•</span>
                        <span>📊 Mapeamento Comportamental</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grid for Compact QR Code and Instagram Social Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-stretch">
                  {/* Card 1: Compact QR Code Card */}
                  <div className="bg-white/5 border border-white/10 p-3.5 rounded-3xl flex flex-col justify-center text-center gap-2">
                    <QRCodeCard url="https://sobrecarga-digital.ai.studio" title="Entre Redes" compact={true} />
                  </div>

                  {/* Card 2: Siga no Instagram Card */}
                  <a
                    href="https://www.instagram.com/entreredeshaansiedade?igsh=eXR5NXZyNGQ1bzc0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-[#090d16]/60 hover:bg-[#090d16]/90 border border-purple-500/30 hover:border-purple-400/50 p-3.5 rounded-3xl flex items-center justify-between gap-3.5 transition-all duration-300 shadow-xl cursor-pointer hover:scale-[1.01]"
                  >
                    <div className="text-left space-y-0.5">
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block flex items-center gap-1">
                        <Instagram className="w-3.5 h-3.5 text-purple-400" /> Siga no Instagram
                      </span>
                      <p className="text-xs font-bold text-white">
                        @entreredeshaansiedade
                      </p>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        Discussões e conscientização de saúde digital!
                      </p>
                    </div>

                    <div className="relative w-14 h-14 rounded-full overflow-hidden border border-white/10 group-hover:border-purple-400/60 shadow-md transition-all shrink-0">
                      <img
                        src={instagramLogo}
                        alt="Siga no Instagram - Entre Redes Há Ansiedade?"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </a>
                </div>
              </div>

              {/* Right Side: SAS-SMU Psychometric Evaluation & Case Collection Dossier */}
              <div className="lg:col-span-5 flex flex-col gap-6 text-left">
                
                {/* Dedicated Card: Ficha de Coleta de Caso Registrada */}
                {lastSavedCase && (
                  <div className="bg-gradient-to-br from-[#090d16] via-cyan-950/20 to-[#090d16] border-2 border-cyan-400/40 p-5 rounded-3xl space-y-4 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3 gap-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-cyan-400" />
                        <div>
                          <span className="text-[9px] text-cyan-400 font-mono tracking-widest uppercase block">Registro de Pesquisa</span>
                          <h4 className="text-sm font-black text-white uppercase tracking-tight">
                            Coleta de Caso: {lastSavedCase.id}
                          </h4>
                        </div>
                      </div>
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Registrado
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                        <span className="text-[9px] text-white/50 uppercase font-bold block">Jogador</span>
                        <span className="font-bold text-white block truncate">{lastSavedCase.playerName}</span>
                      </div>
                      <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                        <span className="text-[9px] text-white/50 uppercase font-bold block">Idade / Tela</span>
                        <span className="font-bold text-cyan-300 block truncate">{lastSavedCase.age} • {lastSavedCase.dailyScreenHours}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      {onViewInAnalytics && (
                        <button
                          onClick={onViewInAnalytics}
                          className="flex-1 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                        >
                          <BarChart3 className="w-4 h-4" /> Ver na Coleta de Casos
                        </button>
                      )}
                      <button
                        onClick={() => exportSingleCaseDossierTxt(lastSavedCase)}
                        className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        title="Baixar laudo individual em arquivo texto"
                      >
                        <Download className="w-4 h-4" /> Baixar Laudo
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-[#090d16]/80 border border-cyan-400/30 p-6 rounded-3xl space-y-4 shadow-2xl flex flex-col justify-between">
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest block">Escala Clinica</span>
                        <h3 className="text-lg font-bold text-white">Avaliação SAS-SMU</h3>
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider ${sasEvaluationColor}`}>
                        {sasEvaluationLabel}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 pt-2">
                      <span className="text-4xl font-extrabold font-mono text-cyan-400">{sasPercent}%</span>
                      <span className="text-xs text-slate-400">de respostas afirmativas ({sasSimCount}/{sasTotal})</span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-black/40 p-3.5 rounded-xl border border-white/5">
                      {sasEvaluationDesc}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Perguntas Respondidas durante o teste:</span>
                    {sessionAnswers.length > 0 ? (
                      <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 pr-1">
                        {sessionAnswers.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center gap-3 bg-white/5 border border-white/10 p-2.5 rounded-xl text-xs">
                            <span className="text-slate-300 leading-tight">
                              P{idx + 1}: {item.question}
                            </span>
                            <span className={`font-black px-2 py-0.5 rounded text-[10px] uppercase shrink-0 ${
                              item.answer === 'SIM'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}>
                              {item.answer}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">Nenhuma pergunta respondida nesta sessão.</p>
                    )}
                  </div>

                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* --- PAUSE MODAL OVERLAY --- */}
      {gameState === 'PAUSED' && (
        <div className="fixed inset-0 z-[9999] bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto animate-fade-in">
          <div className="w-[440px] max-w-full bg-[#090d16]/20 border-2 border-amber-400/60 rounded-[32px] p-6 sm:p-8 flex flex-col items-center gap-6 shadow-[0_0_50px_rgba(245,158,11,0.35)] relative text-white text-center backdrop-blur-md">
            {/* Top Amber Accent Line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400/50 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)]">
              <Pause className="w-8 h-8 text-amber-400" />
            </div>

            <div className="flex flex-col gap-1">
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">
                Jogo Pausado
              </h2>
              <p className="text-xs text-slate-400">
                Respire fundo. A partida está congelada no tempo.
              </p>
            </div>

            {/* Quick Metrics Glance */}
            <div className="grid grid-cols-2 gap-3 w-full bg-white/5 border border-white/10 rounded-2xl p-3">
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Tempo Atual</span>
                <span className="text-xl font-mono font-bold text-white">
                  {String(Math.floor(Math.max(0, gameTimer) / 60)).padStart(2, '0')}:{String(Math.max(0, gameTimer) % 60).padStart(2, '0')}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">Ansiedade</span>
                <span className="text-xl font-mono font-bold text-white">{anxietyLevel}%</span>
              </div>
            </div>

            {/* Resume & Restart Buttons */}
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={onTogglePause}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:scale-102 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-white" /> Continuar Partida (P)
              </button>

              <button
                onClick={onRestart}
                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Reiniciar Partida
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- LATERAL SCREEN MOVEMENT CONTROLS (LOCATED ON SIDES OF SCREEN) --- */}
      {(gameState === 'PLAYING' || gameState === 'MODO_ZEN' || gameState === 'PAUSED') && !gameSettings?.hideControlsCard && (
        <>
          {/* Center-placed 'Ver Avaliação do Estudo' panel when at least 10 questions answered */}
          {sessionAnswers.length >= 10 && (
            <div className="pointer-events-auto fixed bottom-[100px] sm:bottom-[134px] md:bottom-[169px] left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-1.5 w-full max-w-[280px] sm:max-w-[400px] md:max-w-[480px] animate-pulse">
              <button
                onClick={onFinishEvaluation}
                className="w-full py-3 px-5 sm:py-4 sm:px-8 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 hover:from-emerald-400 hover:to-cyan-450 text-white font-black text-xs uppercase tracking-widest rounded-full shadow-[0_0_35px_rgba(34,211,238,0.6)] hover:scale-102 active:scale-95 transition-all flex items-center justify-center gap-2 border border-cyan-300/40 cursor-pointer"
              >
                <ShieldCheck className="w-5 h-5 text-white shrink-0" />
                <span className="truncate">VER AVALIAÇÃO ({sessionAnswers.length} Perguntas)</span>
              </button>
              
              {/* Informative Books / Precision Card */}
              <div className="bg-black/90 w-full px-3 py-1.5 sm:py-2.5 rounded-2xl border border-cyan-400/35 text-center shadow-2xl backdrop-blur-md">
                <span className="text-[9px] sm:text-[11px] text-cyan-300 font-medium tracking-wide leading-relaxed block">
                  📋 <strong>Precisão do Estudo (Livros Informativos):</strong> Quanto mais perguntas respondidas, melhor a avaliação.
                </span>
              </div>
            </div>
          )}

          {/* Left Lateral Controls Group (Esquerda) */}
          <div className={`pointer-events-auto fixed left-2 sm:left-4 md:left-8 bottom-4 sm:bottom-8 md:bottom-12 z-30 flex items-center gap-2 sm:gap-3 md:gap-4 transition-transform duration-300 ${
            gameSettings?.touchButtonsSize === 'pequeno' ? 'scale-85 origin-bottom-left' : gameSettings?.touchButtonsSize === 'grande' ? 'scale-115 origin-bottom-left' : 'scale-100'
          }`}>
            <CylindricalJoystickButton
              direction="left"
              label="ESQUERDA"
              icon="◀"
              colorTheme="cyan"
              size="lg"
              onSetMovingLeft={onSetMovingLeft}
              onSetMovingRight={onSetMovingRight}
              onSetJumping={onSetJumping}
              onSetCrouching={onSetCrouching}
              onMovePlayer={onMovePlayer}
            />
          </div>

          {/* Center Control Buttons Group (Pausa, Áudio, Reinício, Controle, Tela) */}
          <div className={`pointer-events-auto fixed left-1/2 -translate-x-1/2 bottom-4 sm:bottom-8 md:bottom-12 z-30 flex items-center gap-1.5 sm:gap-2.5 md:gap-3 transition-transform duration-300 ${
            gameSettings?.touchButtonsSize === 'pequeno' ? 'scale-85 origin-bottom' : gameSettings?.touchButtonsSize === 'grande' ? 'scale-115 origin-bottom' : 'scale-100'
          }`}>
            <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3 scale-85 origin-bottom">
              {onTogglePause && (
                <button
                  onClick={onTogglePause}
                  onContextMenu={(e) => { e.preventDefault(); }}
                  className={`touch-control-btn w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 ${
                    gameState === 'PAUSED'
                      ? 'bg-amber-500/40 border border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                      : 'bg-black/65 hover:bg-amber-500/20 active:bg-amber-500/50 border border-amber-400/50 hover:border-amber-300 text-amber-300 active:text-white'
                  } rounded-2xl backdrop-blur-xl shadow-lg flex flex-col items-center justify-center select-none active:scale-95 transition-all cursor-pointer group`}
                  title={gameState === 'PAUSED' ? "Continuar Jogo (P)" : "Pausar Jogo (P)"}
                >
                  {gameState === 'PAUSED' ? (
                    <Play className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-300 fill-amber-300/40" />
                  ) : (
                    <Pause className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400" />
                  )}
                </button>
              )}

              {onToggleSound && (
                <button
                  onClick={onToggleSound}
                  onContextMenu={(e) => { e.preventDefault(); }}
                  className={`touch-control-btn w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 ${
                    !soundEnabled
                      ? 'bg-rose-500/40 border border-rose-400 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.5)]'
                      : 'bg-black/65 hover:bg-cyan-500/20 active:bg-cyan-500/50 border border-cyan-400/50 hover:border-cyan-300 text-cyan-300 active:text-white'
                  } rounded-2xl backdrop-blur-xl shadow-lg flex flex-col items-center justify-center select-none active:scale-95 transition-all cursor-pointer group`}
                  title={soundEnabled ? "Desligar Áudio" : "Ligar Áudio"}
                >
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-cyan-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-rose-400" />
                  )}
                </button>
              )}

              {onRestart && (
                <button
                  onClick={onRestart}
                  onContextMenu={(e) => { e.preventDefault(); }}
                  className="touch-control-btn w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-black/65 hover:bg-emerald-500/20 active:bg-emerald-500/50 border border-emerald-400/50 hover:border-emerald-300 text-emerald-300 active:text-white rounded-2xl backdrop-blur-xl shadow-lg flex flex-col items-center justify-center select-none active:scale-95 transition-all cursor-pointer group"
                  title="Reiniciar Partida"
                >
                  <RefreshCw className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-400 group-hover:rotate-180 transition-transform duration-500" />
                </button>
              )}

              {onOpenControlPanel && (
                <button
                  onClick={onOpenControlPanel}
                  onContextMenu={(e) => { e.preventDefault(); }}
                  className="touch-control-btn w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-black/65 hover:bg-purple-500/20 active:bg-purple-500/50 border border-purple-400/50 hover:border-purple-300 text-purple-300 active:text-white rounded-2xl backdrop-blur-xl shadow-lg flex flex-col items-center justify-center select-none active:scale-95 transition-all cursor-pointer group"
                  title="Configurações e Parâmetros do Jogo"
                >
                  <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-purple-300 group-hover:rotate-90 transition-transform duration-300" />
                </button>
              )}

              {/* Shop Button */}
              {onOpenShop && (
                <button
                  onClick={onOpenShop}
                  onContextMenu={(e) => { e.preventDefault(); }}
                  className="touch-control-btn w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-black/65 hover:bg-amber-500/20 active:bg-amber-500/50 border border-amber-400/50 hover:border-amber-300 text-amber-300 active:text-white rounded-2xl backdrop-blur-xl shadow-lg flex flex-col items-center justify-center select-none active:scale-95 transition-all cursor-pointer group"
                  title="Loja de Habilidades"
                >
                  <Store className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 group-hover:scale-110 transition-transform duration-300" />
                </button>
              )}

              {/* History Button */}
              {onOpenHistory && (
                <button
                  onClick={onOpenHistory}
                  onContextMenu={(e) => { e.preventDefault(); }}
                  className="touch-control-btn w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-black/65 hover:bg-emerald-500/20 active:bg-emerald-500/50 border border-emerald-400/50 hover:border-emerald-300 text-emerald-300 active:text-white rounded-2xl backdrop-blur-xl shadow-lg flex flex-col items-center justify-center select-none active:scale-95 transition-all cursor-pointer group"
                  title="Ver Histórico de Partidas"
                >
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
                </button>
              )}

              {onToggleFullscreen && (
                <button
                  onClick={onToggleFullscreen}
                  onContextMenu={(e) => { e.preventDefault(); }}
                  className="touch-control-btn w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-black/65 hover:bg-cyan-500/30 active:bg-cyan-500/60 border border-cyan-400/50 hover:border-cyan-300 text-cyan-300 active:text-white rounded-2xl backdrop-blur-xl shadow-lg flex flex-col items-center justify-center select-none active:scale-95 transition-all cursor-pointer group"
                  title={isFullscreen ? "Sair da Tela Cheia" : "Alternar Tela Cheia"}
                >
                  {isFullscreen ? <Minimize className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-cyan-400" /> : <Maximize className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-cyan-400" />}
                </button>
              )}
            </div>
          </div>

          {/* Right Lateral Controls Group (Esquerda) */}
          <div className={`pointer-events-auto fixed right-2 sm:right-4 md:right-8 bottom-4 sm:bottom-8 md:bottom-12 z-30 flex items-center transition-transform duration-300 ${
            gameSettings?.touchButtonsSize === 'pequeno' ? 'scale-85 origin-bottom-right' : gameSettings?.touchButtonsSize === 'grande' ? 'scale-115 origin-bottom-right' : 'scale-100'
          }`}>
            <CylindricalJoystickButton
              direction="right"
              label="DIREITA"
              icon="▶"
              colorTheme="cyan"
              size="lg"
              onSetMovingLeft={onSetMovingLeft}
              onSetMovingRight={onSetMovingRight}
              onSetJumping={onSetJumping}
              onSetCrouching={onSetCrouching}
              onMovePlayer={onMovePlayer}
            />
          </div>
        </>
      )}
    </div>
  );
};
