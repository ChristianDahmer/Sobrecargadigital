import React, { useState, useEffect, useRef } from 'react';
import { Bot, Volume2, VolumeX, RotateCcw, ChevronLeft, ChevronRight, Play, X, Sparkles, EyeOff, Cpu } from 'lucide-react';
import { GameSettings, GameState } from '../types';

interface VoiceTutorialAssistantProps {
  showVoiceAssistant?: boolean;
  gameSettings?: GameSettings;
  gameState?: GameState;
  onDisableAssistant?: () => void;
  onStartGame?: () => void;
  onDemonstrateStep?: (stepNumber: number) => void;
  onStart30sTutorial?: () => void;
  onOpenTechTour?: () => void;
}

interface TutorialStep {
  stepNumber: number;
  badge: string;
  badgeColor: string;
  title: string;
  speechText: string;
  commands?: string[];
  tips?: string[];
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    stepNumber: 1,
    badge: '⚡ CONCEITO & INTRODUÇÃO',
    badgeColor: 'bg-amber-400 text-black',
    title: '1. O que é o Sobrecarga Digital?',
    speechText: 'Olá! Sou o seu Assistente de Voz. O Sobrecarga Digital é um jogo educativo criado para demonstrar como o excesso de notificações e alertas digitais afeta nossa mente. Seu objetivo é guiar o avatar na pista 3D mantendo o foco e evitando a ansiedade!',
    tips: [
      'Entenda como notificações afetam a atenção',
      'Aprenda a priorizar seu bem-estar digital'
    ]
  },
  {
    stepNumber: 2,
    badge: '⌨️ COMANDOS & NAVEGAÇÃO',
    badgeColor: 'bg-cyan-400 text-black',
    title: '2. Como Movimentar o Avatar',
    speechText: 'Para se mover: use as teclas A e D ou as Setas Direcionais para mudar de pista. Pressione W ou Barra de Espaço para PULAR sobre buracos e obstáculos. Pressione S ou Seta para Baixo para AGACHAR. Em telas sensíveis ao toque ou joysticks, use os botões direcionais virtuais.',
    commands: ['[A] / [D] Mudar Pista', '[W] / [Espaço] Pular', '[S] Agachar', 'Joystick Virtual'],
    tips: ['Mantenha os dedos prontos nos comandos']
  },
  {
    stepNumber: 3,
    badge: '🍵 BEM-ESTAR vs 📱 NOTIFICAÇÕES',
    badgeColor: 'bg-emerald-400 text-black',
    title: '3. Itens na Pista',
    speechText: 'Fique atento! Colete Moedas de Ouro, Chás quentes e Livros para reduzir seu nível de estresse e somar pontos de saúde mental. Evite coletar notificações vermelhas de redes sociais, mensagens de trabalho urgente e pop-ups irritantes que sobem a ansiedade!',
    tips: [
      '🪙 Moedas & 🍵 Chá = Menos Ansiedade',
      '📱 Alertas Vermelhos = Sobrecarga'
    ]
  },
  {
    stepNumber: 4,
    badge: '🌿 AVALIAÇÃO & DESACELERAÇÃO',
    badgeColor: 'bg-purple-400 text-black',
    title: '4. Perguntas SAS-SMU & Modo Zen',
    speechText: 'Durante a corrida, surgirão questionários psicométricos com perguntas curtas sobre uso consciente de telas. Pressione SIM ou NÃO com sabedoria! Se a ansiedade subir muito, ative o Modo Zen para desacelerar a corrida e recuperar a paz.',
    commands: ['[SIM] Resposta Afirmativa', '[NÃO] Resposta Negativa', '[Modo Zen] Desacelera'],
    tips: ['Responda com honestidade e calma']
  },
  {
    stepNumber: 5,
    badge: '⚙️ AJUSTES & LOJA DE HABILIDADES',
    badgeColor: 'bg-rose-400 text-black',
    title: '5. Painel de Controle & Loja',
    speechText: 'Você pode abrir o Painel de Controle no topo da tela para calibrar a velocidade, voz do narrador, ativar o Modo Demonstrativo com Avatar Automático ou visitar a Loja para desbloquear bicicletas, skates, patinetes e roupas personalizadas!',
    tips: ['Desbloqueie veículos e roupas na loja']
  },
  {
    stepNumber: 6,
    badge: '🚀 PRONTO PARA COMEÇAR',
    badgeColor: 'bg-emerald-400 text-black',
    title: '6. Quebre a Sobrecarga Digital!',
    speechText: 'Excelente! Você aprendeu os conceitos essenciais do simulador. Quando estiver pronto, clique no botão Iniciar Jogo para começar sua jornada rumo ao equilíbrio digital!',
    tips: ['Clique em Iniciar Jogo para acelerar!']
  }
];

