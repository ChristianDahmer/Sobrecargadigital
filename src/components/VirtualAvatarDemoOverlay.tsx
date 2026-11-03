import React, { useEffect, useState, useRef } from 'react';
import { MousePointer2, Bot, Sparkles, BrainCircuit, Play, RotateCcw, ShieldCheck, Zap, Activity, Eye, ChevronRight, X } from 'lucide-react';
import { GameState, SASQuestion, DemoProfile } from '../types';

interface VirtualAvatarDemoOverlayProps {
  isDemoMode: boolean;
  demoProfile: DemoProfile;
  gameState: GameState;
  currentQuestion: SASQuestion | null;
  onAnswerSAS: (choiceSim: boolean) => void;
  onStartGame: () => void;
  onRestart: () => void;
  onMovePlayer: (direction: -1 | 1) => void;
  onSetMovingLeft?: (active: boolean) => void;
  onSetMovingRight?: (active: boolean) => void;
  onSetJumping?: (active: boolean) => void;
  onSetCrouching?: (active: boolean) => void;
  onToggleDemoMode: () => void;
  onChangeDemoProfile: (profile: DemoProfile) => void;
}

export const VirtualAvatarDemoOverlay: React.FC<VirtualAvatarDemoOverlayProps> = ({
  isDemoMode,
  demoProfile,
  gameState,
  currentQuestion,
  onAnswerSAS,
  onStartGame,
  onRestart,
  onMovePlayer,
  onSetMovingLeft,
  onSetMovingRight,
  onSetJumping,
  onSetCrouching,
  onToggleDemoMode,
  onChangeDemoProfile,
}) => {
  // Cursor Screen Position State
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number; targetName: string }>({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 500,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 300,
    targetName: 'Navegação Livre',
  });

  // Click Ripple State
  const [ripple, setRipple] = useState<{ x: number; y: number; active: boolean; id: number }>({
    x: 0,
    y: 0,
    active: false,
    id: 0,
  });

  // Thought Bubble State
  const [thought, setThought] = useState<{ text: string; subtext?: string; type: 'reading' | 'thinking' | 'clicking' | 'action' }>({
    text: 'Modo Demonstrativo Ativo: Simulador de Avatar Humano',
    subtext: 'Aguardando ação no simulador...',
    type: 'action',
  });

  // Active Virtual Keys HUD State
  const [activeKeys, setActiveKeys] = useState<{
    W: boolean;
    A: boolean;
    S: boolean;
    D: boolean;
    SIM: boolean;
    NAO: boolean;
  }>({
    W: false,
    A: false,
    S: false,
    D: false,
    SIM: false,
    NAO: false,
  });

  // Current Avatar Action Label
  const [actionLabel, setActionLabel] = useState<string>('Centralizado na pista');

  // Question Answer Processing Lock
  const isAnsweringRef = useRef<boolean>(false);
  const questionHandledRef = useRef<SASQuestion | null>(null);

  // Restart/Start Processing Lock
  const isTransitioningStateRef = useRef<boolean>(false);

  // Floating Control Panel Expansion inside Demo Overlay
  const [showProfileSelector, setShowProfileSelector] = useState<boolean>(false);

  // Trigger Click Ripple Effect
  const triggerRippleAt = (x: number, y: number) => {
    setRipple({ x, y, active: true, id: Date.now() });
    setTimeout(() => {
      setRipple((prev) => ({ ...prev, active: false }));
    }, 600);
  };

  // Safe Element Position Finder
  const getTargetElementRect = (elementId: string): { x: number; y: number } | null => {
    if (typeof document === 'undefined') return null;
    const el = document.getElementById(elementId);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  };

  // -------------------------------------------------------------
  // 1. BEHAVIOR AI FOR SAS QUESTIONS (PAUSED_SAS STATE)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isDemoMode || gameState !== 'PAUSED_SAS' || !currentQuestion) {
      if (gameState !== 'PAUSED_SAS') {
        isAnsweringRef.current = false;
        questionHandledRef.current = null;
      }
      return;
    }

    if (questionHandledRef.current === currentQuestion || isAnsweringRef.current) {
      return;
    }

    isAnsweringRef.current = true;
    questionHandledRef.current = currentQuestion;

    // Determine Choice based on Profile
    let chooseSim = true;
    if (demoProfile === 'Anti-Ansiedade') {
      // Anti-Ansiedade: 95% NÃO (Rejeita gatilhos de estresse/impulsividade e prioriza baixar a ansiedade)
      chooseSim = Math.random() < 0.05;
    } else if (demoProfile === 'Impulsivo/FOMO') {
      // Impulsive: 80% SIM, fast response
      chooseSim = Math.random() < 0.8;
    } else if (demoProfile === 'Calmo/Zen') {
      // Calm/Zen: 85% NÃO, reflective response
      chooseSim = Math.random() < 0.15;
    } else if (demoProfile === 'Equilibrado') {
      // Balanced: 50% SIM / NÃO
      chooseSim = Math.random() < 0.5;
    } else {
      // Explorer: Alternate
      chooseSim = Math.random() < 0.5;
    }

    // Reaction and Thinking Delays
    let readTime = 800;
    let thinkTime = 1200;

    if (demoProfile === 'Anti-Ansiedade') {
      readTime = 900;
      thinkTime = 1100;
    } else if (demoProfile === 'Impulsivo/FOMO') {
      readTime = 300;
      thinkTime = 400;
    } else if (demoProfile === 'Calmo/Zen') {
      readTime = 1200;
      thinkTime = 1800;
    } else if (demoProfile === 'Equilibrado') {
      readTime = 800;
      thinkTime = 1000;
    } else {
      readTime = 600;
      thinkTime = 800;
    }

    // Step 1: Reading Question
    setThought({
      text: demoProfile === 'Anti-Ansiedade' ? 'Lendo pergunta com foco em desaceleração...' : `Lendo pergunta psicométrica...`,
      subtext: `"${currentQuestion.question.slice(0, 45)}..."`,
      type: 'reading',
    });
    setActionLabel(demoProfile === 'Anti-Ansiedade' ? 'Analisando impacto na ansiedade...' : 'Lendo pergunta psicométrica...');

    const readTimer = setTimeout(() => {
      // Step 2: Reflection and Target Acquisition
      const targetId = chooseSim ? 'demo-btn-sim' : 'demo-btn-nao';
      const targetRect = getTargetElementRect(targetId);

      const targetX = targetRect ? targetRect.x : (chooseSim ? window.innerWidth * 0.35 : window.innerWidth * 0.65);
      const targetY = targetRect ? targetRect.y : window.innerHeight * 0.65;

      setCursorPos({
        x: targetX,
        y: targetY,
        targetName: chooseSim ? 'Opção [SIM]' : 'Opção [NÃO]',
      });

      setThought({
        text: `Refletindo (${demoProfile}): Selecionando [${chooseSim ? 'SIM' : 'NÃO'}]`,
        subtext: demoProfile === 'Anti-Ansiedade'
          ? 'Rejeitando gatilho digital para baixar e equilibrar a ansiedade'
          : chooseSim
            ? 'Pressionando afirmativa por ansiedade/hábito'
            : 'Escolhendo preservação de foco e paz mental',
        type: 'thinking',
      });

      setActiveKeys((prev) => ({
        ...prev,
        SIM: chooseSim,
        NAO: !chooseSim,
      }));

      setActionLabel(`Inclinando decisão para [${chooseSim ? 'SIM' : 'NÃO'}]`);

      const clickTimer = setTimeout(() => {
        // Step 3: Trigger Hover Ripple & Send Answer
        triggerRippleAt(targetX, targetY);

        setThought({
          text: `Enviando resposta: [${chooseSim ? 'SIM' : 'NÃO'}]`,
          subtext: 'Registrado com sucesso!',
          type: 'clicking',
        });

        setTimeout(() => {
          onAnswerSAS(chooseSim);
          setActiveKeys((prev) => ({ ...prev, SIM: false, NAO: false }));
          isAnsweringRef.current = false;
        }, 200);
      }, thinkTime);

      return () => clearTimeout(clickTimer);
    }, readTime);

    return () => clearTimeout(readTimer);
  }, [isDemoMode, gameState, currentQuestion, demoProfile, onAnswerSAS]);

  // -------------------------------------------------------------
  // 2. BEHAVIOR AI FOR MENU, VICTORY, DEFEAT (CONTINUOUS DEMO LOOP)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isDemoMode) return;

    if (gameState === 'MENU' || gameState === 'VITORIA' || gameState === 'DERROTA') {
      if (isTransitioningStateRef.current) return;
      isTransitioningStateRef.current = true;

      const targetId = gameState === 'MENU' ? 'demo-btn-start' : 'demo-btn-restart';
      const isMenu = gameState === 'MENU';

      setThought({
        text: isMenu ? 'Modo Demonstrativo: Preparando início do jogo...' : 'Analisando resultado e reiniciando corrida...',
        subtext: 'Simulação automatizada de avatar humano',
        type: 'thinking',
      });
      setActionLabel(isMenu ? 'Posicionando no botão Iniciar' : 'Posicionando no botão Reiniciar');

      const transitionTimer = setTimeout(() => {
        const targetRect = getTargetElementRect(targetId);
        const targetX = targetRect ? targetRect.x : window.innerWidth / 2;
        const targetY = targetRect ? targetRect.y : window.innerHeight * 0.7;

        setCursorPos({
          x: targetX,
          y: targetY,
          targetName: isMenu ? 'Botão [INICIAR JOGO]' : 'Botão [JOGAR NOVAMENTE]',
        });

        const clickTimer = setTimeout(() => {
          triggerRippleAt(targetX, targetY);
          setThought({
            text: isMenu ? 'Pressionando [INICIAR JOGO]' : 'Pressionando [JOGAR NOVAMENTE]',
            subtext: 'Iniciando rodada demonstrativa...',
            type: 'clicking',
          });

          setTimeout(() => {
            if (isMenu) {
              onStartGame();
            } else {
              onRestart();
            }
            isTransitioningStateRef.current = false;
          }, 300);
        }, 1000);

        return () => clearTimeout(clickTimer);
      }, 1200);

      return () => {
        clearTimeout(transitionTimer);
        isTransitioningStateRef.current = false;
      };
    } else {
      isTransitioningStateRef.current = false;
    }
  }, [isDemoMode, gameState, onStartGame, onRestart]);

  // -------------------------------------------------------------
  // 3. CONTINUOUS TRACK NAVIGATION (PLAYING / MODO_ZEN)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isDemoMode || (gameState !== 'PLAYING' && gameState !== 'MODO_ZEN')) return;

    let movementInterval: NodeJS.Timeout;

    const performAvatarAction = () => {
      // Decide random procedural movement action
      const rand = Math.random();

      // Clear all active movement states first
      onSetMovingLeft?.(false);
      onSetMovingRight?.(false);
      onSetJumping?.(false);
      onSetCrouching?.(false);

      if (demoProfile === 'Anti-Ansiedade') {
        if (rand < 0.25) {
          // Move Left [A]
          onSetMovingLeft?.(true);
          onMovePlayer(-1);
          setActiveKeys({ W: false, A: true, S: false, D: false, SIM: false, NAO: false });
          setActionLabel('Foco Anti-Ansiedade: Esquiva de Alerta Nocivo [A]');
          setThought({
            text: 'Estratégia Anti-Ansiedade: Esquivando de notificação [A]',
            subtext: 'Preservando barra de estresse baixa e equilibrada',
            type: 'action',
          });
        } else if (rand < 0.50) {
          // Move Right [D]
          onSetMovingRight?.(true);
          onMovePlayer(1);
          setActiveKeys({ W: false, A: false, S: false, D: true, SIM: false, NAO: false });
          setActionLabel('Foco Anti-Ansiedade: Coletando Chá / Livro / Moeda [D]');
          setThought({
            text: 'Estratégia Anti-Ansiedade: Coletando item de bem-estar [D]',
            subtext: 'Buscando chá, livro e moedas para baixar a ansiedade',
            type: 'action',
          });
        } else if (rand < 0.70) {
          // Jump [W / Pulo]
          onSetJumping?.(true);
          setActiveKeys({ W: true, A: false, S: false, D: false, SIM: false, NAO: false });
          setActionLabel('Saltando sobre gatilho de estresse [Pulo]');
          setThought({
            text: 'Salto Anti-Ansiedade: Superando obstáculo digital [Pulo]',
            subtext: 'Preservando foco e ritmo calmo no simulador',
            type: 'action',
          });
        } else if (rand < 0.85) {
          // Crouch [S / Agachar]
          onSetCrouching?.(true);
          setActiveKeys({ W: false, A: false, S: true, D: false, SIM: false, NAO: false });
          setActionLabel('Agachando sob notificação urgente [Agachar]');
          setThought({
            text: 'Agacho Anti-Ansiedade: Ignorando alerta urgente [Agachar]',
            subtext: 'Evitando acúmulo de sobrecarga mental',
            type: 'action',
          });
        } else {
          // Centralized
          setActiveKeys({ W: false, A: false, S: false, D: false, SIM: false, NAO: false });
          setActionLabel('Postura de Foco: Ansiedade Equilibrada');
          setThought({
            text: 'Modo Anti-Ansiedade: Ansiedade totalmente equilibrada',
            subtext: 'Ritmo sereno e focado na saúde mental digital',
            type: 'action',
          });
        }
      } else if (rand < 0.25) {
        // Move Left [A]
        onSetMovingLeft?.(true);
        onMovePlayer(-1);
        setActiveKeys({ W: false, A: true, S: false, D: false, SIM: false, NAO: false });
        setActionLabel('Inclinando rota à esquerda [A]');
        setThought({
          text: 'Analisando pista: Desviando para a esquerda [A]',
          subtext: 'Evitando itens nocivos na rota lateral',
          type: 'action',
        });
      } else if (rand < 0.50) {
        // Move Right [D]
        onSetMovingRight?.(true);
        onMovePlayer(1);
        setActiveKeys({ W: false, A: false, S: false, D: true, SIM: false, NAO: false });
        setActionLabel('Inclinando rota à direita [D]');
        setThought({
          text: 'Analisando pista: Desviando para a direita [D]',
          subtext: 'Buscando moedas de ouro e itens de bem-estar',
          type: 'action',
        });
      } else if (rand < 0.70) {
        // Jump [W / Pulo]
        onSetJumping?.(true);
        setActiveKeys({ W: true, A: false, S: false, D: false, SIM: false, NAO: false });
        setActionLabel('Saltando obstáculo [Pulo]');
        setThought({
          text: 'Saltando sobre obstáculo/buraco [Pulo]',
          subtext: 'Executando salto procedural no ambiente 3D',
          type: 'action',
        });
      } else if (rand < 0.82) {
        // Crouch [S / Agachar]
        onSetCrouching?.(true);
        setActiveKeys({ W: false, A: false, S: true, D: false, SIM: false, NAO: false });
        setActionLabel('Agachando sob obstáculo [Agachar]');
        setThought({
          text: 'Agachando sob notificação alta [Agachar]',
          subtext: 'Mantendo postura e velocidade operacional',
          type: 'action',
        });
      } else {
        // Centralized
        setActiveKeys({ W: false, A: false, S: false, D: false, SIM: false, NAO: false });
        setActionLabel('Centralizado na pista');
        setThought({
          text: 'Centralizado na pista 3D em velocidade de cruzeiro',
          subtext: 'Monitorando spawn de estímulos virtuais...',
          type: 'action',
        });
      }

      // Smoothly float virtual cursor near avatar track center
      const centerX = window.innerWidth / 2 + (Math.random() * 200 - 100);
      const centerY = window.innerHeight * 0.55 + (Math.random() * 100 - 50);
      setCursorPos({
        x: centerX,
        y: centerY,
        targetName: 'Navegação em Pista 3D',
      });

      // Clear keys shortly after
      setTimeout(() => {
        onSetMovingLeft?.(false);
        onSetMovingRight?.(false);
        onSetJumping?.(false);
        onSetCrouching?.(false);
      }, 400);
    };

    // Frequency of movements based on profile
    const frequency = demoProfile === 'Impulsivo/FOMO' ? 700 : demoProfile === 'Calmo/Zen' ? 1500 : 1000;

    movementInterval = setInterval(performAvatarAction, frequency);

    return () => {
      clearInterval(movementInterval);
      onSetMovingLeft?.(false);
      onSetMovingRight?.(false);
      onSetJumping?.(false);
      onSetCrouching?.(false);
    };
  }, [isDemoMode, gameState, demoProfile, onMovePlayer, onSetMovingLeft, onSetMovingRight, onSetJumping, onSetCrouching]);

  if (!isDemoMode) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none select-none overflow-hidden font-sans">
      {/* ------------------------------------------------------------- */}
      {/* 1. CURSOR HUMANO VIRTUAL ANIMADO COM RIPPLE E BALÃO          */}
      {/* ------------------------------------------------------------- */}
      <div
        className="absolute transition-all duration-500 ease-out flex flex-col items-start z-[10000]"
        style={{
          left: `${cursorPos.x}px`,
          top: `${cursorPos.y}px`,
          transform: 'translate(-10px, -10px)',
        }}
      >
        {/* CLICK RIPPLE WAVE EFFECT */}
        {ripple.active && (
          <div className="absolute -top-6 -left-6 w-16 h-16 rounded-full border-2 border-cyan-400 bg-cyan-400/30 animate-ping pointer-events-none" />
        )}

        {/* POINTER ICON */}
        <div className="relative flex items-center justify-center">
          <MousePointer2 className="w-8 h-8 text-cyan-400 fill-cyan-400/30 drop-shadow-[0_0_15px_rgba(34,211,238,0.9)] animate-pulse" />
          <span className="absolute left-8 -top-1 bg-cyan-500 text-black font-extrabold text-[9px] uppercase px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap tracking-wider">
            Simulador de Avatar
          </span>
        </div>

        {/* BALÃO DE PENSAMENTO E AÇÃO EM ESTILO HQ POP-ART (ALTA LEGIBILIDADE) */}
        <div className="relative ml-6 -mt-2 bg-[#090d16] border-2 border-cyan-400 p-3.5 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.5)] max-w-xs animate-fade-in text-left">
          {/* Rabicho de HQ apontando para o cursor */}
          <div className="absolute -left-3 top-3 w-0 h-0 border-t-[8px] border-t-transparent border-r-[12px] border-r-cyan-400 border-b-[8px] border-b-transparent" />
          <div className="absolute -left-2 top-3.5 w-0 h-0 border-t-[6px] border-t-transparent border-r-[10px] border-r-[#090d16] border-b-[6px] border-b-transparent" />

          <div className="flex items-center gap-1.5 text-cyan-300 text-[10px] font-black uppercase tracking-wider mb-1.5 bg-black/90 px-2 py-0.5 rounded-md border border-cyan-400/50 w-fit">
            <BrainCircuit className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>💬 PENSAMENTO DO AVATAR • {thought.type === 'reading' ? 'LENDO' : thought.type === 'thinking' ? 'REFLETINDO' : 'AÇÃO'}</span>
          </div>
          <p className="text-xs sm:text-sm font-black text-white leading-snug">{thought.text}</p>
          {thought.subtext && <p className="text-[11px] text-cyan-200 font-bold mt-1 leading-snug">{thought.subtext}</p>}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. VISUALIZADOR DE CONTROLES VIRTUAIS DO AVATAR (HUD ENTRADA)  */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute bottom-5 left-5 pointer-events-auto bg-black/85 border border-cyan-400/30 backdrop-blur-2xl p-3 sm:p-4 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)] text-left flex flex-col gap-2.5 max-w-sm z-[9999]">
        {/* Header HUD */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1">
              <Bot className="w-4 h-4 text-cyan-400" />
              Modo Demo <span className="text-[9px] text-white/50">({demoProfile})</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowProfileSelector(!showProfileSelector)}
              className="px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 rounded-lg text-cyan-300 text-[9px] font-extrabold uppercase transition-all cursor-pointer"
            >
              Perfil
            </button>
            <button
              onClick={onToggleDemoMode}
              className="p-1 bg-red-500/20 hover:bg-red-500/40 border border-red-400/40 rounded-lg text-red-300 text-[9px] font-extrabold transition-all cursor-pointer"
              title="Desativar Modo Demonstrativo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Profile Selector Drawer */}
        {showProfileSelector && (
          <div className="p-2 bg-black/60 border border-cyan-400/20 rounded-xl grid grid-cols-2 gap-1.5 animate-fade-in text-[10px]">
            {(['Anti-Ansiedade', 'Equilibrado', 'Impulsivo/FOMO', 'Calmo/Zen', 'Explorador'] as DemoProfile[]).map((p) => (
              <button
                key={p}
                onClick={() => {
                  onChangeDemoProfile(p);
                  setShowProfileSelector(false);
                }}
                className={`p-1.5 rounded-lg border text-left font-bold transition-all cursor-pointer ${
                  demoProfile === p
                    ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                    : 'bg-black/30 border-white/10 text-white/60 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Avatar Current Action Status */}
        <div className="bg-cyan-950/40 border border-cyan-400/20 px-2.5 py-1.5 rounded-xl flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-pulse" />
          <span className="text-[11px] font-extrabold text-cyan-200 truncate">{actionLabel}</span>
        </div>

        {/* VIRTUAL ACTIVE KEYBOARD HUD */}
        <div className="flex flex-col gap-1.5 bg-black/40 p-2 rounded-xl border border-white/5">
          <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Teclado Virtual do Avatar</span>

          <div className="flex items-center justify-center gap-1.5">
            {/* [W] / Pulo */}
            <div
              className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-black transition-all flex items-center gap-1 ${
                activeKeys.W
                  ? 'bg-cyan-400 text-black border-cyan-300 font-extrabold scale-105 shadow-[0_0_12px_rgba(34,211,238,0.8)]'
                  : 'bg-black/40 border-white/10 text-white/50'
              }`}
            >
              [W] Pulo
            </div>
            {/* [A] / Esq */}
            <div
              className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-black transition-all flex items-center gap-1 ${
                activeKeys.A
                  ? 'bg-cyan-400 text-black border-cyan-300 font-extrabold scale-105 shadow-[0_0_12px_rgba(34,211,238,0.8)]'
                  : 'bg-black/40 border-white/10 text-white/50'
              }`}
            >
              [A] Esq
            </div>
            {/* [S] / Agachar */}
            <div
              className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-black transition-all flex items-center gap-1 ${
                activeKeys.S
                  ? 'bg-cyan-400 text-black border-cyan-300 font-extrabold scale-105 shadow-[0_0_12px_rgba(34,211,238,0.8)]'
                  : 'bg-black/40 border-white/10 text-white/50'
              }`}
            >
              [S] Agachar
            </div>
            {/* [D] / Dir */}
            <div
              className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-black transition-all flex items-center gap-1 ${
                activeKeys.D
                  ? 'bg-cyan-400 text-black border-cyan-300 font-extrabold scale-105 shadow-[0_0_12px_rgba(34,211,238,0.8)]'
                  : 'bg-black/40 border-white/10 text-white/50'
              }`}
            >
              [D] Dir
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-1">
            {/* [SIM] */}
            <div
              className={`px-3 py-1 rounded-lg border text-[10px] font-black transition-all flex items-center gap-1 ${
                activeKeys.SIM
                  ? 'bg-emerald-400 text-black border-emerald-300 font-extrabold scale-105 shadow-[0_0_12px_rgba(52,211,153,0.8)]'
                  : 'bg-emerald-950/30 border-emerald-500/20 text-emerald-400/50'
              }`}
            >
              [SIM]
            </div>
            {/* [NÃO] */}
            <div
              className={`px-3 py-1 rounded-lg border text-[10px] font-black transition-all flex items-center gap-1 ${
                activeKeys.NAO
                  ? 'bg-rose-400 text-black border-rose-300 font-extrabold scale-105 shadow-[0_0_12px_rgba(244,63,94,0.8)]'
                  : 'bg-rose-950/30 border-rose-500/20 text-rose-400/50'
              }`}
            >
              [NÃO]
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
