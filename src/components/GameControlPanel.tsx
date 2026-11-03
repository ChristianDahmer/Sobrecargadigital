import React, { useEffect, useState } from 'react';
import {
  Sliders,
  X,
  RotateCcw,
  Sparkles,
  Zap,
  Monitor,
  Eye,
  Box,
  Layers,
  Sun,
  Moon,
  Clock,
  Cpu,
  Image as ImageIcon,
  Flame,
  CheckCircle2,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Skull,
  Heart,
  Shield,
  Gauge,
  Activity,
  Maximize2,
  Tv,
  Gamepad,
  EyeOff,
  Play,
  Settings as SettingsIcon,
  Coins,
  AlertTriangle,
  Cloud,
  Vote,
  Wand2,
  Lock,
  Target,
  Users,
  Globe,
} from 'lucide-react';
import { GameSettings, DEFAULT_GAME_SETTINGS, GamepadConfig, DemoProfile, DataCollectionAudience, AppLanguage } from '../types';
import { speakQuestion } from '../utils/audio';
import { Bot } from 'lucide-react';
import { MasterAIEnhancerModal } from './MasterAIEnhancerModal';
import { useLanguage } from '../i18n/LanguageContext';

interface GameControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onResetSettings?: () => void;
  gameTimer?: number;
  onOpenGamepadModal?: () => void;
  gamepadConfig?: GamepadConfig;
  isDemoMode?: boolean;
  onToggleDemoMode?: () => void;
  demoProfile?: DemoProfile;
  onChangeDemoProfile?: (profile: DemoProfile) => void;
  onStart30sTutorial?: () => void;
  audiences?: DataCollectionAudience[];
  activeAudienceId?: string;
  onSelectActiveAudience?: (audienceId: string) => void;
  onOpenAudienceManager?: () => void;
  onOpenTechTour?: () => void;
  onOpenWindowsInstall?: () => void;
  onOpenCameraAccessibility?: () => void;
  isCameraAccessibilityActive?: boolean;
}