export const VoiceTutorialAssistant: React.FC<VoiceTutorialAssistantProps> = ({
  showVoiceAssistant = true,
  gameSettings,
  gameState,
  onDisableAssistant,
  onStartGame,
  onDemonstrateStep,
  onStart30sTutorial,
  onOpenTechTour,
}) => {
  // A caixa de diálogo permanece sempre FECHADA por padrão quando inativo
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Voice Listening and Command Recognition States
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSuspended, setIsSuspended] = useState<boolean>(false);
  const [recognizedText, setRecognizedText] = useState<string>('');

  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Position state: used ONLY when the dialogue box is open/expanded and dragged
  const [openPosition, setOpenPosition] = useState<{ x: number; y: number } | null>(null);

  const isDraggingRef = useRef<boolean>(false);
  const hasDraggedRef = useRef<boolean>(false);
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Limpa resíduos antigos de localStorage para assegurar o descanso a 20px da borda e 20px do rodapé
  useEffect(() => {
    try {
      localStorage.removeItem('entre_redes_assistant_pos');
    } catch {}
  }, []);

  // Fecha o diálogo sempre que o jogo entra no estado PLAYING
  useEffect(() => {
    if (gameState === 'PLAYING') {
      setIsOpen(false);
      setOpenPosition(null);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
    }
  }, [gameState]);

  const handleToggleOpen = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (!next) {
        // Ao fechar/ficar inativo, reseta qualquer posição de arrasto e retorna a 20px do rodapé e 20px da lateral
        setOpenPosition(null);
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
      }
      return next;
    });
  };

  const stepData = TUTORIAL_STEPS[currentStep];

  const startListening = () => {
    if (typeof window === 'undefined') return;
    if (isMuted || !isOpen) return;

    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}

      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Speech recognition start failed:', e);
      }
    }
  };

  const handleVoiceCommand = (command: string) => {
    const text = command.toLowerCase().trim();
    
    // Command Matching List
    const nextWords = ['próximo', 'proximo', 'avançar', 'avancar', 'seguir', 'próxima', 'proxima', 'next', 'ok', 'sim', 'entendi', 'avansa', 'avança'];
    const prevWords = ['anterior', 'voltar', 'atrás', 'atras', 'back', 'anteriormente'];
    const demoWords = ['demonstrar', 'demonstra', 'explicar', 'exclama', 'mostrar', 'vídeo', 'video', 'apresentar', 'ação', 'acao'];
    const startWords = ['iniciar', 'jogar', 'começar', 'comecar', 'play', 'partida', 'go', 'começo', 'comeco'];
    const tutorialWords = ['tutorial', 'trinta segundos', '30 segundos', 'boas-vindas', 'boas vindas', 'guiado', 'narrado', 'bem-estar', 'notificações'];
    const techWords = ['tecnologia', 'como foi criado', 'desenvolvimento', 'bastidores', 'tech', 'código', 'codigo', 'webgl', 'three.js', 'engenharia', 'laboratório', 'laboratorio'];

    if (techWords.some(word => text.includes(word)) && onOpenTechTour) {
      speakText('Abrindo o laboratório de tecnologia e bastidores do jogo! Vamos demonstrar como ele foi desenvolvido.');
      onOpenTechTour();
      setIsOpen(false);
      setOpenPosition(null);
    } else if (tutorialWords.some(word => text.includes(word)) && onStart30sTutorial) {
      speakText('Iniciando tutorial narrado de 30 segundos! Siga as instruções na pista.');
      onStart30sTutorial();
      setIsOpen(false);
      setOpenPosition(null);
    } else if (nextWords.some(word => text.includes(word))) {
      if (currentStep < TUTORIAL_STEPS.length - 1) {
        setCurrentStep((prev) => prev + 1);
      }
    } else if (prevWords.some(word => text.includes(word))) {
      if (currentStep > 0) {
        setCurrentStep((prev) => prev - 1);
      }
    } else if (demoWords.some(word => text.includes(word))) {
      speakText(`Demonstrando passo ${currentStep + 1}: ${stepData.title}. Acompanhe na tela!`);
      if (onDemonstrateStep) {
        onDemonstrateStep(currentStep + 1);
      }
    } else if (startWords.some(word => text.includes(word))) {
      if (onStartGame) {
        onStartGame();
        setIsOpen(false);
        setOpenPosition(null);
      }
    }
  };

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'pt-BR';

      rec.onstart = () => {
        setIsListening(true);
        setIsSuspended(false);
        setRecognizedText('');

        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = setTimeout(() => {
          setIsSuspended(true);
          setIsListening(false);
          try {
            rec.abort();
          } catch (e) {}
        }, 3000); // 3 seconds timeout
      };

      rec.onresult = (event: any) => {
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        const transcript = event.results[0][0].transcript;
        setRecognizedText(transcript);
        setIsListening(false);
        handleVoiceCommand(transcript);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsListening(false);
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [currentStep, isOpen]);

  // Speech Synthesis
  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }

    window.speechSynthesis.cancel();
    if (isMuted) {
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';

    if (gameSettings?.ttsPitch) utterance.pitch = gameSettings.ttsPitch;
    if (gameSettings?.ttsRate) utterance.rate = gameSettings.ttsRate;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsListening(false);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      startListening();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      startListening();
    };

    window.speechSynthesis.speak(utterance);
  };

  // Speak whenever step changes if assistant is open and not muted
  useEffect(() => {
    if (isOpen && !isMuted) {
      speakText(stepData.speechText);
    } else {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentStep, isOpen, isMuted]);

  // Drag Pointer Handlers - enabled only when dialog is open
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isOpen || !containerRef.current) return;
    
    const target = e.target as HTMLElement;
    const closestButton = target.closest('button');

    if (closestButton) {
      return;
    }

    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };

    const rect = containerRef.current.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isOpen || !isDraggingRef.current) return;

    const dx = e.clientX - dragStartPosRef.current.x;
    const dy = e.clientY - dragStartPosRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 5) {
      hasDraggedRef.current = true;
    }

    const rect = containerRef.current ? containerRef.current.getBoundingClientRect() : null;
    const assistantWidth = rect ? rect.width : 380;
    const assistantHeight = rect ? rect.height : 450;

    const newX = Math.max(10, Math.min(window.innerWidth - assistantWidth - 10, e.clientX - dragOffsetRef.current.x));
    const newY = Math.max(10, Math.min(window.innerHeight - assistantHeight - 10, e.clientY - dragOffsetRef.current.y));

    setOpenPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  if (!showVoiceAssistant) return null;

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="fixed z-[9995] font-sans select-none"
      style={
        isOpen && openPosition
          ? {
              left: `${openPosition.x}px`,
              top: `${openPosition.y}px`,
              bottom: 'auto',
              right: 'auto',
            }
          : {
              // Quando inativo / não chamado, permanece rigorosamente no canto inferior direito a 20px do rodapé e 20px da lateral
              bottom: '20px',
              right: '20px',
              left: 'auto',
              top: 'auto',
            }
      }
    >
      {/* ---------------------------------------------------------------------------- */}
      {/* 1. ESTADO INATIVO (NÃO CHAMADO): PERMANECE A 20PX DO RODAPÉ E 20PX DA LATERAL */}
      {/* ---------------------------------------------------------------------------- */}
      {!isOpen && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            handleToggleOpen();
          }}
          className="relative flex flex-col items-end group cursor-pointer active:scale-95 transition-transform"
          title="Assistente de Jogo • Clique para abrir"
        >
          {/* Tooltip sutil apenas no hover em desktop */}
          <div className="hidden group-hover:flex items-center gap-1.5 mb-2 bg-slate-950/95 text-amber-300 border border-amber-400/50 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg backdrop-blur-md pointer-events-none animate-fade-in">
            <Bot className="w-3.5 h-3.5 text-amber-400" />
            <span>Assistente • Clique para abrir</span>
          </div>

          {/* Botão circular do robô assistente */}
          <div
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 border-3 border-black shadow-[4px_4px_0px_#000] flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all cursor-pointer relative overflow-hidden"
          >
            <Bot className="w-7 h-7 sm:w-8 sm:h-8 text-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] group-hover:rotate-12 transition-transform" />
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-black rounded-full" />
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------------- */}
      {/* 2. ESTADO ATIVO: CAIXA DE DIÁLOGO ABERTA APENAS QUANDO O USUÁRIO CLICA NO ROBÔ */}
      {/* ---------------------------------------------------------------------------- */}
      {isOpen && (
        <div className="w-[320px] sm:w-[400px] max-w-[calc(100vw-40px)] bg-amber-50 border-3 border-black rounded-3xl shadow-[8px_8px_0px_#000] p-4 sm:p-5 text-slate-950 flex flex-col gap-3.5 relative animate-fade-in border-b-[6px] border-b-black cursor-grab active:cursor-grabbing">
          
          {/* PANEL HEADER */}
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-amber-400 border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#000]">
                <Bot className="w-5 h-5 text-black" />
              </div>
              <div className="text-left">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-950 block">
                  Assistente de Jogo
                </span>
                <span className="text-xs font-black text-black">
                  Passo {currentStep + 1} de {TUTORIAL_STEPS.length}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {onDisableAssistant && (
                <button
                  onClick={onDisableAssistant}
                  className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 border-2 border-red-500 rounded-lg text-[10px] font-black uppercase text-red-700 flex items-center gap-1 transition-all cursor-pointer"
                  title="Ocultar Assistente"
                >
                  <EyeOff className="w-3.5 h-3.5" /> Ocultar
                </button>
              )}
              <button
                onClick={handleToggleOpen}
                className="w-8 h-8 bg-black/5 hover:bg-black/15 border-2 border-black rounded-full flex items-center justify-center text-black transition-all cursor-pointer"
                title="Fechar caixa de diálogo e retornar ao canto inferior direito"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* DYNAMIC EQUALIZER & VOICE STATUS */}
          <div className="flex flex-col gap-2 bg-slate-950 text-white p-3 rounded-2xl shadow-[3px_3px_0px_#000] border-2 border-black">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex items-end gap-1 h-3.5">
                  <span className={`w-1.5 bg-amber-400 rounded-full ${isSpeaking ? 'h-3.5 animate-bounce' : isListening ? 'h-2.5 animate-pulse bg-cyan-400' : 'h-1.5'}`} />
                  <span className={`w-1.5 bg-amber-400 rounded-full ${isSpeaking ? 'h-2.5 animate-bounce delay-75' : isListening ? 'h-3.5 animate-pulse bg-cyan-400' : 'h-1.5'}`} />
                  <span className={`w-1.5 bg-amber-400 rounded-full ${isSpeaking ? 'h-4 animate-bounce delay-150' : isListening ? 'h-2 animate-pulse bg-cyan-400' : 'h-1.5'}`} />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                  {isSpeaking ? '📢 FALANDO...' : isListening ? '🎙️ ESCUTA ATIVA...' : isSuspended ? '🔇 ESCUTA SUSPENSA' : 'AGUARDANDO COMANDO'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {!isSpeaking && (
                  <button
                    onClick={() => startListening()}
                    className={`p-1 px-2.5 rounded-lg border text-[10px] font-black uppercase transition-all cursor-pointer ${
                      isListening
                        ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 animate-pulse'
                        : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                    }`}
                    title="Ativar microfone para falar comando"
                  >
                    Falar
                  </button>
                )}
                
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-1 px-2 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    isMuted
                      ? 'bg-red-500/30 border-red-400 text-red-200'
                      : 'bg-emerald-500/30 border-emerald-400 text-emerald-200'
                  }`}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isMuted ? 'Muted' : 'Voz On'}</span>
                </button>
              </div>
            </div>

            {/* Sub-bar explaining commands & current transcription */}
            <div className="text-[11px] text-slate-300 leading-snug border-t border-white/15 pt-2 flex flex-col gap-1">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <span className="font-bold text-amber-300">Comandos de Voz:</span>
                <div className="flex gap-1 flex-wrap">
                  <span className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded text-[10px] font-mono">"Próximo"</span>
                  <span className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded text-[10px] font-mono">"Voltar"</span>
                  <span className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded text-[10px] font-mono">"Demonstrar"</span>
                  <span className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded text-[10px] font-mono">"Iniciar"</span>
                </div>
              </div>
              {recognizedText && (
                <div className="bg-slate-900 border border-cyan-500/40 px-2 py-1 rounded text-cyan-300 font-mono text-xs truncate" title={recognizedText}>
                  Reconhecido: "{recognizedText}"
                </div>
              )}
              {isListening && (
                <div className="text-[10px] text-cyan-400 font-black animate-pulse flex items-center gap-1">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
                  Ouvindo microfone por 3 segundos...
                </div>
              )}
            </div>
          </div>

          {/* STEP CONTENT CONTAINER */}
          <div className="flex flex-col gap-2.5 pt-1">
            {/* Badge */}
            <div className="flex items-center">
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_#000] ${stepData.badgeColor}`}>
                {stepData.badge}
              </span>
            </div>

            {/* Title */}
            <h4 className="text-base font-black uppercase tracking-tight text-slate-950 leading-snug">
              {stepData.title}
            </h4>

            {/* Speech Text in a Pristine High-Contrast White Bubble Card */}
            <div className="bg-white border-2 border-amber-300/90 rounded-2xl p-3.5 shadow-sm text-slate-950">
              <p className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed">
                {stepData.speechText}
              </p>
            </div>

            {/* Commands list if available */}
            {stepData.commands && (
              <div className="mt-1 pt-2 border-t border-black/10 flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] font-black uppercase text-slate-950 w-full mb-0.5">⌨️ Teclas / Ações:</span>
                {stepData.commands.map((cmd, i) => (
                  <span key={i} className="px-2.5 py-1 bg-slate-950 text-amber-300 border-2 border-black rounded-lg text-[10px] font-mono font-black shadow-[1.5px_1.5px_0px_#000]">
                    {cmd}
                  </span>
                ))}
              </div>
            )}

            {/* Tips list */}
            {stepData.tips && (
              <div className="mt-1 pt-1.5 border-t border-black/10 space-y-1.5">
                {stepData.tips.map((tip, i) => (
                  <div key={i} className="text-xs font-bold text-slate-900 bg-amber-200/50 border border-amber-400/60 px-2.5 py-1.5 rounded-xl flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AUDIO & STEP NAVIGATION CONTROLS */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/10 mt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => speakText(stepData.speechText)}
                className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-black border-2 border-black rounded-xl text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#000] active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Ouvir explicação em voz"
              >
                <RotateCcw className="w-4 h-4" /> Ouvir
              </button>

              <button
                onClick={() => {
                  speakText(`Demonstrando passo ${currentStep + 1}: ${stepData.title}. Acompanhe na tela!`);
                  if (onDemonstrateStep) {
                    onDemonstrateStep(currentStep + 1);
                  }
                }}
                className="px-3 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black border-2 border-black rounded-xl text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#000] active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Primeiro explica, depois demonstra o recurso ao vivo!"
              >
                <Play className="w-4 h-4 fill-black" /> Demonstrar
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentStep === 0}
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                className="p-2 bg-white hover:bg-slate-100 disabled:opacity-30 border-2 border-black rounded-xl text-black font-bold transition-all cursor-pointer shadow-[2px_2px_0px_#000]"
                title="Passo Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                disabled={currentStep === TUTORIAL_STEPS.length - 1}
                onClick={() => setCurrentStep((prev) => Math.min(TUTORIAL_STEPS.length - 1, prev + 1))}
                className="p-2 bg-white hover:bg-slate-100 disabled:opacity-30 border-2 border-black rounded-xl text-black font-bold transition-all cursor-pointer shadow-[2px_2px_0px_#000]"
                title="Próximo Passo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 30-SECOND NARRATED TUTORIAL BUTTON */}
          {onStart30sTutorial && (
            <button
              onClick={() => {
                onStart30sTutorial();
                setIsOpen(false);
                setOpenPosition(null);
              }}
              className="w-full py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white font-black text-xs uppercase tracking-wider border-2 border-black rounded-xl shadow-[3px_3px_0px_#000] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              title="Iniciar tutorial de boas-vindas narrado na pista"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Tutorial Narrado na Pista</span>
            </button>
          )}

          {/* TECH LAB / COMO O JOGO FOI DESENVOLVIDO BUTTON */}
          {onOpenTechTour && (
            <button
              onClick={() => {
                onOpenTechTour();
                setIsOpen(false);
                setOpenPosition(null);
                if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
              }}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs uppercase tracking-wider border-2 border-black rounded-xl shadow-[3px_3px_0px_#000] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer mt-1.5"
              title="Laboratório Tecnológico: Descubra como o jogo foi criado com WebGL, Three.js, áudio procedural e ciência psicométrica"
            >
              <Cpu className="w-4 h-4 text-black animate-spin" />
              <span>🔬 Como Foi Criado (Tecnologia & Bastidores)</span>
            </button>
          )}

          {/* START GAME DIRECT BUTTON */}
          {onStartGame && (
            <button
              onClick={() => {
                onStartGame();
                setIsOpen(false);
                setOpenPosition(null);
              }}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-black font-black text-xs uppercase tracking-wider border-2 border-black rounded-xl shadow-[4px_4px_0px_#000] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer mt-1.5"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Iniciar Partida Direta!</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
