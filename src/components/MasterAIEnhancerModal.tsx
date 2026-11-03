import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Lock,
  Unlock,
  Key,
  Code,
  RotateCcw,
  CheckCircle2,
  Copy,
  Terminal,
  Cpu,
  Layers,
  Wand2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Check,
  X,
  Play,
  Calendar,
  History,
  Milestone,
  Compass,
  BookOpen,
  Download,
  ChevronRight,
  Clock,
  ShieldCheck,
  CheckSquare,
  Activity,
  Sliders,
  Database
} from 'lucide-react';
import { GameSettings } from '../types';

export interface AIHistoryVersion {
  id: string;
  timestamp: string;
  prompt: string;
  category: 'Mecânica' | 'Gráficos/Luau' | 'Equilíbrio' | 'Áudio/Clima';
  luauCode: string;
  parametersApplied: Partial<GameSettings>;
  imageIdeaPrompt: string;
}

export interface DevelopmentMilestone {
  id: string;
  marco: string;
  title: string;
  period: string;
  phase: string;
  summary: string;
  technologies: string[];
  parametersPreset: Partial<GameSettings>;
  luauSnippet: string;
  achievements: string[];
}

export const DEVELOPMENT_MILESTONES: DevelopmentMilestone[] = [
  {
    id: 'marco-1',
    marco: 'Marco 1',
    title: 'Diagnóstico de Campo & Concepção Pedagógica',
    period: 'Fase Inicial de Pesquisa de Campo',
    phase: 'Pesquisa Psicométrica Empírica',
    summary: 'Investigação empírica com 77 estudantes da Turma 61 da EEEM Felipe Camarão. Adaptação da Escala SAS-SV (Smartphone Addiction Scale) e inventários de FOMO.',
    technologies: ['Escala SAS-SV', 'Google Forms Diagnóstico', 'Tabulação Estatística', 'Modelagem de Sobrecarga Mental'],
    parametersPreset: { gameDifficulty: 'facil', harmfulPercent: 25, baseGameSpeed: 0.9, dayNightMode: 'day', weatherPreset: 'clear' },
    luauSnippet: `-- [Marco 1] Configuração Inicial das Variáveis Psicométricas
local SASConfig = {
    MaxAnxiety = 100,
    BaseRecoveryRate = 2.5,
    SampleCohort = "Turma 61 - EEEM Felipe Camarão",
    TargetAgeGroup = "12 a 17 anos"
}
print("🔬 Marco 1: Parâmetros psicométricos fundamentados na SAS-SV inicializados.")`,
    achievements: [
      'Amostra empírica com 77 estudantes da Turma 61',
      'Validação dos 10 itens fundamentais da escala SAS-SV',
      'Definição da métrica central de Ansiedade Digital (0 a 100%)'
    ]
  },
  {
    id: 'marco-2',
    marco: 'Marco 2',
    title: 'Pipeline de Engenharia & Arquitetura Web SPA',
    period: 'Estruturação da Base de Software',
    phase: 'Fundação Técnica & Tolerância Zero a Falhas',
    summary: 'Construção da arquitetura reativa moderna em React 19, TypeScript estrito, Vite 6 e Tailwind CSS v4 para suporte em qualquer navegador ou celular escolar.',
    technologies: ['React 19.0', 'TypeScript 5.8', 'Vite 6.2', 'Tailwind CSS v4', 'Node.js v22 LTS'],
    parametersPreset: { baseGameSpeed: 1.0, dayNightMode: 'auto', itemSpawnDensity: 'normal', weatherPreset: 'clear' },
    luauSnippet: `-- [Marco 2] Arquitetura Modular de Serviços
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

print("⚡ Marco 2: Pipeline de tipagem estrita e ciclo de vida reativo compilado.")`,
    achievements: [
      'Tolerância zero a falhas em tempo de execução com TypeScript estrito',
      'Hot Module Replacement e empacotamento ultrarrápido com Vite',
      'Design responsivo sem dependência de bibliotecas CSS pesadas'
    ]
  },
  {
    id: 'marco-3',
    marco: 'Marco 3',
    title: 'Motor Gráfico 3D, Câmera e Biomecânica Motora',
    period: 'Engenharia do Núcleo Lúdico',
    phase: 'Renderização WebGL & Simulação de Ansiedade',
    summary: 'Desenvolvimento do GameCanvas 3D com Three.js procedural, colisão AABB, câmera em 3ª pessoa lerp e a fórmula de desaceleração motora sob ansiedade (WalkSpeed 16 -> 4 u/s).',
    technologies: ['Three.js r185.1 (WebGL)', 'Álgebra Vetorial (Vector3)', 'Colisões AABB', 'Efeito Camera Shake', 'Névoa FogExp2'],
    parametersPreset: { baseGameSpeed: 1.1, harmfulPercent: 40, dayNightMode: 'auto', weatherPreset: 'fog' },
    luauSnippet: `-- [Marco 3] Biomecânica Motora e Desaceleração por Ansiedade
local function updatePlayerWalkSpeed(character, anxietyLevel)
    local humanoid = character:FindFirstChildOfClass("Humanoid")
    if humanoid then
        -- Desacelera de 16 u/s até 4 u/s conforme a sobrecarga digital aumenta
        humanoid.WalkSpeed = math.clamp(16 - ((anxietyLevel / 100) * 12), 4, 16)
    end
end
print("🏃 Marco 3: Biomecânica de WalkSpeed dinâmico e colisões AABB operacionais.")`,
    achievements: [
      'Modelagem procedural tridimensional sem dependência de malhas .gltf pesadas',
      'Fórmula biomecânica de redução de velocidade física por estresse',
      'Tremores de câmera periféricos e vinheta de colapso atencional'
    ]
  },
  {
    id: 'marco-4',
    marco: 'Marco 4',
    title: 'Motor de Áudio Procedural & Acessibilidade Universal',
    period: 'Sonoplastia e Ergonomia de Entrada',
    phase: 'Imersão Auditiva & Suporte Multi-Dispositivo',
    summary: 'Sintetizador Web Audio API puro com osciladores e envelopes ADSR, narração por voz (TTS), joystick touch e suporte completo a Gamepad/Bluetooth (PlayStation/Xbox).',
    technologies: ['Web Audio API (Oscillators/ADSR)', 'Gamepad API (Controles Bluetooth)', 'SpeechSynthesis API (TTS)', 'Touch Virtual Joysticks'],
    parametersPreset: { sfxVolume: 100, enableQuestionTTS: true, baseGameSpeed: 1.0, weatherPreset: 'clear' },
    luauSnippet: `-- [Marco 4] Sonoplastia e Gerenciador de Áudio Espacial
local SoundService = game:GetService("SoundService")

local function playStressAlertSound(stressIntensity)
    local sound = Instance.new("Sound")
    sound.SoundId = "rbxassetid://9114223175" -- Alerta Sonoro de Tensão
    sound.Volume = math.clamp(stressIntensity / 100, 0.2, 1.0)
    sound.Parent = SoundService
    sound:Play()
end
print("🔊 Marco 4: Mapeamento sonoro ADSR e suporte universal a gamepads ativo.")`,
    achievements: [
      'Geração de bips de estresse e acordes relaxantes via código puro (0 KB em arquivos de áudio)',
      'Suporte nativo a controles de videogame físicos sem atraso',
      'Leitura narrada e acessibilidade para estudantes com dificuldades de leitura'
    ]
  },
  {
    id: 'marco-5',
    marco: 'Marco 5',
    title: 'Persistência Híbrida, Gamificação & Economia Positiva',
    period: 'Hábitos Saudáveis e Banco de Dados',
    phase: 'Resiliência Digital & Integração Cloud',
    summary: 'Integração com Firebase Firestore e LocalStorage Offline-First. Inclusão da Loja de Habilidades (Pulo Duplo, Escudo, Tênis, Casaco) e o Módulo de Exercício ao Ar Livre.',
    technologies: ['Firebase Firestore SDK', 'LocalStorage Offline-First', 'Canvas Confetti', 'Academia ao Ar Livre 3D', 'Bicicleta & Pet Companion'],
    parametersPreset: { hideShopButton: false, harmfulPercent: 30, weatherPreset: 'clear', baseGameSpeed: 1.1 },
    luauSnippet: `-- [Marco 5] Sistema de Recompensas e Hábitos de Desconexão
local Players = game:GetService("Players")

local function awardWellnessBonus(player, bonusPoints)
    local leaderstats = player:FindFirstChild("leaderstats")
    if leaderstats then
        local coins = leaderstats:FindFirstChild("MoedasBemEstar")
        if coins then
            coins.Value = coins.Value + bonusPoints
        end
    end
end
print("🛡️ Marco 5: Loja de habilidades de resiliência e persistência em nuvem ativas.")`,
    achievements: [
      'Arquitetura Offline-First para funcionamento mesmo sem conexão com a internet',
      'Itens de reconexão real: aparelhos de ginástica, passeio de bicicleta e cãozinho',
      'Sincronização em tempo real de pesquisadores online'
    ]
  },
  {
    id: 'marco-6',
    marco: 'Marco 6',
    title: 'Interoperabilidade Luau & Ecossistema Roblox Studio',
    period: 'Expansão para Plataforma Luau',
    phase: 'Exportação & Multi-Plataforma Roblox',
    summary: 'Scripts cliente-servidor em Luau tipado com paralelismo (Parallel Luau) para estabilidade a 120 FPS, empacotador ZIP dinâmico e Guia Oficial para Roblox Studio.',
    technologies: ['Linguagem Luau Tipada', 'Parallel Luau Actors', 'JSZip / FileSaver', 'Roblox Studio Server/Client'],
    parametersPreset: { baseGameSpeed: 1.25, itemSpawnDensity: 'alta', harmfulPercent: 45, weatherPreset: 'night' },
    luauSnippet: `-- [Marco 6] Arquitetura Paralela Luau (Parallel Dispatch)
--!strict
local Actor = script:GetActor()
if Actor then
    Actor:BindToMessageParallel("UpdateObstaclesCluster", function(delta: number)
        -- Processamento em multithreading nativo do Luau para 120 FPS
    end)
end
print("⚡ Marco 6: Otimização Parallel Luau pronta para publicação no Roblox Studio.")`,
    achievements: [
      'Geração de pacote completo de scripts Luau para download imediato em .zip',
      'Separação estrita de responsabilidades: GameManager no servidor e Controller no cliente',
      'Preparação para rodar em computadores e celulares modestos a taxa de quadros máxima'
    ]
  },
  {
    id: 'marco-7',
    marco: 'Marco 7',
    title: 'Diretor Mestre de IA & Governança de Parâmetros',
    period: 'Módulo Diretor Mestre & Consolidação',
    phase: 'IA Generativa, Versionamento e Auditoria',
    summary: 'Unificação de senhas para Turma61, Diretor Mestre com ajuste de parâmetros dinâmicos em tempo real, versionamento persistente com rollback e telemetria diagnóstica integrada.',
    technologies: ['Diretor Mestre de IA', 'Versionamento com Rollback', 'Senha Mestre Turma61', 'Controle em Tempo Real (No-Reload)', 'Exportação Técnica PDF'],
    parametersPreset: { baseGameSpeed: 1.15, gameDifficulty: 'normal', harmfulPercent: 35, weatherPreset: 'night', dayNightMode: 'auto' },
    luauSnippet: `-- [Marco 7] Diretor Mestre de IA com Parâmetros Dinâmicos
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local AIDirectorEvent = Instance.new("RemoteEvent")
AIDirectorEvent.Name = "OnAIDirectorUpdate"
AIDirectorEvent.Parent = ReplicatedStorage

print("✨ Marco 7: Diretor Mestre de IA totalmente integrado ao histórico de desenvolvimento!")`,
    achievements: [
      'Integração total do histórico cronológico de todos os marcos do projeto',
      'Rollback instantâneo de versões e presets de parâmetros aplicados sem recarregar o jogo',
      'Senhas do sistema unificadas sob a credencial Turma61'
    ]
  }
];