export const GameControlPanel: React.FC<GameControlPanelProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetSettings,
  onOpenGamepadModal,
  gamepadConfig,
  isDemoMode = false,
  onToggleDemoMode,
  demoProfile = 'Equilibrado',
  onChangeDemoProfile,
  onStart30sTutorial,
  audiences = [],
  activeAudienceId,
  onSelectActiveAudience,
  onOpenAudienceManager,
  onOpenTechTour,
  onOpenWindowsInstall,
  onOpenCameraAccessibility,
  isCameraAccessibilityActive = false,
}) => {
  const { language, setLanguage, t, languages } = useLanguage();
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isMasterAIModalOpen, setIsMasterAIModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const ptVoices = voices.filter(
        (v) =>
          v.lang.toLowerCase().includes('pt') ||
          v.name.toLowerCase().includes('português') ||
          v.name.toLowerCase().includes('portuguese') ||
          v.name.toLowerCase().includes('brazil') ||
          v.name.toLowerCase().includes('brasil')
      );

      // Sort pt-BR voices to the top
      ptVoices.sort((a, b) => {
        const aPtBr = a.lang.toLowerCase().includes('pt-br') || a.name.toLowerCase().includes('brazil') || a.name.toLowerCase().includes('brasil') ? 1 : 0;
        const bPtBr = b.lang.toLowerCase().includes('pt-br') || b.name.toLowerCase().includes('brazil') || b.name.toLowerCase().includes('brasil') ? 1 : 0;
        return bPtBr - aPtBr;
      });

      setAvailableVoices(ptVoices);
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  // Safe fallback to guarantee all properties exist even if localStorage was corrupted
  const safeSettings: GameSettings = {
    ...DEFAULT_GAME_SETTINGS,
    ...(settings || {}),
  };

  const handleReset = () => {
    if (onResetSettings) {
      onResetSettings();
    } else {
      onUpdateSettings(DEFAULT_GAME_SETTINGS);
    }
  };

  const applyPresetPotato = () => {
    onUpdateSettings({
      enableShadows: false,
      enableTextures: false,
      renderDepth: 'curta',
      mode3D: false,
      resolutionScale: 0.5,
      fpsLimit: 30,
      baseGameSpeed: 0.9,
      itemSpawnDensity: 'baixa',
    });
  };

  const applyPresetBalanced = () => {
    onUpdateSettings({
      ...DEFAULT_GAME_SETTINGS,
      questionInterval: safeSettings.questionInterval || 15,
    });
  };

  const applyPresetUltra = () => {
    onUpdateSettings({
      enableShadows: true,
      enableTextures: true,
      renderDepth: 'longa',
      mode3D: true,
      resolutionScale: 1.25,
      fpsLimit: 120,
      baseGameSpeed: 1.0,
      itemSpawnDensity: 'alta',
    });
  };

  const intervalPresets = [5, 10, 15, 20, 30, 45, 60];

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-2xl animate-fade-in overflow-y-auto">
      <div className="bg-[#070b14] border border-cyan-400/40 rounded-3xl w-full max-w-5xl shadow-[0_0_80px_rgba(34,211,238,0.25)] text-white flex flex-col max-h-[92vh] overflow-hidden my-auto">
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* MASTER AI DIRECTOR PROMPT BANNER (PASSWORD PROTECTED) */}
          <div className="bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-cyan-950/60 border-2 border-purple-400/50 rounded-3xl p-5 shadow-[0_0_30px_rgba(168,85,247,0.25)] flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/50 flex items-center justify-center text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                <Wand2 className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Diretor Mestre de IA (Prompt Protegido)
                  </h3>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Senha Mestre
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Aprimore o jogo com IA de última geração, gere código Luau para publicação e gerencie versões com controle de rollback.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsMasterAIModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all cursor-pointer flex items-center gap-2 active:scale-95 shrink-0"
            >
              <Sparkles className="w-4 h-4" /> Abrir Painel Mestre de IA
            </button>
          </div>

          {/* SECTION: BASTIDORES & TECNOLOGIA LAB */}
          {onOpenTechTour && (
            <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-blue-950/40 border border-cyan-400/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] shrink-0">
                  <Cpu className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      Laboratório de Tecnologia & Bastidores 3D
                    </h3>
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 px-2 py-0.5 rounded-full font-mono">
                      WebGL • Three.js • Audio Synth
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Descubra como o jogo foi desenvolvido: física parabólica, áudio procedural sintetizado, escala psicométrica e código Luau.
                  </p>
                  <p className="text-[11px] text-cyan-300 font-medium mt-1">
                    Orientador Técnico de Desenvolvimento: <span className="font-bold text-white">Christian Dahmer</span> • Turma 61 (EEEM Felipe Camarão)
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenTechTour();
                }}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer flex items-center gap-2 active:scale-95 shrink-0"
              >
                <Cpu className="w-4 h-4" /> Abrir Laboratório Tecnológico
              </button>
            </div>
          )}

          {/* SECTION: WINDOWS APP INSTALLATION */}
          {onOpenWindowsInstall && (
            <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-cyan-950/60 border border-blue-400/40 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(59,130,246,0.3)] shrink-0">
                  <Monitor className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      Instalar o Jogo no Windows (Windows 10 / 11)
                    </h3>
                    <span className="text-[10px] bg-blue-500/20 text-cyan-300 border border-blue-400/40 px-2 py-0.5 rounded-full font-mono">
                      PWA Native App
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Instale como aplicativo nativo no seu Windows com ícone no Menu Iniciar, Área de Trabalho e desempenho 60 FPS com acelerador de GPU.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenWindowsInstall();
                }}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all cursor-pointer flex items-center gap-2 active:scale-95 shrink-0"
              >
                <Monitor className="w-4 h-4" /> Instalar no Windows
              </button>
            </div>
          )}

          {/* SECTION: ACCESSIBILITY VIA FACE & GESTURES */}
          {onOpenCameraAccessibility && (
            <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-400/40 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0">
                  <Eye className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      Acessibilidade Facial & Gestos por Câmera
                    </h3>
                    <span className={`text-[10px] border px-2 py-0.5 rounded-full font-mono ${
                      isCameraAccessibilityActive
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                        : 'bg-slate-800 text-slate-400 border-white/10'
                    }`}>
                      {isCameraAccessibilityActive ? '🟢 Câmera Ativa' : '⚪ Desativado'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Navegue no jogo 3D e responda o questionário psicométrico apenas inclinando o rosto e a cabeça na webcam.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenCameraAccessibility();
                }}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all cursor-pointer flex items-center gap-2 active:scale-95 shrink-0"
              >
                <Eye className="w-4 h-4" /> Configurar Rosto & Câmera
              </button>
            </div>
          )}

          {/* SECTION: IDIOMA DO SISTEMA (MULTILINGUAL SUPPORT) */}
          <div className="bg-gradient-to-r from-cyan-950/50 via-slate-900 to-indigo-950/50 border-2 border-cyan-400/40 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                  <Globe className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    {t('settings.languageTitle', 'Idioma do Sistema & Leitura por Voz')}
                  </h3>
                  <p className="text-[11px] text-cyan-300/90 font-medium">
                    {t('settings.languageSubtitle', 'Altera textos da interface, perguntas do questionário SAS e sintetizador de voz (TTS)')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const samplePhrases = {
                      pt: 'Idioma em Português selecionado com sucesso! Bem-vindo ao simulador.',
                      es: '¡Idioma Español seleccionado con éxito! Bienvenido al simulador.',
                      en: 'English language successfully selected! Welcome to the simulator.',
                      de: 'Sprache Deutsch erfolgreich ausgewählt! Willkommen beim Simulator.',
                    };
                    speakQuestion(
                      samplePhrases[language] || samplePhrases.pt,
                      true,
                      {
                        voiceURI: settings?.ttsVoiceURI,
                        pitch: settings?.ttsPitch,
                        rate: settings?.ttsRate,
                      },
                      language
                    );
                  }}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  title="Ouvir amostra da voz no idioma selecionado"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Testar Voz ({language.toUpperCase()})</span>
                </button>

                <span className="text-xs font-mono font-black px-3 py-1.5 rounded-xl border border-cyan-400/50 bg-cyan-500/20 text-cyan-300 uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                  <span className="text-base leading-none">{languages.find((l) => l.code === language)?.flag}</span>
                  <span>{languages.find((l) => l.code === language)?.name}</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {languages.map((l) => {
                const isSelected = language === l.code;
                const regionLabels: Record<AppLanguage, string> = {
                  pt: 'Português • Brasil',
                  es: 'Español • España / LATAM',
                  en: 'English • US / Global',
                  de: 'Deutsch • Deutschland',
                };

                return (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code);
                      onUpdateSettings({ language: l.code });
                    }}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-start justify-between gap-3 transition-all cursor-pointer active:scale-95 text-left relative overflow-hidden ${
                      isSelected
                        ? 'bg-gradient-to-br from-cyan-500/30 via-blue-600/20 to-slate-900 border-cyan-400 text-white shadow-[0_0_20px_rgba(34,211,238,0.3)] ring-2 ring-cyan-400/40 scale-[1.02]'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-3xl drop-shadow-md">{l.flag}</span>
                      {isSelected ? (
                        <div className="bg-cyan-400 text-slate-950 p-1 rounded-full shadow-md">
                          <CheckCircle2 className="w-4 h-4 text-slate-950 stroke-[3]" />
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase px-2 py-0.5 rounded-md bg-black/40 border border-white/5">
                          {l.code}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="text-sm font-black uppercase tracking-wider text-white">
                        {l.name}
                      </div>
                      <div className="text-[10px] font-medium text-cyan-300/80 mt-0.5">
                        {regionLabels[l.code]}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-full text-[9px] font-black uppercase tracking-widest text-cyan-300 bg-cyan-400/10 border border-cyan-400/30 px-2 py-1 rounded-lg text-center mt-1">
                        ✓ IDIOMA ATIVO
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 0: MODO DEMONSTRATIVO (AVATAR HUMANO VIRTUAL) */}
          <div className="bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/40 border border-cyan-400/40 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-400 animate-pulse" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Modo Demonstrativo (Simulador de Avatar Humano)
                </h3>
              </div>
              <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${
                isDemoMode ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 animate-pulse' : 'bg-white/5 text-slate-400 border-white/10'
              }`}>
                {isDemoMode ? 'Ativado' : 'Desativado'}
              </span>
            </div>

            <div className="flex items-center justify-between bg-black/40 p-3.5 rounded-xl border border-white/10">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">Ativar Simulação Humana Completa</span>
                <p className="text-[11px] text-slate-400">
                  Simula o movimento do avatar na pista 3D e responde automaticamente aos testes psicométricos com cursor animado e balões de pensamento.
                </p>
              </div>

              {onToggleDemoMode && (
                <button
                  onClick={onToggleDemoMode}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                    isDemoMode
                      ? 'bg-cyan-400 text-black shadow-[0_0_15px_rgba(34,211,238,0.8)]'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  {isDemoMode ? 'Desativar Demo' : 'Ativar Demo'}
                </button>
              )}
            </div>

            {/* Profile Selection for Demo */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold text-slate-300 block">Estilo Comportamental do Avatar:</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(['Anti-Ansiedade', 'Equilibrado', 'Impulsivo/FOMO', 'Calmo/Zen', 'Explorador'] as DemoProfile[]).map((prof) => (
                  <button
                    key={prof}
                    onClick={() => onChangeDemoProfile?.(prof)}
                    className={`p-2 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      demoProfile === prof
                        ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.4)]'
                        : 'bg-black/30 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="block font-black uppercase text-[10px] tracking-wider text-emerald-400 mb-0.5">{prof}</span>
                    <span className="text-[9px] font-normal block leading-tight text-slate-300">
                      {prof === 'Anti-Ansiedade' ? 'Foco em baixar a ansiedade, coletando itens benéficos e rejeitando gatilhos' : prof === 'Impulsivo/FOMO' ? 'Reação ultra rápida & foco em SIM' : prof === 'Calmo/Zen' ? 'Reflexão longa & foco em NÃO' : prof === 'Equilibrado' ? 'Reação ponderada intermediária' : 'Modo exploração variada'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION: PÚBLICOS DE COLETA DE DADOS & FAIXAS ETÁRIAS */}
          <div className="bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900/60 border border-cyan-400/40 rounded-2xl p-5 space-y-4 shadow-[0_0_20px_rgba(34,211,238,0.15)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400 animate-pulse" />
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    Públicos de Coleta de Dados • Faixas Etárias
                  </h3>
                  <span className="text-[10px] text-cyan-300 font-mono">
                    Protocolo Ético LGPD / Resolução CNS 510/2016
                  </span>
                </div>
              </div>

              {onOpenAudienceManager && (
                <button
                  onClick={onOpenAudienceManager}
                  className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  Gerenciar / Criar Públicos
                </button>
              )}
            </div>

            {/* Quick Age Group Switcher */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Alternar Faixa Etária Ativa para Coleta:
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {audiences.length} públicos configurados
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {audiences.map((aud) => {
                  const isActive = aud.id === activeAudienceId;
                  return (
                    <button
                      key={aud.id}
                      onClick={() => onSelectActiveAudience?.(aud.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isActive
                          ? 'bg-cyan-500/30 border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.4)] ring-1 ring-cyan-400'
                          : 'bg-black/40 border-white/10 text-slate-300 hover:bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded ${
                          isActive ? 'bg-cyan-400 text-slate-950' : 'bg-white/10 text-cyan-300'
                        }`}>
                          {aud.ageRange}
                        </span>
                        {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300 shrink-0" />}
                      </div>
                      <span className="text-[11px] font-bold line-clamp-1 text-white">
                        {aud.categoryLabel.split('(')[0].trim()}
                      </span>
                      <span className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">
                        {aud.schoolGradeDefault}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Audience Summary */}
            {(() => {
              const current = audiences.find((a) => a.id === activeAudienceId) || audiences[1];
              if (!current) return null;
              return (
                <div className="bg-black/50 border border-cyan-400/25 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-cyan-300 text-sm">{current.name}</span>
                      <span className="bg-cyan-400/10 text-cyan-200 text-[10px] font-mono px-2 py-0.5 rounded-full border border-cyan-400/30">
                        {current.ageRange}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Meta Amostral: {current.targetSampleSize || 50} participantes
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed max-w-2xl">
                      {current.description}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1">
                      <span><strong>Segmento:</strong> {current.schoolGradeDefault}</span>
                      <span>•</span>
                      <span><strong>Plataformas Foco:</strong> {current.focusPlatforms.join(', ')}</span>
                    </div>
                  </div>

                  {onOpenAudienceManager && (
                    <button
                      onClick={onOpenAudienceManager}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-[11px] font-bold text-white transition-all whitespace-nowrap cursor-pointer shrink-0"
                    >
                      Editar Metas da Coorte
                    </button>
                  )}
                </div>
              );
            })()}
          </div>

          {/* SECTION 1: GAMEPLAY, PERGUNTAS & LEITURA POR VOZ */}
          <div className="bg-black/30 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  1. Dinâmica das Perguntas (SAS-SMU) & Narração de Voz
                </h3>
              </div>
              <span className="text-xs font-mono text-cyan-300 bg-cyan-500/15 border border-cyan-400/30 px-2.5 py-0.5 rounded-lg">
                Intervalo: {safeSettings.questionInterval}s
              </span>
            </div>

            {/* Question Interval Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">
                  Intervalo de Tempo entre cada Pergunta:
                </span>
                <span className="font-mono font-bold text-cyan-300 text-sm">
                  {safeSettings.questionInterval} segundos
                </span>
              </div>
              
              <input
                type="range"
                min="5"
                max="90"
                step="5"
                value={safeSettings.questionInterval}
                onChange={(e) => onUpdateSettings({ questionInterval: Number(e.target.value) })}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>5s (Frequente)</span>
                <span>15s (Padrão)</span>
                <span>30s (Moderado)</span>
                <span>60s (Espaçado)</span>
                <span>90s (Longo)</span>
              </div>

              {/* Quick Select Pills */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] text-slate-400 mr-1">Atalhos rápidos:</span>
                {intervalPresets.map((val) => (
                  <button
                    key={val}
                    onClick={() => onUpdateSettings({ questionInterval: val })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      safeSettings.questionInterval === val
                        ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                    }`}
                  >
                    {val}s
                  </button>
                ))}
              </div>
            </div>

            {/* TTS Voice Reading & Auto Pause Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
              {/* Tutorial Narrado de Boas-Vindas (Primeiros 30s) */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/60 p-3.5 rounded-xl border border-indigo-400/40 sm:col-span-2 gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    safeSettings.enableWelcome30sTutorial !== false ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-400/40 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-red-500/20 text-red-300 border border-red-400/30'
                  }`}>
                    <Sparkles className="w-4 h-4 text-indigo-300 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-indigo-200 block">Tutorial Narrado de Boas-Vindas (Primeiros 30s)</span>
                    <span className="text-[10px] text-slate-300 block">
                      {safeSettings.enableWelcome30sTutorial !== false
                        ? 'Guia com narração e cards nos primeiros 30s destacando Itens de Bem-Estar vs Notificações Invasivas'
                        : 'Desativado (inicia direto sem tutorial)'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {onStart30sTutorial && (
                    <button
                      onClick={() => {
                        onClose();
                        onStart30sTutorial();
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-black font-black text-[10px] uppercase tracking-wider rounded-lg shadow-md flex items-center gap-1 cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                      title="Iniciar partida com o tutorial narrado de 30 segundos"
                    >
                      <Play className="w-3 h-3 fill-black" />
                      <span>Reproduzir Tutorial (30s)</span>
                    </button>
                  )}
                  <button
                    onClick={() => onUpdateSettings({ enableWelcome30sTutorial: safeSettings.enableWelcome30sTutorial === false ? true : false })}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                      safeSettings.enableWelcome30sTutorial !== false ? 'bg-indigo-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                        safeSettings.enableWelcome30sTutorial !== false ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Assistente de Tutorial por Voz (Widget HQ) */}
              <div className="flex items-center justify-between bg-amber-500/10 p-3 rounded-xl border border-amber-400/30 sm:col-span-2">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    safeSettings.showVoiceAssistant !== false ? 'bg-amber-400 text-black border border-amber-300' : 'bg-red-500/20 text-red-300 border border-red-400/30'
                  }`}>
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-amber-200 block">Assistente de Tutorial por Voz (Widget HQ)</span>
                    <span className="text-[10px] text-slate-300 block">
                      {safeSettings.showVoiceAssistant !== false ? 'Robô flutuante ativo com voz e quadrinhos HQ' : 'Desativado'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onUpdateSettings({ showVoiceAssistant: safeSettings.showVoiceAssistant === false ? true : false })}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    safeSettings.showVoiceAssistant !== false ? 'bg-amber-400' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-black absolute top-1 transition-transform ${
                      safeSettings.showVoiceAssistant !== false ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Disable Question Reading (TTS) */}
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    safeSettings.enableQuestionTTS ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30' : 'bg-red-500/20 text-red-300 border border-red-400/30'
                  }`}>
                    {safeSettings.enableQuestionTTS ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Leitura Vocal das Perguntas</span>
                    <span className="text-[10px] text-slate-400 block">
                      {safeSettings.enableQuestionTTS ? 'Sintetizador de voz ativo' : 'Desabilitado (Apenas texto na tela)'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onUpdateSettings({ enableQuestionTTS: !safeSettings.enableQuestionTTS })}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    safeSettings.enableQuestionTTS ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      safeSettings.enableQuestionTTS ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>


            </div>

            {/* Expanded Voice Selection & Modifiers (Only visible when TTS enabled) */}
            {safeSettings.enableQuestionTTS && (
              <div className="bg-cyan-950/30 border border-cyan-500/20 rounded-xl p-4 space-y-3 pt-3 animate-fade-in">
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-cyan-400" /> Personalização da Voz do Sintetizador TTS:
                  </span>
                  <button
                    onClick={() => {
                      speakQuestion(
                        "Esta é uma demonstração do tom e velocidade da voz configurada no simulador.",
                        true,
                        {
                          voiceURI: safeSettings.ttsVoiceURI,
                          pitch: safeSettings.ttsPitch,
                          rate: safeSettings.ttsRate,
                        }
                      );
                    }}
                    className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                  >
                    <Play className="w-3 h-3 text-cyan-400 fill-cyan-400" /> Testar Voz
                  </button>
                </div>

                {/* Voice Selection Dropdown */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300 block">
                    Voz em Português (pt-BR) Instalada no Navegador:
                  </label>
                  <select
                    value={safeSettings.ttsVoiceURI || ''}
                    onChange={(e) => onUpdateSettings({ ttsVoiceURI: e.target.value })}
                    className="w-full bg-[#070b14] border border-cyan-500/30 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-sans"
                  >
                    <option value="">-- Seleção Automática Recomendada (Português pt-BR) --</option>
                    {availableVoices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang}) {v.default ? '★ Padrão' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pitch & Speed Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Pitch / Tom */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-medium">Tom / Agudeza da Voz (Pitch):</span>
                      <span className="font-mono text-cyan-300 font-bold">{(safeSettings.ttsPitch ?? 1.0).toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.1"
                      value={safeSettings.ttsPitch ?? 1.0}
                      onChange={(e) => onUpdateSettings({ ttsPitch: Number(e.target.value) })}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                      <span>Grave (0.5x)</span>
                      <span>Normal (1.0x)</span>
                      <span>Agudo (1.5x)</span>
                    </div>
                  </div>

                  {/* Rate / Speed */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-medium">Velocidade de Fala (Speed):</span>
                      <span className="font-mono text-cyan-300 font-bold">{(safeSettings.ttsRate ?? 1.0).toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.1"
                      value={safeSettings.ttsRate ?? 1.0}
                      onChange={(e) => onUpdateSettings({ ttsRate: Number(e.target.value) })}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                      <span>Lento (0.5x)</span>
                      <span>Normal (1.0x)</span>
                      <span>Rápido (1.5x)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION: EFEITOS SONOROS INDIVIDUAIS (SFX) */}
          <div className="bg-black/30 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Configuração de Efeitos Sonoros Individuais (SFX)
                </h3>
              </div>
              <span className="text-xs font-mono text-cyan-300 bg-cyan-500/15 border border-cyan-400/30 px-2.5 py-0.5 rounded-lg">
                Áudio Personalizado
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Habilite ou desabilite cada efeito sonoro individualmente de acordo com sua preferência:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'sfxObstacleHit', label: 'Colisão com Obstáculos', desc: 'Som de batida em barreiras e buracos' },
                { key: 'sfxHarmfulHit', label: 'Itens Nocivos / Notificações', desc: 'Som ao receber penalidade de ansiedade' },
                { key: 'sfxCoinCollect', label: 'Coleta de Moedas de Ouro', desc: 'Arpejo metálico ao pegar moedas' },
                { key: 'sfxWellnessCollect', label: 'Coleta de Bem-Estar / Bônus', desc: 'Acorde harmonioso positivo' },
                { key: 'sfxSoccer', label: 'Partida de Futebol (Chute/Gol)', desc: 'Sons de chute na bola e comemoração' },
                { key: 'sfxFishing', label: 'Atividade de Pescaria', desc: 'Som de respingos e fisgada de peixe' },
                { key: 'sfxPigeon', label: 'Alimentar Pássaros (Praça)', desc: 'Som suave dos pombos coadjuvantes' },
                { key: 'sfxHorse', label: 'Acariciar Cavalo', desc: 'Timbre aconchegante no haras' },
                { key: 'sfxDog', label: 'Latido do Cachorrinho', desc: 'Som amigável do cão na pista' },
              ].map((sfx) => {
                const isEnabled = (safeSettings as any)[sfx.key] !== false;
                return (
                  <div key={sfx.key} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                    <div>
                      <span className="text-xs font-bold text-white block">{sfx.label}</span>
                      <span className="text-[10px] text-slate-400 block">{sfx.desc}</span>
                    </div>
                    <button
                      onClick={() => onUpdateSettings({ [sfx.key]: !isEnabled })}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                        isEnabled ? 'bg-cyan-500' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                          isEnabled ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: DIFICULDADE & PROPORÇÃO DE ELEMENTOS NOCIVOS VS BENÉFICOS */}
          <div className="bg-black/30 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  2. Dificuldade & Proporção de Elementos (%)
                </h3>
              </div>
              <span className="text-xs font-mono text-amber-300 bg-amber-500/15 border border-amber-400/30 px-2.5 py-0.5 rounded-lg">
                Modo: {(safeSettings.gameDifficulty || 'normal').toUpperCase()}
              </span>
            </div>

            {/* Game Difficulty Selector */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-white block">Dificuldade do Jogo:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'facil', name: 'Fácil', desc: 'Lento, baixa ansiedade', color: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300' },
                  { id: 'normal', name: 'Normal', desc: 'Equilíbrio padrão', color: 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300' },
                  { id: 'dificil', name: 'Difícil', desc: 'Notificações rápidas', color: 'border-amber-500/50 bg-amber-500/15 text-amber-300' },
                  { id: 'extremo', name: 'Extremo', desc: 'Sobrecarga intensa', color: 'border-red-500/50 bg-red-500/15 text-red-300' },
                ].map((diff) => (
                  <button
                    key={diff.id}
                    onClick={() => onUpdateSettings({ gameDifficulty: diff.id as any })}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      safeSettings.gameDifficulty === diff.id
                        ? `${diff.color} shadow-lg ring-1 ring-white/20`
                        : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold uppercase tracking-wider">{diff.name}</div>
                    <div className="text-[10px] opacity-80 mt-0.5">{diff.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Harmful vs Beneficial Volume Percentages */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-cyan-400" /> Proporção de Elementos Caindo no Cenário:
                </span>
                <span className="text-xs font-mono font-bold text-cyan-300">
                  {safeSettings.harmfulPercent}% Nocivos / {safeSettings.beneficialPercent}% Benéficos
                </span>
              </div>

              {/* Visual Proportion Bar */}
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex border border-white/10">
                <div
                  style={{ width: `${safeSettings.harmfulPercent}%` }}
                  className="bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-300"
                  title={`Elementos Nocivos: ${safeSettings.harmfulPercent}%`}
                />
                <div
                  style={{ width: `${safeSettings.beneficialPercent}%` }}
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300"
                  title={`Elementos Benéficos: ${safeSettings.beneficialPercent}%`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Harmful Sliders */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-red-300 font-bold flex items-center gap-1">
                      <Skull className="w-3.5 h-3.5" /> Nocivos (Notificações, Feeds):
                    </span>
                    <span className="font-mono text-red-300 font-bold">{safeSettings.harmfulPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="5"
                    value={safeSettings.harmfulPercent}
                    onChange={(e) => {
                      const hVal = Number(e.target.value);
                      onUpdateSettings({
                        harmfulPercent: hVal,
                        beneficialPercent: 100 - hVal,
                      });
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                </div>

                {/* Beneficial Sliders */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-emerald-300 font-bold flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5" /> Benéficos (Livro, Café, Cão):
                    </span>
                    <span className="font-mono text-emerald-300 font-bold">{safeSettings.beneficialPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="5"
                    value={safeSettings.beneficialPercent}
                    onChange={(e) => {
                      const bVal = Number(e.target.value);
                      onUpdateSettings({
                        beneficialPercent: bVal,
                        harmfulPercent: 100 - bVal,
                      });
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              </div>

              {/* Item Density & Invincible Training Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-300 block">Densidade de Itens:</span>
                  <div className="grid grid-cols-4 gap-1">
                    {(['baixa', 'normal', 'alta', 'caos'] as const).map((den) => (
                      <button
                        key={den}
                        onClick={() => onUpdateSettings({ itemSpawnDensity: den })}
                        className={`py-1 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer ${
                          safeSettings.itemSpawnDensity === den
                            ? 'bg-amber-500 text-black shadow-md'
                            : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                        }`}
                      >
                        {den}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between bg-white/5 p-2.5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">Modo Treino Invulnerável</span>
                      <span className="text-[10px] text-slate-400 block">Ansiedade travada em zero</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onUpdateSettings({ invincibleTrainingMode: !safeSettings.invincibleTrainingMode })}
                    className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                      safeSettings.invincibleTrainingMode ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-transform ${
                        safeSettings.invincibleTrainingMode ? 'translate-x-5.5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>




              </div>
            </div>
          </div>

          {/* SECTION 3: GRÁFICOS, RENDERIZAÇÃO, SOMBRAS & CÂMERA 3D */}
          <div className="bg-black/30 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  3. Renderização, Sombras & Câmera 3D
                </h3>
              </div>
              <span className="text-xs font-mono text-purple-300 bg-purple-500/15 border border-purple-400/30 px-2.5 py-0.5 rounded-lg">
                {safeSettings.mode3D ? 'Motor 3D Perspectiva' : 'Motor 2D Lateral'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Predefinição Geral de Desempenho Gráfico */}
              <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-purple-950/40 p-4 rounded-xl border border-cyan-500/30 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                      <Gauge className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Predefinição de Desempenho Gráfico</span>
                      <span className="text-[10px] text-cyan-300/80 block">
                        Ajuste rápido de taxa de quadros, sombras e resolução
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={() =>
                      onUpdateSettings({
                        graphicsPreset: 'desempenho',
                        enableShadows: false,
                        resolutionScale: 0.75,
                        fpsLimit: 60,
                      })
                    }
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 border ${
                      safeSettings.graphicsPreset === 'desempenho' || (!safeSettings.enableShadows && safeSettings.resolutionScale <= 0.75)
                        ? 'bg-amber-500/25 border-amber-400/60 text-amber-200 shadow-lg shadow-amber-500/10'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-sm">⚡</span>
                    <span className="text-[11px]">Desempenho</span>
                    <span className="text-[8px] font-mono text-amber-300/80">Sem Sombra • 75%</span>
                  </button>

                  <button
                    onClick={() =>
                      onUpdateSettings({
                        graphicsPreset: 'equilibrado',
                        enableShadows: true,
                        resolutionScale: 1.0,
                        fpsLimit: 60,
                      })
                    }
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 border ${
                      safeSettings.graphicsPreset === 'equilibrado' || (safeSettings.enableShadows && safeSettings.resolutionScale === 1.0)
                        ? 'bg-cyan-500/25 border-cyan-400/60 text-cyan-200 shadow-lg shadow-cyan-500/10'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-sm">⚖️</span>
                    <span className="text-[11px]">Equilibrado</span>
                    <span className="text-[8px] font-mono text-cyan-300/80">Sombra Normal • 100%</span>
                  </button>

                  <button
                    onClick={() =>
                      onUpdateSettings({
                        graphicsPreset: 'ultra',
                        enableShadows: true,
                        resolutionScale: 1.25,
                        fpsLimit: 120,
                      })
                    }
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 border ${
                      safeSettings.graphicsPreset === 'ultra' || (safeSettings.enableShadows && safeSettings.resolutionScale >= 1.25)
                        ? 'bg-purple-500/25 border-purple-400/60 text-purple-200 shadow-lg shadow-purple-500/10'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-sm">✨</span>
                    <span className="text-[11px]">Ultra</span>
                    <span className="text-[8px] font-mono text-purple-300/80">Máxima Qualidade • 125%</span>
                  </button>
                </div>
              </div>

              {/* Toggle 3D vs 2D */}
              <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
                    <Box className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Visualização 3D / 2D</span>
                    <span className="text-[10px] text-slate-400 block">
                      {safeSettings.mode3D ? 'Câmera Perspectiva 3D' : 'Visão Lateral 2D Plana (Econômica)'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onUpdateSettings({ mode3D: !safeSettings.mode3D })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                    safeSettings.mode3D
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                  }`}
                >
                  {safeSettings.mode3D ? '3D' : '2D PLANO'}
                </button>
              </div>

              {/* Toggle Shadows */}
              <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/20 border border-yellow-400/30 flex items-center justify-center text-yellow-300">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Sombras Dinâmicas</span>
                    <span className="text-[10px] text-slate-400 block">
                      {safeSettings.enableShadows ? 'Sombras ativadas no piso' : 'Desabilitadas (Ganho de FPS)'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onUpdateSettings({ enableShadows: !safeSettings.enableShadows })}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    safeSettings.enableShadows ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      safeSettings.enableShadows ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle Textures */}
              <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Texturas & Materiais</span>
                    <span className="text-[10px] text-slate-400 block">
                      {safeSettings.enableTextures ? 'Renderização de texturas detalhadas' : 'Cores planas sólidas (Flat)'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onUpdateSettings({ enableTextures: !safeSettings.enableTextures })}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    safeSettings.enableTextures ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      safeSettings.enableTextures ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>



              {/* Render Depth / Distance */}
              <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 flex flex-col justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Profundidade do Horizonte</span>
                    <span className="text-[10px] text-slate-400 block">Alcance do plano de corte da câmera</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['curta', 'media', 'longa'] as const).map((depth) => (
                    <button
                      key={depth}
                      onClick={() => onUpdateSettings({ renderDepth: depth })}
                      className={`py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                        safeSettings.renderDepth === depth
                          ? 'bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                      }`}
                    >
                      {depth}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Resolution Scale, FPS Limit & Camera FOV */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-white/5">
              {/* Resolution Scale */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-cyan-400" /> Resolução:
                  </span>
                  <span className="font-mono text-cyan-300 font-bold">
                    {Math.round(safeSettings.resolutionScale * 100)}%
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { label: '50%', val: 0.5 },
                    { label: '75%', val: 0.75 },
                    { label: '100%', val: 1.0 },
                    { label: '125%', val: 1.25 },
                  ].map((res) => (
                    <button
                      key={res.val}
                      onClick={() => onUpdateSettings({ resolutionScale: res.val })}
                      className={`py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        safeSettings.resolutionScale === res.val
                          ? 'bg-cyan-500 text-black shadow-md'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                      }`}
                    >
                      {res.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* FPS Limit */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white flex items-center gap-1">
                    <Monitor className="w-3.5 h-3.5 text-purple-400" /> Quadros (FPS):
                  </span>
                  <span className="font-mono text-purple-300 font-bold">
                    {safeSettings.fpsLimit === 0 ? 'Livre' : `${safeSettings.fpsLimit} FPS`}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { label: '30', val: 30 },
                    { label: '60', val: 60 },
                    { label: '120', val: 120 },
                    { label: 'Max', val: 0 },
                  ].map((fps) => (
                    <button
                      key={fps.val}
                      onClick={() => onUpdateSettings({ fpsLimit: fps.val })}
                      className={`py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        safeSettings.fpsLimit === fps.val
                          ? 'bg-purple-500 text-white shadow-md'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                      }`}
                    >
                      {fps.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Camera FOV */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white flex items-center gap-1">
                    <Maximize2 className="w-3.5 h-3.5 text-amber-400" /> Câmera FOV:
                  </span>
                  <span className="font-mono text-amber-300 font-bold">{safeSettings.cameraFOV}°</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="90"
                  step="5"
                  value={safeSettings.cameraFOV}
                  onChange={(e) => onUpdateSettings({ cameraFOV: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: ÁUDIO, HUD & ACESSIBILIDADE */}
          <div className="bg-black/30 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  4. Áudio & Métricas de Desempenho na Tela
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* SFX Volume */}
              <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white">Volume dos Efeitos Sonoros</span>
                  <span className="font-mono text-emerald-300 font-bold">{safeSettings.sfxVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={safeSettings.sfxVolume}
                  onChange={(e) => onUpdateSettings({ sfxVolume: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
              </div>

              {/* Show FPS Counter */}
              <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Exibir Contador de FPS</span>
                  <span className="text-[10px] text-slate-400 block">Exibe estatísticas de quadros na HUD</span>
                </div>
                <button
                  onClick={() => onUpdateSettings({ showFPSCounter: !safeSettings.showFPSCounter })}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                    safeSettings.showFPSCounter ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-transform ${
                      safeSettings.showFPSCounter ? 'translate-x-5.5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Touch Button Size */}
              <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1">
                <span className="text-xs font-bold text-white block">Tamanho dos Botões Touch</span>
                <div className="grid grid-cols-3 gap-1">
                  {(['pequeno', 'medio', 'grande'] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => onUpdateSettings({ touchButtonsSize: sz })}
                      className={`py-1 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer ${
                        safeSettings.touchButtonsSize === sz
                          ? 'bg-emerald-500 text-black shadow-md'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: CONTROLE BLUETOOTH / GAMEPAD JOYSTICK */}
          <div className="bg-black/30 border border-cyan-500/30 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Gamepad className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  5. Controle Bluetooth & Gamepad USB / Joystick
                </h3>
              </div>
              <span className={`text-xs font-mono px-2.5 py-0.5 rounded-lg border ${
                gamepadConfig?.enabled
                  ? 'text-cyan-300 bg-cyan-500/20 border-cyan-400/40 font-bold'
                  : 'text-slate-400 bg-white/5 border-white/10'
              }`}>
                {gamepadConfig?.enabled ? 'Mapeamento Ativo' : 'Desativado'}
              </span>
            </div>

            <div className="bg-gradient-to-r from-cyan-950/40 via-purple-950/20 to-black p-4 rounded-xl border border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-xs font-bold text-white block">
                  Configurar Mapeamento & Sensibilidade do Joystick
                </span>
                <p className="text-[11px] text-slate-400 max-w-lg">
                  Emparelhe controles de Xbox, PlayStation (PS4/PS5), Switch Pro ou Joysticks Bluetooth universais para movimentar o avatar.
                </p>
              </div>

              {onOpenGamepadModal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenGamepadModal();
                  }}
                  className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border border-cyan-400/50 rounded-xl text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all flex items-center gap-2 shrink-0 cursor-pointer active:scale-95"
                >
                  <Gamepad className="w-4 h-4 text-cyan-200" /> Calibrar Controle
                </button>
              )}
            </div>
          </div>

          {/* SECTION 6: OCULTAR CARDS E ELEMENTOS DA HUD */}
          <div className="bg-black/30 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <EyeOff className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  6. Visibilidade & Ocultar Cards do HUD
                </h3>
              </div>
              <span className="text-[10px] text-indigo-300 bg-indigo-500/15 border border-indigo-400/30 px-2.5 py-0.5 rounded-lg uppercase font-bold">
                Personalização Visual
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Escolha quais elementos ou cards flutuantes da interface do jogo você deseja manter visíveis ou ocultar para uma experiência limpa (Imersão Total).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">


              {/* Ocultar Barra de Ansiedade e Velocidade */}
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-400/30 flex items-center justify-center text-red-300">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Ansiedade & Velocidade</span>
                    <span className="text-[10px] text-slate-400 block">
                      {safeSettings.hideAnxietySpeedCard ? 'Oculto da tela' : 'Visível no topo direito'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onUpdateSettings({ hideAnxietySpeedCard: !safeSettings.hideAnxietySpeedCard })}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer ${
                    safeSettings.hideAnxietySpeedCard
                      ? 'bg-red-500/20 text-red-300 border border-red-400/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                  }`}
                >
                  {safeSettings.hideAnxietySpeedCard ? 'Oculto' : 'Visível'}
                </button>
              </div>

              {/* Ocultar Troféus e Pontuação de Bem-Estar */}
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                    <Heart className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Pontuação & Troféu de Bem-estar</span>
                    <span className="text-[10px] text-slate-400 block">
                      {safeSettings.hideTrophiesScoreCard ? 'Oculto da tela' : 'Visível no topo esquerdo'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onUpdateSettings({ hideTrophiesScoreCard: !safeSettings.hideTrophiesScoreCard })}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer ${
                    safeSettings.hideTrophiesScoreCard
                      ? 'bg-red-500/20 text-red-300 border border-red-400/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                  }`}
                >
                  {safeSettings.hideTrophiesScoreCard ? 'Oculto' : 'Visível'}
                </button>
              </div>

              {/* Ocultar Card de Pergunta e Leitura Vocal TTS */}
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Card do Leitor de Pergunta</span>
                    <span className="text-[10px] text-slate-400 block">
                      {safeSettings.hideQuestionTTSCard ? 'Oculto da tela' : 'Visível na barra lateral'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onUpdateSettings({ hideQuestionTTSCard: !safeSettings.hideQuestionTTSCard })}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer ${
                    safeSettings.hideQuestionTTSCard
                      ? 'bg-red-500/20 text-red-300 border border-red-400/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                  }`}
                >
                  {safeSettings.hideQuestionTTSCard ? 'Oculto' : 'Visível'}
                </button>
              </div>

              {/* Ocultar Botões Touch / Joystick na Tela */}
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                    <Gamepad className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Botões Virtuais Touch na Tela</span>
                    <span className="text-[10px] text-slate-400 block">
                      {safeSettings.hideControlsCard ? 'Ocultos (Recomendado ao usar Teclado)' : 'Visíveis no rodapé'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onUpdateSettings({ hideControlsCard: !safeSettings.hideControlsCard })}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer ${
                    safeSettings.hideControlsCard
                      ? 'bg-red-500/20 text-red-300 border border-red-400/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                  }`}
                >
                  {safeSettings.hideControlsCard ? 'Ocultos' : 'Visíveis'}
                </button>
              </div>

              {/* Ocultar / Desabilitar Loja de Habilidades */}
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Loja de Habilidades</span>
                    <span className="text-[10px] text-slate-400 block">
                      {safeSettings.hideShopButton ? 'Oculta e desativada' : 'Visível na barra superior'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onUpdateSettings({ hideShopButton: !safeSettings.hideShopButton })}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer ${
                    safeSettings.hideShopButton
                      ? 'bg-red-500/20 text-red-300 border border-red-400/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                  }`}
                >
                  {safeSettings.hideShopButton ? 'Oculta' : 'Visível'}
                </button>
              </div>

              {/* Ciclo de Iluminação Baseado na Ansiedade */}
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-400/30 flex items-center justify-center text-orange-300">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Iluminação por Ansiedade</span>
                    <span className="text-[10px] text-slate-400 block">
                      {safeSettings.disableAnxietyLighting ? 'Luz constante (Dia padrão)' : 'Dinâmica com a ansiedade'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onUpdateSettings({ disableAnxietyLighting: !safeSettings.disableAnxietyLighting })}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer ${
                    safeSettings.disableAnxietyLighting
                      ? 'bg-red-500/20 text-red-300 border border-red-400/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                  }`}
                >
                  {safeSettings.disableAnxietyLighting ? 'Travado' : 'Dinâmico'}
                </button>
              </div>



              {/* Ocultar Votação na Tela Inicial */}
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
                    <Vote className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Votação na Tela Inicial</span>
                    <span className="text-[10px] text-slate-400 block">
                      {safeSettings.hideVotingCard ? 'Oculta da tela inicial' : 'Visível na tela inicial'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onUpdateSettings({ hideVotingCard: !safeSettings.hideVotingCard })}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer ${
                    safeSettings.hideVotingCard
                      ? 'bg-red-500/20 text-red-300 border border-red-400/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                  }`}
                >
                  {safeSettings.hideVotingCard ? 'Oculta' : 'Visível'}
                </button>
              </div>

              {/* Modo de Iluminação (Dia / Noite / Auto) */}
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                    {safeSettings.dayNightMode === 'night' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Modo de Iluminação (HUD)</span>
                    <span className="text-[10px] text-slate-400 block">
                      {safeSettings.dayNightMode === 'day' ? 'Sempre dia ☀️' : safeSettings.dayNightMode === 'night' ? 'Sempre noite 🌙' : 'Automático por ansiedade'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const nextMode = safeSettings.dayNightMode === 'auto' ? 'day' : safeSettings.dayNightMode === 'day' ? 'night' : 'auto';
                    onUpdateSettings({ dayNightMode: nextMode });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer ${
                    safeSettings.dayNightMode === 'day'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                      : safeSettings.dayNightMode === 'night'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/40'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                  }`}
                >
                  {safeSettings.dayNightMode === 'day' ? 'Dia ☀️' : safeSettings.dayNightMode === 'night' ? 'Noite 🌙' : 'Auto ⚡'}
                </button>
              </div>

              {/* Clima e Atmosfera Dinâmica */}
              <div className="flex flex-col bg-white/5 p-3.5 rounded-xl border border-white/5 gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                      <Cloud className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Preset de Clima & Atmosfera</span>
                      <span className="text-[10px] text-slate-400 block">
                        Alterne entre Sol, Pôr do Sol, Garoa Zen, Neblina ou Noite Estrelada
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                  {[
                    { id: 'auto', label: '⚡ Auto', color: 'border-cyan-400/40 text-cyan-300 bg-cyan-500/15' },
                    { id: 'clear', label: '☀️ Sol', color: 'border-amber-400/40 text-amber-300 bg-amber-500/15' },
                    { id: 'sunset', label: '🌅 Sunset', color: 'border-orange-400/40 text-orange-300 bg-orange-500/15' },
                    { id: 'night', label: '🌙 Noite', color: 'border-indigo-400/40 text-indigo-300 bg-indigo-500/15' },
                    { id: 'rain', label: '🌧️ Garoa', color: 'border-blue-400/40 text-blue-300 bg-blue-500/15' },
                    { id: 'fog', label: '🌫️ Neblina', color: 'border-slate-400/40 text-slate-300 bg-slate-500/15' },
                  ].map((preset) => {
                    const active = (safeSettings.weatherPreset || 'auto') === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => onUpdateSettings({ weatherPreset: preset.id as any })}
                        className={`px-2 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center border ${
                          active
                            ? `${preset.color} ring-2 ring-cyan-400/50 shadow-md`
                            : 'bg-black/30 text-slate-400 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {/* Toggle: Som Ambiental do Clima */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-xs font-semibold text-slate-200">Som Ambiental de Clima (Chuva, Passarinhos, Vento)</span>
                  </div>
                  <button
                    onClick={() => onUpdateSettings({ weatherAmbientSound: !safeSettings.weatherAmbientSound })}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      safeSettings.weatherAmbientSound !== false
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                        : 'bg-slate-700/50 text-slate-400 border border-slate-600/40'
                    }`}
                  >
                    {safeSettings.weatherAmbientSound !== false ? 'Ativado' : 'Desativado'}
                  </button>
                </div>
              </div>

              {/* Cenário do Horizonte (Casas, Montanhes, Florestas e Animais) */}
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Cenário do Horizonte</span>
                    <span className="text-[10px] text-slate-400 block">
                      {safeSettings.hideHorizonScenery ? 'Oculto (Casas, montanhas, animais)' : 'Visível (Casas, montanhas, animais)'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onUpdateSettings({ hideHorizonScenery: !safeSettings.hideHorizonScenery })}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer ${
                    safeSettings.hideHorizonScenery
                      ? 'bg-slate-700/50 text-slate-400 border border-slate-600/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                  }`}
                >
                  {safeSettings.hideHorizonScenery ? 'Desativado' : 'Ativado'}
                </button>
              </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between bg-black/40 flex-wrap gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Restaurar Padrões
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" /> Aplicar & Salvar Configurações
          </button>
        </div>
      </div>
      <MasterAIEnhancerModal
        isOpen={isMasterAIModalOpen}
        onClose={() => setIsMasterAIModalOpen(false)}
        currentSettings={safeSettings}
        onUpdateSettings={onUpdateSettings}
      />
    </div>
  </div>
);
};