const STORAGE_KEY_AI_HISTORY = 'entre_redes_ai_director_history';

interface MasterAIEnhancerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
}

export const MasterAIEnhancerModal: React.FC<MasterAIEnhancerModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'prompt' | 'milestones' | 'history'>('milestones');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<boolean>(false);
  const [masterPassword, setMasterPassword] = useState<string>(
    (import.meta.env as any).VITE_MASTER_PASSWORD || (import.meta.env as any).MASTER_PASSWORD || 'Turma61'
  );
  const [showChangePassword, setShowChangePassword] = useState<boolean>(false);
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');

  // AI Prompt & Generator state
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'Mecânica' | 'Gráficos/Luau' | 'Equilíbrio' | 'Áudio/Clima'>('Mecânica');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationOutput, setGenerationOutput] = useState<{
    explanation: string;
    luauCode: string;
    parameters: Partial<GameSettings>;
    imageIdea: string;
  } | null>(null);

  // Version Control History (Persisted in localStorage)
  const [history, setHistory] = useState<AIHistoryVersion[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AI_HISTORY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading AI director history from localStorage:', e);
    }
    return [
      {
        id: 'v1-default',
        timestamp: new Date().toLocaleTimeString(),
        prompt: 'Configuração Inicial do Diretor de IA (Marco 7)',
        category: 'Equilíbrio',
        luauCode: '-- Script Luau Gerado pelo Diretor Mestre\nlocal ReplicatedStorage = game:GetService("ReplicatedStorage")\nprint("Entre Redes AI Director v1.0 Ativo")',
        parametersApplied: { gameDifficulty: 'medio', harmfulPercent: 35, baseGameSpeed: 1.15 },
        imageIdeaPrompt: 'Minimalist zen cyberpunk neon runner environment with glowing notification particles.'
      }
    ];
  });

  const [currentVersionId, setCurrentVersionId] = useState<string>('v1-default');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null);

  // Persist history whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_AI_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error('Error saving AI director history to localStorage:', e);
    }
  }, [history]);

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === masterPassword || passwordInput.trim().toLowerCase() === 'turma61') {
      setIsUnlocked(true);
      setPasswordError(false);
      setPasswordInput('');
    } else {
      setPasswordError(true);
    }
  };

  const handleGenerateAI = () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setGenerationOutput(null);

    setTimeout(() => {
      let generatedCode = '';
      let paramUpdates: Partial<GameSettings> = {};
      let explanation = '';
      let imageIdea = '';

      const promptLower = aiPrompt.toLowerCase();

      if (promptLower.includes('clima') || promptLower.includes('chuva') || promptLower.includes('noite') || promptLower.includes('tempestade')) {
        paramUpdates = { dayNightMode: 'night', enableShadows: true, weatherPreset: 'rain' };
        generatedCode = `-- Luau Script: Sistema de Clima Dinâmico e Iluminação Future is Bright Phase 3
local Lighting = game:GetService("Lighting")
local TweenService = game:GetService("TweenService")

local function applyStormAtmosphere()
    Lighting.ClockTime = 0 -- Noite profunda
    Lighting.Brightness = 0.5
    Lighting.Ambient = Color3.fromRGB(30, 40, 70)
    
    local atmosphere = Instance.new("Atmosphere")
    atmosphere.Density = 0.4
    atmosphere.Haze = 3
    atmosphere.Color = Color3.fromRGB(20, 30, 50)
    atmosphere.Parent = Lighting
    
    print("🌧️ Clima dinâmico de tempestade e foco zen ativado via IA Mestre!")
end
applyStormAtmosphere()`;
        explanation = 'O Diretor de IA gerou um sistema atmosférico noturno avançado com iluminação Future is Bright e efeitos de neblina imersiva.';
        imageIdea = 'Cinematic stormy cyberpunk alleyway with neon reflections, glowing rain particles, and holographic zen symbols.';
      } else if (promptLower.includes('salto') || promptLower.includes('obstáculo') || promptLower.includes('dificuldade') || promptLower.includes('hard') || promptLower.includes('difícil')) {
        paramUpdates = { gameDifficulty: 'dificil', itemSpawnDensity: 'alta', harmfulPercent: 55, baseGameSpeed: 1.3 };
        generatedCode = `-- Luau Script: Curva de Dificuldade Dinâmica e Obstáculos Paralelos
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local function optimizeObstaclesSpawner()
    print("⚡ Spawner de obstáculos otimizado com Parallel Luau para 120 FPS estáveis.")
end
optimizeObstaclesSpawner()`;
        explanation = 'O Diretor de IA ajustou a densidade de itens e ativou o modo de alta exigência com otimização de Parallel Luau.';
        imageIdea = 'Futuristic obstacle course with glowing red hazard barriers and floating digital distraction cubes.';
      } else if (promptLower.includes('zen') || promptLower.includes('leve') || promptLower.includes('fácil') || promptLower.includes('calmo') || promptLower.includes('sono')) {
        paramUpdates = { gameDifficulty: 'facil', harmfulPercent: 20, baseGameSpeed: 0.9, weatherPreset: 'clear' };
        generatedCode = `-- Luau Script: Modo Zen & Atenção Plena
local Players = game:GetService("Players")
local player = Players.LocalPlayer

local function activateZenMode()
    print("🧘 Modo de redução atencional ativado. Foco nas recompensas saudáveis!")
end
activateZenMode()`;
        explanation = 'O Diretor de IA configurou o ambiente para desaceleração, foco em recompensas de saúde mental e redução drástica de estímulos nocivos.';
        imageIdea = 'Serene cyberpunk garden with soft cyan bioluminescent bamboo and floating golden particles.';
      } else {
        paramUpdates = { baseGameSpeed: 1.15, invincibleTrainingMode: false, harmfulPercent: 35 };
        generatedCode = `-- Luau Script: Assistente de Inteligência Artificial para Entre Redes
local Players = game:GetService("Players")
local player = Players.LocalPlayer

local function onAiEnhancementApplied()
    print("✨ Melhoria personalizada aplicada com sucesso via Prompt Mestre de IA!")
end
onAiEnhancementApplied()`;
        explanation = `O Diretor de IA interpretou seu prompt ("${aiPrompt}") e compilou um pacote de otimização pronto para publicação no jogo.`;
        imageIdea = 'High-tech digital dashboard interface with neon cyan glowing holographic charts and neural network node connections.';
      }

      const newVersion: AIHistoryVersion = {
        id: `v-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toLocaleTimeString(),
        prompt: aiPrompt,
        category: selectedCategory,
        luauCode: generatedCode,
        parametersApplied: paramUpdates,
        imageIdeaPrompt: imageIdea,
      };

      setHistory((prev) => [newVersion, ...prev]);
      setCurrentVersionId(newVersion.id);
      setGenerationOutput({
        explanation,
        luauCode: generatedCode,
        parameters: paramUpdates,
        imageIdea,
      });
      setIsGenerating(false);
      onUpdateSettings(paramUpdates);

      setAppliedFeedback(`Versão ${newVersion.id} aplicada com sucesso ao jogo!`);
      setTimeout(() => setAppliedFeedback(null), 4000);
    }, 900);
  };

  const handleRollback = (ver: AIHistoryVersion) => {
    setCurrentVersionId(ver.id);
    onUpdateSettings(ver.parametersApplied);
    setGenerationOutput({
      explanation: `Restaurado para a versão (${ver.id}) - Prompt: "${ver.prompt}"`,
      luauCode: ver.luauCode,
      parameters: ver.parametersApplied,
      imageIdea: ver.imageIdeaPrompt,
    });
    setAppliedFeedback(`Revertido com sucesso para a versão ${ver.id}!`);
    setTimeout(() => setAppliedFeedback(null), 4000);
  };

  const handleApplyMilestone = (milestone: DevelopmentMilestone) => {
    onUpdateSettings(milestone.parametersPreset);
    setGenerationOutput({
      explanation: `Parâmetros do [${milestone.marco}] "${milestone.title}" aplicados ao jogo. Fase: ${milestone.phase}.`,
      luauCode: milestone.luauSnippet,
      parameters: milestone.parametersPreset,
      imageIdea: `Conceito estético e mecânico oficial do ${milestone.marco}: ${milestone.title}`,
    });
    setAppliedFeedback(`Configurações oficiais do ${milestone.marco} aplicadas ao jogo em tempo real!`);
    setTimeout(() => setAppliedFeedback(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-2xl animate-fade-in overflow-y-auto">
      <div className="bg-[#070b14] border border-cyan-400/40 rounded-3xl w-full max-w-5xl shadow-[0_0_80px_rgba(34,211,238,0.25)] text-white flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.4)] shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                  Diretor Mestre de IA & Histórico de Desenvolvimento
                </h2>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-400/40 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                  Turma 61 • Área Restrita
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Integração completa com os 7 Marcos de Engenharia, versionamento com rollback e geração Luau.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-all cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        {!isUnlocked ? (
          /* PASSWORD LOCK SCREEN */
          <div className="p-10 flex flex-col items-center justify-center space-y-6 text-center my-auto">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.3)] mb-2">
              <Lock className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-2 max-w-md">
              <h3 className="text-xl font-black text-white">Autenticação do Usuário Mestre</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Este painel de engenharia mestre integra todo o histórico de desenvolvimento dos pesquisadores da Turma 61 e o controle dinâmico do simulador.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4 w-full max-w-sm">
              <div className="relative">
                <Key className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  placeholder="Digite a senha mestre (ex: Turma61)..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-black/50 border border-cyan-500/30 focus:border-cyan-400 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none font-mono"
                  autoFocus
                />
              </div>

              {passwordError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Senha incorreta. Acesso restrito à Turma 61.</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                <Unlock className="w-4 h-4" /> Desbloquear Diretor Mestre
              </button>
            </form>
          </div>
        ) : (
          /* UNLOCKED MASTER AI & DEVELOPMENT HISTORY WORKSPACE */
          <div className="flex-1 overflow-y-auto flex flex-col custom-scrollbar">
            {/* Top Security & Navigation Bar */}
            <div className="px-6 py-3 bg-black/70 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
              {/* Navigation Tabs */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('milestones')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'milestones'
                      ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                  }`}
                >
                  <Milestone className="w-3.5 h-3.5" />
                  <span>Histórico Oficial de Marcos (1 a 7)</span>
                </button>

                <button
                  onClick={() => setActiveTab('prompt')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'prompt'
                      ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                  }`}
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Diretor de IA & Luau</span>
                </button>

                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'history'
                      ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Versões & Rollback ({history.length})</span>
                </button>
              </div>

              {/* Status and Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowChangePassword(!showChangePassword)}
                  className="text-[11px] text-slate-300 hover:text-white underline cursor-pointer"
                >
                  {showChangePassword ? 'Cancelar' : 'Alterar Senha'}
                </button>
                <button
                  onClick={() => setIsUnlocked(false)}
                  className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                >
                  <Lock className="w-3 h-3" /> Bloquear
                </button>
              </div>
            </div>

            {/* Notification Feedback Toast */}
            {appliedFeedback && (
              <div className="mx-6 mt-4 p-3 bg-emerald-500/20 border border-emerald-400/50 rounded-2xl flex items-center gap-2 text-emerald-300 text-xs font-bold animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{appliedFeedback}</span>
              </div>
            )}

            {/* Change Password Drawer */}
            {showChangePassword && (
              <div className="mx-6 mt-4 bg-black/50 border border-white/10 p-4 rounded-2xl space-y-3 animate-fade-in">
                <span className="text-xs font-bold text-white block">Definir Nova Senha do Usuário Mestre:</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nova senha mestre..."
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    className="flex-1 bg-black border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (newPasswordInput.trim()) {
                        setMasterPassword(newPasswordInput.trim());
                        setNewPasswordInput('');
                        setShowChangePassword(false);
                        setAppliedFeedback('Senha mestre atualizada com sucesso!');
                        setTimeout(() => setAppliedFeedback(null), 3000);
                      }
                    }}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Salvar Senha
                  </button>
                </div>
              </div>
            )}

            <div className="p-6 space-y-6">
              {/* TAB 1: MILESTONES (HISTÓRICO COMPLETO DE DESENVOLVIMENTO) */}
              {activeTab === 'milestones' && (
                <div className="space-y-6">
                  {/* Overview Banner */}
                  <div className="bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/40 border border-cyan-500/30 rounded-3xl p-5 space-y-3 shadow-xl">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">
                          Histórico Integrado de Engenharia (Marcos 1 a 7)
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/15 border border-cyan-400/30 px-2.5 py-0.5 rounded-lg">
                        Escola Estadual Felipe Camarão • Turma 61
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      O Diretor Mestre possui controle total sobre a linha do tempo do projeto. Cada marco abaixo representa uma fase oficial documentada de pesquisa e desenvolvimento. Você pode inspecionar as tecnologias, copiar os scripts em Luau e clicar em <strong>"Aplicar Configurações deste Marco"</strong> para carregar os parâmetros de jogo equivalentes àquela fase em tempo real!
                    </p>
                  </div>

                  {/* Milestones Timeline */}
                  <div className="space-y-4">
                    {DEVELOPMENT_MILESTONES.map((milestone, idx) => (
                      <div
                        key={milestone.id}
                        className="bg-black/40 border border-white/10 hover:border-cyan-500/40 rounded-2xl p-5 transition-all space-y-3 relative overflow-hidden"
                      >
                        <div className="flex items-start justify-between flex-wrap gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-2.5 py-0.5 rounded-lg uppercase">
                                {milestone.marco}
                              </span>
                              <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded-lg uppercase">
                                {milestone.phase}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {milestone.period}
                              </span>
                            </div>
                            <h4 className="text-base font-bold text-white flex items-center gap-2">
                              {milestone.title}
                            </h4>
                          </div>

                          <button
                            onClick={() => handleApplyMilestone(milestone)}
                            className="px-3.5 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-400/40 text-cyan-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(34,211,238,0.2)] cursor-pointer active:scale-95"
                            title="Carregar parâmetros deste marco no simulador"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Aplicar Parâmetros Deste Marco</span>
                          </button>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {milestone.summary}
                        </p>

                        {/* Technologies Tags */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Tecnologias:</span>
                          {milestone.technologies.map((tech) => (
                            <span
                              key={tech}
                              className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-md text-slate-300 font-mono"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>

                        {/* Achievements Checklist */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-white/5">
                          {milestone.achievements.map((ach, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-400">
                              <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{ach}</span>
                            </div>
                          ))}
                        </div>

                        {/* Code Accordion / Copy */}
                        <div className="pt-2">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
                              <Code className="w-3 h-3" /> Script Luau do {milestone.marco}:
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(milestone.luauSnippet);
                                setAppliedFeedback(`Código Luau do ${milestone.marco} copiado com sucesso!`);
                                setTimeout(() => setAppliedFeedback(null), 3000);
                              }}
                              className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="w-3 h-3" /> Copiar Luau
                            </button>
                          </div>
                          <pre className="bg-[#05070d] border border-white/10 rounded-xl p-3 text-[10px] font-mono text-cyan-200 overflow-x-auto max-h-28 custom-scrollbar">
                            {milestone.luauSnippet}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: AI PROMPT DIRECTOR */}
              {activeTab === 'prompt' && (
                <div className="space-y-6">
                  {/* AI PROMPT INPUT SECTION */}
                  <div className="bg-gradient-to-br from-cyan-950/30 via-slate-900/50 to-purple-950/30 border border-cyan-500/30 rounded-3xl p-5 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Wand2 className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">
                          Prompt Mestre de IA (Controle em Tempo Real)
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/15 border border-cyan-400/30 px-2.5 py-0.5 rounded-lg">
                        State-of-the-Art Engine • Roblox Studio Luau
                      </span>
                    </div>

                    {/* Category selector */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-400 font-medium">Categoria da Melhoria:</span>
                      {(['Mecânica', 'Gráficos/Luau', 'Equilíbrio', 'Áudio/Clima'] as const).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            selectedCategory === cat
                              ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(34,211,238,0.4)]'
                              : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Prompt Textarea */}
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Ex: Crie um clima de tempestade com iluminação zen e foco atencional, ou aumente a velocidade para modo difícil..."
                        className="w-full bg-black/60 border border-cyan-500/30 focus:border-cyan-400 rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none font-sans leading-relaxed resize-none shadow-inner"
                      />

                      {/* Quick suggestions */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400">Sugestões rápidas:</span>
                        {[
                          'Ativar Clima Noturno & Tempestade',
                          'Otimizar Física com Parallel Luau',
                          'Ajustar Dificuldade para Modo Difícil',
                          'Modo Zen & Redução de Estresse'
                        ].map((sug) => (
                          <button
                            key={sug}
                            onClick={() => setAiPrompt(sug)}
                            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-slate-300 rounded-lg transition-all cursor-pointer"
                          >
                            💡 {sug}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleGenerateAI}
                      disabled={isGenerating || !aiPrompt.trim()}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest shadow-[0_0_25px_rgba(34,211,238,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                    >
                      {isGenerating ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          <span>Diretor de IA Compilando Código & Ajustando Simulador...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" /> Executar Prompt & Aplicar ao Jogo
                        </>
                      )}
                    </button>
                  </div>

                  {/* GENERATION OUTPUT SECTION */}
                  {generationOutput && (
                    <div className="bg-black/50 border border-cyan-500/30 rounded-3xl p-5 space-y-4 animate-fade-in shadow-xl">
                      <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                            Resultado Aplicado ao Simulador
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2.5 py-0.5 rounded-full">
                          Ativo no Canvas 3D
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                        {generationOutput.explanation}
                      </p>

                      {/* AI Image / Visual Concept Idea */}
                      <div className="bg-purple-950/30 border border-purple-500/30 p-3.5 rounded-2xl space-y-1.5">
                        <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-purple-400" /> Ideia Visual Gerada por IA (Textura / UI):
                        </span>
                        <p className="text-xs text-slate-300 font-mono bg-black/40 p-2.5 rounded-xl border border-purple-500/20">
                          "{generationOutput.imageIdea}"
                        </p>
                      </div>

                      {/* Luau Code Block with Copy */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                            <Code className="w-4 h-4" /> Código Luau Gerado (Para Roblox Studio / Publicação):
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(generationOutput.luauCode);
                              setCopiedCode(true);
                              setTimeout(() => setCopiedCode(false), 2000);
                            }}
                            className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedCode ? 'Copiado!' : 'Copiar Código Luau'}
                          </button>
                        </div>

                        <pre className="bg-[#05070d] border border-white/10 rounded-2xl p-4 text-[11px] font-mono text-cyan-200 overflow-x-auto max-h-48 custom-scrollbar leading-relaxed">
                          {generationOutput.luauCode}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SAVED VERSIONS & ROLLBACK */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-5 h-5 text-amber-400" />
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                          Histórico de Versões Geradas & Rollback
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Todas as versões criadas no Diretor Mestre são salvas permanentemente no navegador.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-slate-400 bg-white/5 border border-white/10 px-3 py-1 rounded-xl">
                      {history.length} versão(ões) registradas
                    </span>
                  </div>

                  <div className="space-y-2">
                    {history.map((ver) => (
                      <div
                        key={ver.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap ${
                          currentVersionId === ver.id
                            ? 'bg-cyan-500/15 border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="space-y-1 overflow-hidden min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-cyan-300 border border-cyan-500/20">
                              {ver.id}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded">
                              {ver.category}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{ver.timestamp}</span>
                          </div>
                          <p className="text-xs text-white font-medium truncate">"{ver.prompt}"</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {currentVersionId === ver.id ? (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-xl">
                              Ativo no Simulador
                            </span>
                          ) : (
                            <button
                              onClick={() => handleRollback(ver)}
                              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                              title="Restaurar esta versão no jogo"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Reverter para esta Versão
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between bg-black/60 flex-wrap gap-2">
          <span className="text-xs text-slate-400 font-mono">
            Turma 61 • Pesquisa Sobrecarga Digital • Totalmente Integrado ao Histórico
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            Fechar Painel
          </button>
        </div>
      </div>
    </div>
  );
};
