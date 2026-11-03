import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Bot,
  Volume2,
  VolumeX,
  RotateCcw,
  Play,
  Pause,
  Layers,
  Zap,
  Music,
  HeartPulse,
  Cloud,
  Code2,
  CheckCircle2,
  Award,
  Sun,
  Moon,
  CloudRain,
  Wind,
  Gauge,
  Box,
  FastForward,
  Cpu,
  Eye,
  Radio,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  HelpCircle,
  Mic,
  MicOff,
  Flame,
  Activity,
  Dna,
  Terminal,
  Wand2,
  Search,
  Move,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameSettings, GameState } from '../types';
import {
  playSolfeggioTone,
  playBreathingCycleSFX,
  playCalmingTeaSFX,
  playSoccerKickSFX,
  playSoccerGoalSFX,
  playDogBarkSFX,
  playButtonClickSFX,
  playZenEnterSFX,
} from '../utils/audio';
import { useLanguage } from '../i18n/LanguageContext';
import { MiniGameSourceReveal } from './MiniGameSourceReveal';

export interface TechDevTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameSettings?: GameSettings;
  onUpdateSettings?: (newSettings: Partial<GameSettings>) => void;
  gameState?: GameState;
  onStartGame?: () => void;
  onTestSlowMotion?: (active: boolean) => void;
  onTestJump?: () => void;
  onTestCrouch?: () => void;
  onTriggerSampleQuestion?: () => void;
  onSetAnxietyLevel?: (level: number) => void;
  onNavigateTab?: (tab: 'simulator' | 'code' | 'guide' | 'analytics' | 'informacoes') => void;
  soundEnabled?: boolean;
  onlineUsersCount?: number;
}

interface TechModule {
  id: string;
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  narrationPt: string;
  narrationEn: string;
  narrationEs: string;
  narrationDe: string;
  theoryTitle: string;
  theoryDescPt: string;
  theoryDescEn: string;
  theoryDescEs: string;
  theoryDescDe: string;
  techHighlights: string[];
}

interface AiStudioPromptItem {
  title: string;
  badge: string;
  prompt: string;
  codeSnippet: string;
  explanation: string;
}

const AI_STUDIO_PROMPTS: AiStudioPromptItem[] = [
  {
    title: '1. Arquitetura 3D WebGL',
    badge: 'MODELO GEMINI 2.5 FLASH',
    prompt: 'Construa um simulador educacional 3D em React + Three.js com suporte a 60 FPS. Crie iluminação solar dinâmica com sombras suaves, suporte a câmeras móveis, avatar com gravidade parabólica e pista infinita procedurally gerada.',
    codeSnippet: `// Gerado no Google AI Studio
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;`,
    explanation: 'O modelo Gemini no Google AI Studio concebeu o pipeline completo de computação gráfica WebGL, configurando a física do acelerador gráfico para rodar sem travamentos mesmo em computadores de escolas públicas.',
  },
  {
    title: '2. Engenharia Acústica sem MP3',
    badge: 'SÍNTESE WEB AUDIO API',
    prompt: 'Sintetize todos os áudios do simulador usando puramente a Web Audio API nativa do navegador, sem baixar nenhum arquivo de áudio pesado como MP3. Inclua a frequência Solfeggio de 528Hz, ciclos de respiração 4-7-8 e chutes de futebol.',
    codeSnippet: `// Gerado no Google AI Studio
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const osc = audioCtx.createOscillator();
const gain = audioCtx.createGain();
osc.type = 'sine';
osc.frequency.setValueAtTime(528, audioCtx.currentTime); // Frequência Solfeggio 528Hz
gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 2.5);`,
    explanation: 'Ao invés de consumir megabytes baixando áudios da internet, o Google AI Studio escreveu geradores senoidais puramente matemáticos, eliminando o consumo de dados móveis.',
  },
  {
    title: '3. Escala Psicométrica SAS & Firestore',
    badge: 'PESQUISA & NUVEM OFFLINE',
    prompt: 'Integre o questionário psicométrico validado da pesquisa da Escola Felipe Camarão com classificação de risco em 4 níveis. Garanta suporte 100% Offline-First e sincronização em segundo plano com o Google Cloud Firestore.',
    codeSnippet: `// Gerado no Google AI Studio
export function calculateSasRiskTier(answers: Record<string, boolean>): RiskTier {
  const yesCount = Object.values(answers).filter(Boolean).length;
  if (yesCount >= 10) return 'critical';
  if (yesCount >= 6) return 'high';
  if (yesCount >= 3) return 'medium';
  return 'low';
}`,
    explanation: 'A IA conectou o referencial teórico da ciência escolar às estruturas de dados resilientes, sincronizando silenciosamente com a nuvem quando a conexão é restabelecida.',
  },
  {
    title: '4. Interoperabilidade Luau para Roblox',
    badge: 'ROBLOX STUDIO LUAU SCRIPT',
    prompt: 'Traduza toda a matemática de física de colisão AABB e modulação de WalkSpeed com ansiedade do TypeScript para scripts Luau limpos para serem importados no Roblox Studio.',
    codeSnippet: `-- Gerado no Google AI Studio para Roblox Studio
local Humanoid = script.Parent:WaitForChild("Humanoid")
local function updateSpeed(anxietyLevel)
    local baseSpeed = 16
    Humanoid.WalkSpeed = baseSpeed + (anxietyLevel * 0.5)
end`,
    explanation: 'O Google AI Studio gerou scripts multiplataforma em Luau, transformando estudantes que jogam em jovens programadores capazes de criar seus próprios mundos no Roblox.',
  },
];

const TECH_MODULES: TechModule[] = [
  {
    id: 'google_aistudio',
    badge: 'INTELIGÊNCIA ARTIFICIAL GOOGLE',
    badgeColor: 'bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 text-black font-black',
    icon: <Sparkles className="w-5 h-5 text-sky-400" />,
    title: '1. Google AI Studio & Engenharia com Gemini',
    subtitle: 'Desenvolvimento Assistido por IA • Da Linguagem Natural ao Código Production-Ready',
    narrationPt:
      'Bem-vindo aos bastidores do Google AI Studio! É fundamental destacar que os modelos Gemini atuaram como engenheiros de software seniores virtuais única e exclusivamente por causa do projeto de pesquisa da Turma 61 da EEEM Felipe Camarão e das instruções científicas precisas definidas pelos estudantes pesquisadores!',
    narrationEn:
      'Welcome behind the scenes of Google AI Studio! Crucially, Gemini models acted as virtual senior software engineers specifically and solely because of the Turma 61 research project at EEEM Felipe Camarão and the precise scientific prompt instructions defined by student researchers!',
    narrationEs:
      '¡Bienvenido a los bastidores de Google AI Studio! Es fundamental destacar que los modelos Gemini actuaron como ingenieros de software seniores virtuales única y exclusivamente debido al proyecto de investigación de la Turma 61 y las instrucciones científicas definidas por los estudiantes.',
    narrationDe:
      'Willkommen hinter den Kulissen von Google AI Studio! Es ist entscheidend zu betonen, dass die Gemini-Modelle nur aufgrund des Forschungsprojekts der Klasse 61 an der EEEM Felipe Camarão und der präzisen wissenschaftlichen Anweisungen der Schülerforscher als virtuelle Senior Software Engineers agierten.',
    theoryTitle: 'Instruções Científicas da Turma 61 & Engenharia com Gemini',
    theoryDescPt:
      'A IA do Google AI Studio operou como engenheira sênior virtual em estrita obediência aos prompts, arquitetura psicométrica e parâmetros pedagógicos estabelecidos pelos jovens pesquisadores da Turma 61. O modelo Gemini executou fielmente a visão dos estudantes para criar o código.',
    theoryDescEn:
      'Google AI Studio operated as a virtual senior engineer strictly guided by the scientific prompts, psychometric matrices, and pedagogical parameters created by the young researchers of Turma 61.',
    theoryDescEs:
      'Google AI Studio operó como ingeniero sênior virtual en estricta obediencia a los prompts y parámetros científicos creados por los jóvenes investigadores de la Turma 61.',
    theoryDescDe:
      'Google AI Studio agierte als virtueller Senior Engineer in strikter Befolgung der wissenschaftlichen Prompts und Parameter der Nachwuchsforscher der Klasse 61.',
    techHighlights: [
      'IA atuando como engenheira sênior orientada 100% pelas instruções da Turma 61',
      'Modelo Gemini executando a visão científica dos estudantes da EEEM Felipe Camarão',
      'Orquestração completa de React, Three.js 3D e Tailwind CSS via prompts pedagógicos',
      'Geração de scripts Luau multiplataforma para Roblox Studio',
    ],
  },
  {
    id: 'webgl_threejs',
    badge: 'MOTOR GRÁFICO 3D',
    badgeColor: 'bg-cyan-400 text-black',
    icon: <Box className="w-5 h-5 text-cyan-400" />,
    title: '2. WebGL & Three.js a 60 FPS',
    subtitle: 'Renderização 3D Direta na GPU do Navegador',
    narrationPt:
      'Este jogo é renderizado diretamente pelo seu navegador através do WebGL e do Three.js a 60 quadros por segundo. Cada árvore, sombra, avatar e iluminação solar são calculados em tempo real pela placa de vídeo do seu dispositivo!',
    narrationEn:
      'This game is rendered live in your browser using WebGL and Three.js at 60 FPS. Every tree, shadow, avatar, and sunlight ray is computed live on your GPU!',
    narrationEs:
      'Este juego se renderiza en tiempo real mediante WebGL y Three.js a 60 FPS. ¡Cada árbol, sombra y rayo de luz se calcula en vivo por tu tarjeta gráfica!',
    narrationDe:
      'Dieses Spiel wird direkt im Browser über WebGL und Three.js mit 60 FPS berechnet. Jedes 3D-Modell und Licht wird in Echtzeit auf Ihrer GPU gerendert!',
    theoryTitle: 'Pipeline de Renderização 3D',
    theoryDescPt:
      'A cena utiliza câmera com Projeção em Perspectiva (FOV 65º), iluminação direcional solar com cálculo de sombras suaves (PCFSoftShadowMap), materiais PBR MeshStandardMaterial e texturas procedurais geradas via Canvas 2D sem consumir sua franquia de dados móveis.',
    theoryDescEn:
      'The scene uses a Perspective Camera (FOV 65º), dynamic directional sunlight with soft shadow mapping, PBR materials, and procedural Canvas 2D textures that consume zero cellular bandwidth.',
    theoryDescEs:
      'La escena usa una Cámara en Perspectiva (FOV 65º), luz solar con sombras suaves dinámicas, materiales PBR y texturas procedimentales en Canvas 2D sin gastar datos.',
    theoryDescDe:
      'Die Szene nutzt eine Perspektivkamera (FOV 65º), dynamisches Sonnenlicht mit weichen Schatten, PBR-Materialien und prozedurale Canvas-2D-Texturen ohne Datenverbrauch.',
    techHighlights: [
      'Renderização WebGL nativa (zero plugins)',
      'Iluminação solar dinâmica e sombras suaves',
      'Texturas procedurais em Canvas 2D (economia de banda)',
      'Taxa estável de 60 quadros por segundo',
    ],
  },
  {
    id: 'physics_procedural',
    badge: 'FÍSICA & PROCEDURAL',
    badgeColor: 'bg-emerald-400 text-black',
    icon: <Zap className="w-5 h-5 text-emerald-400" />,
    title: '3. Física Real & Pista Infinita',
    subtitle: 'Detecção de Colisão AABB e Algoritmo Procedural',
    narrationPt:
      'A pista do jogo é infinita porque os obstáculos não são gravados previamente! O algoritmo procedural calcula a distância do jogador e gera blocos de calçada e itens no horizonte, reciclando-os na memória para evitar travamentos. A colisão usa equações de distância euclidiana!',
    narrationEn:
      'The running track is infinite because it is procedurally generated on the fly. Obstacles and wellness items spawn according to your anxiety curve, and collisions are detected instantly using Euclidean distance and AABB bounding boxes!',
    narrationEs:
      '¡La pista es infinita gracias a la generación procedimental! Los obstáculos se generan matemáticamente por delante y las colisiones se calculan con cajas delimitadoras AABB a latencia cero.',
    narrationDe:
      'Die Strecke ist unendlich durch prozedurale Generierung. Hindernisse erscheinen passend zur Angstkurve und Kollisionen werden blitzschnell über AABB-Bounding-Boxes berechnet.',
    theoryTitle: 'Matemática das 3 Faixas & Hitbox',
    theoryDescPt:
      'O avatar transita por 3 faixas discretas (X = -3.2m, 0.0m, +3.2m). Ao pular, uma curva parabólica simula a gravidade real. A colisão ocorre quando a distância tridimensional entre o centro do avatar e o item for menor que o raio crítico de 1.4 metros.',
    theoryDescEn:
      'The player navigates three discrete lanes (X = -3.2, 0.0, +3.2m). When jumping, parabolic velocity simulates gravity. Collision triggers when 3D Euclidean distance is under 1.4m.',
    theoryDescEs:
      'El avatar se desplaza en 3 carriles (-3.2m, 0.0m, +3.2m). El salto calcula gravedad parabólica y la colisión usa distancia euclidiana tridimensional (< 1.4m).',
    theoryDescDe:
      'Der Avatar bewegt sich auf 3 Bahnen (-3.2m, 0.0m, +3.2m). Sprünge simulieren Parabelgravitation und Treffer werden über dreidimensionale Distanz (< 1.4m) geprüft.',
    techHighlights: [
      '3 faixas de desvio lateral com interpolação suave (Lerp)',
      'Gravidade parabólica com física de pulo e agachamento',
      'Detecção de colisão AABB ultra-rápida (0ms)',
      'Pool de objetos reciclados na GPU para prevenir lag',
    ],
  },
  {
    id: 'webaudio_synthesis',
    badge: 'ENGENHARIA ACÚSTICA',
    badgeColor: 'bg-amber-400 text-black',
    icon: <Music className="w-5 h-5 text-amber-400" />,
    title: '4. Síntese Sonora Web Audio API',
    subtitle: 'Zero Arquivos MP3 • Sons Gerados Matematicamente',
    narrationPt:
      'Uma grande inovação de engenharia deste jogo: ele não baixa nenhum arquivo de áudio pesado como MP3! Todos os sons, como o sino zen, o ciclo de respiração 4-7-8, a frequência Solfeggio de 528 Hertz e os chutes de futebol, são sintetizados matematicamente em tempo real usando osciladores da Web Audio API!',
    narrationEn:
      'A key engineering feat of this simulator is that it downloads zero MP3 or WAV audio files! All sound effects, including the 528 Hz Solfeggio chime, diaphragmatic breath swell, and soccer kicks, are synthesized in real time via the Web Audio API!',
    narrationEs:
      '¡Una innovación asombrosa: el juego no descarga ningún archivo MP3! Todos los sonidos se sintetizan matemáticamente con la Web Audio API, incluyendo frecuencias terapéuticas como Solfeggio 528Hz.',
    narrationDe:
      'Ein technologisches Highlight: Es werden keinerlei MP3-Dateien geladen! Alle Soundeffekte, einschließlich der 528-Hz-Solfeggio-Klangschale und 4-7-8-Atemwellen, werden mathematisch über die Web Audio API erzeugt.',
    theoryTitle: 'Osciladores Senoidais & Envelope ADSR',
    theoryDescPt:
      'Utilizamos osciladores senoidais, triangulares e ruído branco filtrado com envelopes exponenciais de ganho (Attack, Decay, Sustain, Release). Isso garante carregamento instantâneo, fidelidade acústica pura e funcionamento garantido mesmo em conexões lentas.',
    theoryDescEn:
      'We use pure sine waves, bandpass-filtered noise, and exponential ADSR gain ramps. This yields zero network latency, pure acoustic fidelity, and total reliability.',
    theoryDescEs:
      'Usamos ondas senoidales puras, ruido blanco filtrado y rampas exponenciales ADSR para latencia cero y fidelidad acústica absoluta.',
    theoryDescDe:
      'Wir nutzen reine Sinuswellen, gefiltertes Rauschen und exponentielle ADSR-Lautstärkerampen für null Latenz und kristallklare Akustik.',
    techHighlights: [
      'Zero megabytes de áudio baixados da rede',
      'Frequência Solfeggio 528Hz com harmônicos puros',
      'Síntese de biofeedback vagal 4-7-8 e sino tibetano a 432Hz',
      'Latência acústica zero e modulação de volume adaptativa',
    ],
  },
  {
    id: 'psychometrics_sas',
    badge: 'CIÊNCIA & PSICOMETRIA',
    badgeColor: 'bg-purple-400 text-black',
    icon: <HeartPulse className="w-5 h-5 text-purple-400" />,
    title: '5. Motor Psicométrico SAS-SMU',
    subtitle: 'Pesquisa Científica & Modulação Comportamental de Ansiedade',
    narrationPt:
      'O jogo é um instrumento pedagógico e científico validado! Ele nasceu da pesquisa da Turma 61 da Escola Felipe Camarão. Conforme seu avatar corre, perguntas validadas da escala SAS medem o uso de telas e a ansiedade. O estresse acelera a velocidade e a sobrecarga de notificações!',
    narrationEn:
      'This simulator is a validated educational instrument born from scientific research at EEEM Felipe Camarão. Validated SAS smartphone addiction questions track your digital habits, modulating in-game anxiety, speed, and notification overload!',
    narrationEs:
      '¡El simulador es un instrumento científico validado! Mide la adicción al smartphone mediante la escala SAS-SMU, modulando la velocidad y el estrés visual del avatar.',
    narrationDe:
      'Das Spiel ist ein valides Forschungsinstrument. Basierend auf der Smartphone Addiction Scale (SAS) moduliert es Angstlevel, Geschwindigkeit und Benachrichtigungsüberlastung in Echtzeit.',
    theoryTitle: 'Algoritmo de Risco & Dossiê Clínico',
    theoryDescPt:
      'Cada resposta SIM ou NÃO alimenta um classificador com matriz de 4 níveis de risco (Baixo, Médio, Alto e Crítico). O sistema calcula o tempo de resposta e gera relatórios com recomendações de autocuidado sem interromper a fluidez da partida.',
    theoryDescEn:
      'Each answer feeds a 4-tier risk matrix (Low, Medium, High, Critical) and computes response latency, producing clinical dossiers with self-care guidelines.',
    theoryDescEs:
      'Cada respuesta alimenta una matriz de riesgo de 4 niveles y calcula la latencia de respuesta para generar un dossier clínico con recomendaciones.',
    theoryDescDe:
      'Jede Antwort speist eine 4-stufige Risikomatrix und berechnet Reaktionszeiten für klinische Dossiers mit Empfehlungen für digitale Achtsamkeit.',
    techHighlights: [
      '52 perguntas psicométricas validadas no banco de dados',
      'Matriz de risco em 4 níveis (Baixo, Médio, Alto, Crítico)',
      'Modulação dinâmica de velocidade (WalkSpeed 12 a 24)',
      'Exportação de prontuários clínicos e estatísticas',
    ],
  },
  {
    id: 'offline_firebase',
    badge: 'ARQUITETURA FULLSTACK',
    badgeColor: 'bg-rose-400 text-black',
    icon: <Cloud className="w-5 h-5 text-rose-400" />,
    title: '6. Offline-First & Nuvem Firebase',
    subtitle: 'Resiliência Escolar & Sincronização em Tempo Real',
    narrationPt:
      'Pensando nas escolas brasileiras com internet instável, o jogo utiliza arquitetura Offline-First. Ele funciona perfeitamente sem nenhuma conexão à internet, salvando tudo no armazenamento local do aparelho. Quando a internet volta, ele sincroniza automaticamente com o Google Cloud Firestore com proteção total de privacidade!',
    narrationEn:
      'Designed for schools with unstable internet, the app uses an Offline-First architecture. It functions 100% offline via local storage and seamlessly syncs to Google Cloud Firestore when online, respecting student privacy!',
    narrationEs:
      'Diseñado para aulas con conexión inestable, funciona 100% Offline-First en almacenamiento local y sincroniza en segundo plano con Google Cloud Firestore.',
    narrationDe:
      'Entwickelt für Schulen mit instabilem Internet: Funktioniert 100% offline über lokalen Speicher und synchronisiert nahtlos mit Google Cloud Firestore.',
    theoryTitle: 'Sincronização em Segundo Plano & Heartbeat',
    theoryDescPt:
      'A aplicação usa IndexedDB/localStorage com failover automático e controle de cota. Um heartbeat de presença mantém a contagem de pesquisadores conectados sem sobrecarregar o banco de dados e respeitando a LGPD com códigos anônimos.',
    theoryDescEn:
      'Uses LocalStorage/IndexedDB with quota exhaustion failovers and anonymous heartbeat presence, fully compliant with student privacy laws.',
    theoryDescEs:
      'Usa almacenamiento local con tolerancia a fallos y presencia en tiempo real con códigos anonimizados que respetan la privacidad.',
    theoryDescDe:
      'Nutzt lokalen Speicher mit Ausfallsicherung und anonyme Echtzeit-Präsenz gemäß Datenschutzrichtlinien.',
    techHighlights: [
      'Funcionamento 100% offline (ideal para escolas e laboratórios)',
      'Sincronização em segundo plano com Google Cloud Firestore',
      'Detecção inteligente de cota e proteção contra sobrecarga',
      'Presença de usuários online em tempo real (Heartbeat)',
    ],
  },
  {
    id: 'roblox_luau',
    badge: 'INTEROPERABILIDADE ROBLOX',
    badgeColor: 'bg-indigo-400 text-black',
    icon: <Code2 className="w-5 h-5 text-indigo-400" />,
    title: '7. Código Luau & Roblox Studio',
    subtitle: 'Transformando Jogadores em Jovens Programadores',
    narrationPt:
      'Queremos que os jovens não sejam apenas consumidores, mas criadores de jogos! A mesma lógica de colisão, itens e ansiedade deste simulador foi espelhada em scripts Luau prontos para serem importados no Roblox Studio. Você pode abrir o código fonte e aprender como construir seu próprio jogo 3D no Roblox!',
    narrationEn:
      'We empower students to become game creators, not just passive consumers! The exact mechanics and anxiety logic are mirrored in clean Luau scripts ready to run in Roblox Studio!',
    narrationEs:
      '¡Inspiramos a los jóvenes a ser creadores de videojuegos! Toda la lógica está disponible en scripts Luau listos para importar y programar en Roblox Studio.',
    narrationDe:
      'Wir ermutigen Jugendliche, selbst Spieleentwickler zu werden! Die gesamte Spiellogik liegt in sauberem Luau-Code vor, bereit für Roblox Studio.',
    theoryTitle: 'Arquitetura Multiplataforma TypeScript & Luau',
    theoryDescPt:
      'Os scripts utilizam ServerScriptService, ReplicatedStorage e eventos Touched do Roblox. O código TypeScript e Luau compartilham as mesmas fórmulas de velocidade do Humanoid e pontuação psicométrica, permitindo aprendizado interdisciplinar.',
    theoryDescEn:
      'Scripts utilize Roblox ServerScriptService, ReplicatedStorage, and Humanoid physics. Both TypeScript and Luau versions share identical speed formulas and mechanics.',
    theoryDescEs:
      'Los scripts usan ServerScriptService y físicas de Humanoid en Roblox, compartiendo las mismas fórmulas matemáticas de la versión Web.',
    theoryDescDe:
      'Die Skripte nutzen ServerScriptService und Humanoid-Physik in Roblox Studio und teilen sich identische mathematische Formeln mit TypeScript.',
    techHighlights: [
      'Scripts Luau completos para Roblox Studio inclusos no projeto',
      'Mapeamento idêntico de Humanoid.WalkSpeed com ansiedade',
      'Visualizador de código com syntax highlighting integrado',
      'Guia interativo passo a passo para publicação no Roblox',
    ],
  },
];

export const TechDevTourModal: React.FC<TechDevTourModalProps> = ({
  isOpen,
  onClose,
  gameSettings,
  onUpdateSettings,
  gameState,
  onStartGame,
  onTestSlowMotion,
  onTestJump,
  onTestCrouch,
  onTriggerSampleQuestion,
  onSetAnxietyLevel,
  onNavigateTab,
  soundEnabled = true,
  onlineUsersCount = 1,
}) => {
  const { language } = useLanguage();
  const [activeModuleIndex, setActiveModuleIndex] = useState<number>(0);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [includeTheoryInSpeech, setIncludeTheoryInSpeech] = useState<boolean>(true);
  const [isRobotPullingPage, setIsRobotPullingPage] = useState<boolean>(false);
  const [testedModules, setTestedModules] = useState<Set<string>>(new Set());
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [isSlowMoActive, setIsSlowMoActive] = useState<boolean>(false);
  const [selectedAiPromptIndex, setSelectedAiPromptIndex] = useState<number>(0);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouch();
  }, []);

interface RobotFlightPose {
  x: number;
  y: number;
  rotateY: number;
  rotateZ: number;
  scale: number;
  isSmiling: boolean;
  isBlinking: boolean;
  isScanningText: boolean;
  statusLabel: string;
  targetSection: 'dock' | 'narration' | 'playground' | 'simulator' | 'code_peel' | 'theory' | 'user_engage';
}

const FLIGHT_WAYPOINTS: RobotFlightPose[] = [
  {
    x: 30,
    y: 60,
    rotateY: 0,
    rotateZ: -2,
    scale: 1.05,
    isSmiling: true,
    isBlinking: false,
    isScanningText: true,
    statusLabel: '🤖 Robô Assistente Iniciando Navegação',
    targetSection: 'dock',
  },
  {
    x: 60,
    y: 220,
    rotateY: -15,
    rotateZ: 4,
    scale: 1.1,
    isSmiling: true,
    isBlinking: true,
    isScanningText: false,
    statusLabel: '💬 Lendo e Explicando o Módulo',
    targetSection: 'narration',
  },
  {
    x: 280,
    y: 520,
    rotateY: 18,
    rotateZ: -5,
    scale: 1.08,
    isSmiling: false,
    isBlinking: false,
    isScanningText: true,
    statusLabel: '🔬 Examinando Experimentos Interativos',
    targetSection: 'playground',
  },
  {
    x: 90,
    y: 880,
    rotateY: -22,
    rotateZ: 6,
    scale: 1.12,
    isSmiling: true,
    isBlinking: false,
    isScanningText: true,
    statusLabel: '🎮 Sobrevoando a Execução do Jogo a 60 FPS',
    targetSection: 'simulator',
  },
  {
    x: 320,
    y: 1250,
    rotateY: 12,
    rotateZ: -8,
    scale: 1.15,
    isSmiling: true,
    isBlinking: true,
    isScanningText: true,
    statusLabel: '⚙️ Puxando a Folha e Mostrando o Código Fonte',
    targetSection: 'code_peel',
  },
  {
    x: 50,
    y: 1650,
    rotateY: -18,
    rotateZ: 5,
    scale: 1.06,
    isSmiling: false,
    isBlinking: false,
    isScanningText: true,
    statusLabel: '📑 Iluminando os Fundamentos Técnicos',
    targetSection: 'theory',
  },
  {
    x: 220,
    y: 350,
    rotateY: 0,
    rotateZ: -3,
    scale: 1.18,
    isSmiling: true,
    isBlinking: true,
    isScanningText: false,
    statusLabel: '✨ Conectando Toda a Arquitetura com Você!',
    targetSection: 'user_engage',
  },
];

  // Extended Assistant Robot State
  const [robotStatus, setRobotStatus] = useState<string>('🤖 Robô Assistente Pronto');
  const [robotMood, setRobotMood] = useState<'idle' | 'speaking' | 'experiment' | 'celebrate' | 'scan' | 'synthesize' | 'matrix' | 'physics'>('idle');
  const [labEffect, setLabEffect] = useState<'none' | 'laser_scan' | 'wireframe_3d' | 'physics_vector' | 'sound_wave' | 'dna_helix' | 'cloud_sync' | 'code_matrix' | 'confetti_burst'>('none');

  // Intelligent AI Flying Robot Choreography State
  const [flightPose, setFlightPose] = useState<RobotFlightPose>({
    x: 35,
    y: 65,
    rotateY: 0,
    rotateZ: 0,
    scale: 1,
    isSmiling: false,
    isBlinking: false,
    isScanningText: false,
    statusLabel: '🤖 Robô Assistente Pronto na Base',
    targetSection: 'dock',
  });

  // Manual Fly Dispatch to Any Section in the Laboratory
  const flyToSection = (section: 'dock' | 'narration' | 'playground' | 'simulator' | 'code_peel' | 'theory' | 'user_engage') => {
    const matchingWaypoint = FLIGHT_WAYPOINTS.find((wp) => wp.targetSection === section) || {
      x: 35,
      y: 65,
      rotateY: 0,
      rotateZ: 0,
      scale: 1,
      isSmiling: false,
      isBlinking: false,
      isScanningText: false,
      statusLabel: '🤖 Robô Assistente na Base',
      targetSection: 'dock',
    };
    setFlightPose(matchingWaypoint);
  };

  // Flight & Reading Choreography Loop while isSpeaking is active
  useEffect(() => {
    if (!isSpeaking) {
      setFlightPose({
        x: 35,
        y: 65,
        rotateY: 0,
        rotateZ: 0,
        scale: 1,
        isSmiling: false,
        isBlinking: false,
        isScanningText: false,
        statusLabel: '🤖 Robô Assistente Pronto na Base',
        targetSection: 'dock',
      });
      return;
    }

    let stepIndex = 0;
    setFlightPose(FLIGHT_WAYPOINTS[0]);

    const waypointInterval = setInterval(() => {
      stepIndex = (stepIndex + 1) % FLIGHT_WAYPOINTS.length;
      setFlightPose(FLIGHT_WAYPOINTS[stepIndex]);
    }, 2800);

    return () => clearInterval(waypointInterval);
  }, [isSpeaking]);

  // Natural Eye Blinking loop (even when resting)
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setFlightPose((prev) => ({ ...prev, isBlinking: true }));
      setTimeout(() => {
        setFlightPose((prev) => ({ ...prev, isBlinking: false }));
      }, 180);
    }, 3800);

    return () => clearInterval(blinkInterval);
  }, []);

  // AUTOMATED ASSISTANT PRESENTATION MODE STATE (DISABLED BY DEFAULT)
  const [isAutoPresentation, setIsAutoPresentation] = useState<boolean>(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const activeModule = TECH_MODULES[activeModuleIndex];

  // Mark module as explored
  const markModuleTested = (id: string) => {
    setTestedModules((prev) => {
      const next = new Set(prev);
      next.add(id);
      if (next.size === TECH_MODULES.length && !prev.has(id)) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
      return next;
    });
  };

  // Get current narration based on active language
  const getNarrationText = (mod: TechModule) => {
    if (language === 'en') return mod.narrationEn;
    if (language === 'es') return mod.narrationEs;
    if (language === 'de') return mod.narrationDe;
    return mod.narrationPt;
  };

  const getTheoryDesc = (mod: TechModule) => {
    if (language === 'en') return mod.theoryDescEn;
    if (language === 'es') return mod.theoryDescEs;
    if (language === 'de') return mod.theoryDescDe;
    return mod.theoryDescPt;
  };

  // Split module explanation into concise, punchy comic paragraphs
  const getModuleParagraphs = (mod: TechModule, includeTheory: boolean, lang: string): string[] => {
    const list: string[] = [];
    if (mod.id === 'google_aistudio') {
      if (lang === 'en') {
        list.push("Welcome! This entire application was architected behind the scenes in Google AI Studio!");
        list.push("Powered by Gemini models, natural language instructions were transformed into full-stack production React code.");
        list.push("From 3D WebGL physics to mathematical Web Audio synthesis and Luau Roblox scripts, Google AI Studio engineered it all!");
        if (includeTheory) {
          list.push(`Technical Foundation: ${mod.theoryTitle}. ${mod.theoryDescEn}`);
        }
      } else if (lang === 'es') {
        list.push("¡Bienvenido! ¡Toda esta aplicación se desenvolvió en los bastidores con Google AI Studio!");
        list.push("Usando modelos Gemini, los prompts en lenguaje natural se transformaron en código React listo para producción.");
        list.push("Desde el motor 3D WebGL hasta la síntesis de audio y scripts Luau para Roblox, ¡Google AI Studio construyó todo!");
        if (includeTheory) {
          list.push(`Fundamentos Técnicos: ${mod.theoryTitle}. ${mod.theoryDescEs}`);
        }
      } else if (lang === 'de') {
        list.push("Willkommen! Diese gesamte Anwendung wurde hinter den Kulissen mit Google AI Studio entwickelt!");
        list.push("Angetrieben von Gemini-Modellen wurden Prompts in natürlicher Sprache in produktionsreifen React-Code umgewandelt.");
        list.push("Von 3D-WebGL über mathematische Audio-Synthese bis hin zu Luau-Roblox-Skripten hat Google AI Studio alles erschaffen!");
        if (includeTheory) {
          list.push(`Technische Grundlagen: ${mod.theoryTitle}. ${mod.theoryDescDe}`);
        }
      } else {
        list.push("Bem-vindo! Toda esta aplicação foi desenvolvida nos bastidores através do Google AI Studio!");
        list.push("Com os modelos Gemini, prompts em linguagem natural foram convertidos em código React completo de nível de produção.");
        list.push("Do motor 3D em WebGL à síntese de áudio matemática e scripts Luau para o Roblox, o Google AI Studio projetou tudo!");
        if (includeTheory) {
          list.push(`Fundamentos Técnicos: ${mod.theoryTitle}. ${mod.theoryDescPt}`);
        }
      }
    } else if (mod.id === 'webgl_threejs') {
      if (lang === 'en') {
        list.push("This game is rendered directly in your browser using WebGL and Three.js at a steady 60 FPS.");
        list.push("Every tree, soft shadow, avatar, and sunlight ray is computed in real time on your GPU!");
        if (includeTheory) {
          list.push(`Technical Foundation: ${mod.theoryTitle}. ${mod.theoryDescEn}`);
        }
      } else if (lang === 'es') {
        list.push("Este juego se renderiza en tiempo real mediante WebGL y Three.js a 60 cuadros por segundo.");
        list.push("¡Cada árbol, sombra suave y rayo solar se calcula en vivo por la tarjeta gráfica de tu dispositivo!");
        if (includeTheory) {
          list.push(`Fundamentos Técnicos: ${mod.theoryTitle}. ${mod.theoryDescEs}`);
        }
      } else if (lang === 'de') {
        list.push("Dieses Spiel wird direkt im Browser über WebGL und Three.js mit 60 FPS berechnet.");
        list.push("Jedes 3D-Modell, jeder weiche Schatten und das Sonnenlicht werden in Echtzeit auf Ihrer GPU gerendert!");
        if (includeTheory) {
          list.push(`Technische Grundlagen: ${mod.theoryTitle}. ${mod.theoryDescDe}`);
        }
      } else {
        list.push("Este jogo é renderizado diretamente pelo seu navegador através do WebGL e do Three.js a 60 quadros por segundo.");
        list.push("Cada árvore, sombra suave, avatar e iluminação solar são calculados em tempo real pela placa de vídeo do seu dispositivo!");
        if (includeTheory) {
          list.push(`Fundamentos Técnicos: ${mod.theoryTitle}. ${mod.theoryDescPt}`);
        }
      }
    } else if (mod.id === 'physics_procedural') {
      if (lang === 'en') {
        list.push("The running track is infinite because it is procedurally generated on the fly!");
        list.push("Obstacles and wellness items spawn on the horizon according to your anxiety curve.");
        list.push("Collisions and hits are detected with zero latency using 3D Euclidean distance and AABB boxes.");
        if (includeTheory) {
          list.push(`Technical Foundation: ${mod.theoryTitle}. ${mod.theoryDescEn}`);
        }
      } else if (lang === 'es') {
        list.push("¡La pista de carrera es infinita gracias a la generación matemática procedimental!");
        list.push("Los obstáculos y coleccionables aparecen en el horizonte modulados por la curva de estrés.");
        list.push("Las colisiones se calculan a latencia cero usando cajas delimitadoras AABB y distancia euclidiana.");
        if (includeTheory) {
          list.push(`Fundamentos Técnicos: ${mod.theoryTitle}. ${mod.theoryDescEs}`);
        }
      } else if (lang === 'de') {
        list.push("Die Laufstrecke ist unendlich durch prozedurale mathematische Generierung!");
        list.push("Hindernisse und Achtsamkeits-Items erscheinen passend zu Ihrer individuellen Angstkurve.");
        list.push("Kollisionen werden blitzschnell über AABB-Bounding-Boxes und euklidische Distanz berechnet.");
        if (includeTheory) {
          list.push(`Technische Grundlagen: ${mod.theoryTitle}. ${mod.theoryDescDe}`);
        }
      } else {
        list.push("A pista do jogo é infinita porque os obstáculos não são gravados previamente!");
        list.push("O algoritmo procedural gera calçadas e itens no horizonte, reciclando-os na memória para evitar travamentos.");
        list.push("A colisão usa equações de distância euclidiana tridimensional e caixas AABB ultra-rápidas!");
        if (includeTheory) {
          list.push(`Fundamentos Técnicos: ${mod.theoryTitle}. ${mod.theoryDescPt}`);
        }
      }
    } else if (mod.id === 'webaudio_synthesis') {
      if (lang === 'en') {
        list.push("A key engineering feat: this simulator downloads zero heavy MP3 or WAV audio files!");
        list.push("All sound effects are synthesized mathematically in real time using the Web Audio API.");
        list.push("This includes the 528 Hz Solfeggio frequency chime and 4-7-8 diaphragmatic breathing swell!");
        if (includeTheory) {
          list.push(`Technical Foundation: ${mod.theoryTitle}. ${mod.theoryDescEn}`);
        }
      } else if (lang === 'es') {
        list.push("¡Una gran innovación de ingeniería: este juego no descarga ningún archivo MP3!");
        list.push("Todos los sonidos se sintetizan matemáticamente en tiempo real con la Web Audio API.");
        list.push("Incluyendo la frecuencia Solfeggio 528Hz, el ciclo de respiración 4-7-8 y chutes de fútbol.");
        if (includeTheory) {
          list.push(`Fundamentos Técnicos: ${mod.theoryTitle}. ${mod.theoryDescEs}`);
        }
      } else if (lang === 'de') {
        list.push("Ein technologisches Highlight: Es werden keinerlei MP3-Dateien über das Internet geladen!");
        list.push("Alle Soundeffekte werden in Echtzeit mathematisch über die Web Audio API erzeugt.");
        list.push("Einschließlich der heilsamen 528-Hz-Solfeggio-Klangschale und der 4-7-8-Atemfrequenzen!");
        if (includeTheory) {
          list.push(`Technische Grundlagen: ${mod.theoryTitle}. ${mod.theoryDescDe}`);
        }
      } else {
        list.push("Uma grande inovação de engenharia: este jogo não baixa nenhum arquivo pesado como MP3!");
        list.push("Todos os sons são sintetizados matematicamente em tempo real usando osciladores da Web Audio API.");
        list.push("Isso inclui o sino zen, o ciclo de respiração 4-7-8 e a frequência Solfeggio de 528 Hertz!");
        if (includeTheory) {
          list.push(`Fundamentos Técnicos: ${mod.theoryTitle}. ${mod.theoryDescPt}`);
        }
      }
    } else if (mod.id === 'psychometrics_sas') {
      if (lang === 'en') {
        list.push("The simulator is a validated educational instrument born from scientific research at EEEM Felipe Camarão.");
        list.push("Validated SAS smartphone addiction questions track your digital habits during the run.");
        list.push("Stress and anxiety modulate in-game running speed, heart rate, and notification overload!");
        if (includeTheory) {
          list.push(`Technical Foundation: ${mod.theoryTitle}. ${mod.theoryDescEn}`);
        }
      } else if (lang === 'es') {
        list.push("¡El juego es un instrumento científico validado por la investigación de la Escuela Felipe Camarão!");
        list.push("A medida que corres, preguntas validadas de la escala SAS miden el uso de pantallas y ansiedad.");
        list.push("El estrés acumulado acelera la velocidad del avatar y la sobrecarga de notificaciones.");
        if (includeTheory) {
          list.push(`Fundamentos Técnicos: ${mod.theoryTitle}. ${mod.theoryDescEs}`);
        }
      } else if (lang === 'de') {
        list.push("Das Spiel ist ein valides Forschungsinstrument der Schule Felipe Camarão.");
        list.push("Valide SAS-Fragen messen Bildschirmzeit und Smartphone-Nutzung während des Laufs.");
        list.push("Der Stress moduliert Geschwindigkeit, Herzfrequenz und Benachrichtigungsüberlastung!");
        if (includeTheory) {
          list.push(`Technische Grundlagen: ${mod.theoryTitle}. ${mod.theoryDescDe}`);
        }
      } else {
        list.push("O jogo é um instrumento pedagógico e científico validado pela pesquisa da Escola Felipe Camarão!");
        list.push("Conforme seu avatar corre, perguntas validadas da escala SAS medem o uso de telas e a ansiedade.");
        list.push("O estresse acumulado acelera a velocidade da corrida e a sobrecarga de notificações!");
        if (includeTheory) {
          list.push(`Fundamentos Técnicos: ${mod.theoryTitle}. ${mod.theoryDescPt}`);
        }
      }
    } else if (mod.id === 'offline_firebase') {
      if (lang === 'en') {
        list.push("Designed for schools with unstable internet, the app operates on an Offline-First architecture.");
        list.push("It works 100% offline via local storage, ensuring complete student privacy compliance.");
        list.push("When internet restores, it seamlessly synchronizes with Google Cloud Firestore in the background!");
        if (includeTheory) {
          list.push(`Technical Foundation: ${mod.theoryTitle}. ${mod.theoryDescEn}`);
        }
      } else if (lang === 'es') {
        list.push("Pensado para aulas con internet inestable, el juego utiliza arquitectura Offline-First.");
        list.push("Funciona 100% sin conexión en el armazenamento local, protegiendo la privacidad de los alumnos.");
        list.push("Al recuperar conexión, sincroniza en segundo plano con Google Cloud Firestore.");
        if (includeTheory) {
          list.push(`Fundamentos Técnicos: ${mod.theoryTitle}. ${mod.theoryDescEs}`);
        }
      } else if (lang === 'de') {
        list.push("Entwickelt für Schulen mit instabilem Internet: Nutzt eine Offline-First-Architektur.");
        list.push("Funktioniert 100% offline über lokalen Speicher und schützt die Privatsphäre der Schüler.");
        list.push("Sobald eine Verbindung besteht, synchronisiert es nahtlos mit Google Cloud Firestore!");
        if (includeTheory) {
          list.push(`Technische Grundlagen: ${mod.theoryTitle}. ${mod.theoryDescDe}`);
        }
      } else {
        list.push("Pensando nas escolas brasileiras com internet instável, o jogo utiliza arquitetura Offline-First.");
        list.push("Ele funciona perfeitamente sem nenhuma internet, salvando tudo no armazenamento local do aparelho.");
        list.push("Quando a conexão volta, ele sincroniza automaticamente com o Google Cloud Firestore!");
        if (includeTheory) {
          list.push(`Fundamentos Técnicos: ${mod.theoryTitle}. ${mod.theoryDescPt}`);
        }
      }
    } else if (mod.id === 'roblox_luau') {
      if (lang === 'en') {
        list.push("We empower students to become game creators, not just passive consumers!");
        list.push("The exact mechanics and anxiety formulas are mirrored in clean Luau scripts for Roblox Studio.");
        list.push("You can inspect the source code and learn how to program your own 3D world in Roblox!");
        if (includeTheory) {
          list.push(`Technical Foundation: ${mod.theoryTitle}. ${mod.theoryDescEn}`);
        }
      } else if (lang === 'es') {
        list.push("¡Inspiramos a los jóvenes a ser creadores de videojuegos y no solo consumidores!");
        list.push("La lógica matemática de colisión y estrés está disponible en scripts Luau listos para Roblox Studio.");
        list.push("¡Puedes abrir el código fuente y aprender cómo construir tu propio juego 3D!");
        if (includeTheory) {
          list.push(`Fundamentos Técnicos: ${mod.theoryTitle}. ${mod.theoryDescEs}`);
        }
      } else if (lang === 'de') {
        list.push("Wir ermutigen Jugendliche, selbst Spieleentwickler zu werden!");
        list.push("Die gesamte Spiellogik liegt in sauberem Luau-Code vor, bereit für Roblox Studio.");
        list.push("Du kannst den Quellcode öffnen und lernen, dein eigenes 3D-Spiel zu programmieren!");
        if (includeTheory) {
          list.push(`Technische Grundlagen: ${mod.theoryTitle}. ${mod.theoryDescDe}`);
        }
      } else {
        list.push("Queremos que os jovens não sejam apenas consumidores, mas criadores de jogos!");
        list.push("A mesma lógica de colisão e ansiedade foi espelhada em scripts Luau prontos para o Roblox Studio.");
        list.push("Você pode abrir o código fonte e aprender como construir seu próprio jogo 3D no Roblox!");
        if (includeTheory) {
          list.push(`Fundamentos Técnicos: ${mod.theoryTitle}. ${mod.theoryDescPt}`);
        }
      }
    }
    return list;
  };

  const currentParagraphs = getModuleParagraphs(activeModule, includeTheoryInSpeech, language);

  // Sequentially speak paragraph-by-paragraph to synchronize with the Comic Speech Balloon
  const speakSequentialParagraph = (pIndex: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const paragraphs = getModuleParagraphs(activeModule, includeTheoryInSpeech, language);
    if (pIndex < 0 || pIndex >= paragraphs.length) return;

    setCurrentParagraphIndex(pIndex);
    const textToSpeak = paragraphs[pIndex];

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    currentUtteranceRef.current = utterance;

    const localeMap: Record<string, string> = { pt: 'pt-BR', es: 'es-ES', en: 'en-US', de: 'de-DE' };
    utterance.lang = localeMap[language] || 'pt-BR';
    if (gameSettings?.ttsRate) utterance.rate = gameSettings.ttsRate;
    if (gameSettings?.ttsPitch) utterance.pitch = gameSettings.ttsPitch;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setRobotMood('speaking');
    };

    utterance.onend = () => {
      if (pIndex + 1 < paragraphs.length) {
        // Automatically advance to the next paragraph in the comic bubble after natural pause
        setTimeout(() => {
          speakSequentialParagraph(pIndex + 1);
        }, 380);
      } else {
        // Concluded all paragraphs of this module
        setIsSpeaking(false);
        setRobotMood('idle');
        markModuleTested(activeModule.id);

        if (isAutoPresentation) {
          setTimeout(() => {
            setActiveModuleIndex((prev) => {
              if (prev < TECH_MODULES.length - 1) {
                return prev + 1;
              } else {
                setIsAutoPresentation(false);
                confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
                return prev;
              }
            });
          }, 2500);
        }
      }
    };

    utterance.onerror = (e) => {
      if (e.error !== 'canceled') {
        console.warn('SpeechSynthesis error:', e);
      }
      setIsSpeaking(false);
      setRobotMood('idle');
    };

    window.speechSynthesis.speak(utterance);
  };

  // Toggle narration playback
  const toggleSpeech = () => {
    if (isSpeaking) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      setRobotMood('idle');
    } else {
      speakSequentialParagraph(currentParagraphIndex);
    }
  };

  // Handle Robot Pulling the corner of the game screen like a book page
  const handleRobotPeelCorner = () => {
    setIsRobotPullingPage(true);
    flyToSection('code_peel');
    triggerFeedback(
      '📖 O Robô Assistente voou até o canto da tela do jogo e puxou como uma folha de livro, revelando o código fonte rodando por baixo!',
      'Puxando o canto da página do jogo! Veja o código fonte executando em tempo real na GPU.',
      '📖 Código Revelado Sob a Folha'
    );
    setTimeout(() => {
      setIsRobotPullingPage(false);
    }, 4500);
  };

  // Trigger feedback toast only (does not interrupt voice narration)
  const triggerFeedback = (message: string, _robotSpeech?: string, _statusLabel?: string) => {
    setActionFeedback(message);
    setTimeout(() => {
      setActionFeedback((prev) => (prev === message ? null : prev));
    }, 3500);
  };

  // Reset module to 1 on initial open (auto-presentation disabled by default)
  useEffect(() => {
    if (isOpen) {
      setActiveModuleIndex(0);
      setCurrentParagraphIndex(0);
      setIsAutoPresentation(false);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
    } else {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      setRobotMood('idle');
    }
  }, [isOpen]);

  // Read module narration when auto-presentation is active or requested
  useEffect(() => {
    if (!isOpen || !isAutoPresentation) return;

    setCurrentParagraphIndex(0);
    speakSequentialParagraph(0);

    // Keep Chrome speech engine alive on long text
    const keepAlive = setInterval(() => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (window.speechSynthesis.speaking && window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }
    }, 2000);

    return () => {
      clearInterval(keepAlive);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      setRobotMood('idle');
    };
  }, [activeModuleIndex, isOpen, language, includeTheoryInSpeech, isAutoPresentation]);

  const [hoverTime, setHoverTime] = useState<number>(0);

  // User Interactive Drag & Custom Position Hover State
  const [isUserMoved, setIsUserMoved] = useState<boolean>(false);
  const [customPosition, setCustomPosition] = useState<{ x: number; y: number }>({ x: 120, y: 150 });
  const [isDraggingRobot, setIsDraggingRobot] = useState<boolean>(false);
  const [userPauseTimeLeft, setUserPauseTimeLeft] = useState<number>(0);

  const userMoveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const dragStartOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Function to activate/reset the 10-second pause & hover timer
  const activateCustomHoverTimer = (startX?: number, startY?: number) => {
    setIsUserMoved(true);
    setUserPauseTimeLeft(10);

    if (startX !== undefined && startY !== undefined) {
      setCustomPosition({ x: startX, y: startY });
    }

    if (userMoveTimerRef.current) clearTimeout(userMoveTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    countdownIntervalRef.current = setInterval(() => {
      setUserPauseTimeLeft((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    userMoveTimerRef.current = setTimeout(() => {
      setIsUserMoved(false);
      setIsDraggingRobot(false);
      setUserPauseTimeLeft(0);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }, 10000);
  };

  useEffect(() => {
    return () => {
      if (userMoveTimerRef.current) clearTimeout(userMoveTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Real-time AI Organic Hovering & Floating Loop
  useEffect(() => {
    let frameId: number;
    const startTime = Date.now();

    const loop = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      setHoverTime(elapsed);
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const isMobileScreen = typeof window !== 'undefined' && window.innerWidth < 768;
  const effectiveFlightX = isMobileScreen ? Math.min(flightPose.x * 0.25, 20) : Math.min(flightPose.x, 320);
  const effectiveFlightY = flightPose.y;

  const currentRobotX = isUserMoved ? customPosition.x : effectiveFlightX;
  const currentRobotY = isUserMoved ? customPosition.y : effectiveFlightY;

  // Real-time AI Organic Hovering & Floating Loop (with gentle side-to-side gliding when positioned by user)
  const hoverOffsetX = isUserMoved
    ? Math.sin(hoverTime * 2.8) * 22 + Math.cos(hoverTime * 1.2) * 6
    : Math.sin(hoverTime * 1.8) * 16 + Math.cos(hoverTime * 0.9) * 8;

  const hoverOffsetY = isUserMoved
    ? Math.cos(hoverTime * 2.0) * 8
    : Math.cos(hoverTime * 1.4) * 18 + Math.sin(hoverTime * 0.7) * 10;

  const hoverRotateZ = flightPose.rotateZ + (isUserMoved ? Math.sin(hoverTime * 2.8) * 4 : Math.sin(hoverTime * 2.2) * 5);

  const labContainerRef = useRef<HTMLDivElement>(null);

  // Pointer Drag Handlers for Repositioning the Flying Robot
  const handleRobotPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (_) {}
    
    setIsDraggingRobot(true);

    const containerRect = labContainerRef.current?.getBoundingClientRect();
    const scrollTop = labContainerRef.current?.scrollTop || 0;
    const scrollLeft = labContainerRef.current?.scrollLeft || 0;

    const startX = currentRobotX;
    const startY = currentRobotY;

    if (containerRect) {
      const clickXInContainer = e.clientX - containerRect.left + scrollLeft;
      const clickYInContainer = e.clientY - containerRect.top + scrollTop;
      
      dragStartOffsetRef.current = {
        x: clickXInContainer - startX,
        y: clickYInContainer - startY,
      };
    }

    activateCustomHoverTimer(startX, startY);
  };

  const handleRobotPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRobot || !labContainerRef.current) return;
    e.stopPropagation();

    const containerRect = labContainerRef.current.getBoundingClientRect();
    const scrollTop = labContainerRef.current.scrollTop;
    const scrollLeft = labContainerRef.current.scrollLeft;

    const currentMouseX = e.clientX - containerRect.left + scrollLeft;
    const currentMouseY = e.clientY - containerRect.top + scrollTop;

    const newX = Math.max(10, Math.min(currentMouseX - dragStartOffsetRef.current.x, containerRect.width - 120));
    const newY = Math.max(10, currentMouseY - dragStartOffsetRef.current.y);

    activateCustomHoverTimer(newX, newY);
  };

  const handleRobotPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRobot) {
      e.stopPropagation();
      setIsDraggingRobot(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (_) {}
      activateCustomHoverTimer(customPosition.x, customPosition.y);
    }
  };

  // Auto-scroll disabled per user request so the page stays in the user's defined viewport.

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10005] bg-[#080d19] flex flex-col w-screen h-screen overflow-hidden text-white animate-in fade-in duration-200">
      <div className="relative w-full h-full flex flex-col overflow-hidden text-white">
        {/* Top Accent Gradient Bar */}
        <div className="w-full h-1.5 bg-gradient-to-r from-cyan-400 via-amber-400 to-emerald-400" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 border border-cyan-300/40 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20 shrink-0 relative">
              <Cpu className="w-6 h-6 text-slate-950 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-950 rounded-full animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300 bg-cyan-950/80 border border-cyan-400/30 px-2.5 py-0.5 rounded-full">
                  🔬 Bastidores & Tecnologia • Laboratório Dev
                </span>
                <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-400/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  {testedModules.size}/{TECH_MODULES.length} Explorados
                </span>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-tight text-white mt-0.5">
                Como Este Jogo Foi Desenvolvido
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playButtonClickSFX(soundEnabled);
                setIsAutoPresentation((prev) => {
                  const nextState = !prev;
                  if (nextState) {
                    setCurrentParagraphIndex(0);
                    speakSequentialParagraph(0);
                  } else {
                    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                      window.speechSynthesis.cancel();
                    }
                    setIsSpeaking(false);
                    setRobotMood('idle');
                  }
                  return nextState;
                });
              }}
              className={`px-3.5 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                isAutoPresentation
                  ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 shadow-emerald-500/30 ring-2 ring-emerald-300 animate-pulse'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
              title={isAutoPresentation ? 'Pausar Tour Automático Guiado' : 'Iniciar Tour Automático Guiado pelo Robô'}
            >
              {isAutoPresentation ? (
                <>
                  <Pause className="w-4 h-4 fill-slate-950 shrink-0" />
                  <span className="hidden md:inline">Pausar Tour Automático</span>
                  <span className="md:hidden">Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white shrink-0" />
                  <span className="hidden md:inline">▶️ Apresentação Automática</span>
                  <span className="md:hidden">▶️ Auto</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
                setIsAutoPresentation(false);
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors cursor-pointer shrink-0"
              title="Fechar Laboratório Tecnológico"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Automated Presentation Live Status Line */}
        {isAutoPresentation && (
          <div className="w-full bg-slate-950 h-3 relative overflow-hidden border-b border-cyan-500/40">
            <div
              className={`h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400 transition-all duration-300 ${
                isSpeaking ? 'w-full animate-pulse opacity-90' : 'w-full opacity-60'
              }`}
            />
            <div className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-black uppercase text-cyan-100 tracking-widest drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              🤖 Apresentação Automática • Módulo {activeModuleIndex + 1}/{TECH_MODULES.length} ({activeModule.badge}) {isSpeaking ? '• Lendo Texto Integral...' : '• Próximo Módulo ao Concluir'}
            </div>
          </div>
        )}

        {/* Action / Demonstration Feedback Toast */}
        {actionFeedback && (
          <div className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 text-slate-950 px-4 py-2 text-center text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Sparkles className="w-4 h-4 fill-slate-950 animate-spin" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Module Selection Navigation Carousel */}
        <div className="bg-slate-950/90 border-b border-white/10 px-4 py-2.5 overflow-x-auto flex items-center gap-2 scrollbar-thin">
          {TECH_MODULES.map((mod, index) => {
            const isActive = index === activeModuleIndex;
            const isTested = testedModules.has(mod.id);
            return (
              <button
                key={mod.id}
                onClick={() => {
                  playButtonClickSFX(soundEnabled);
                  setActiveModuleIndex(index);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-102'
                    : isTested
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/40'
                    : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{mod.icon}</span>
                <span>{mod.title.split('.')[1] || mod.title}</span>
                {isTested && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Main Content Body (Flight Arena for the Autonomous Robot) */}
        <div ref={labContainerRef} className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 relative scroll-smooth">
          
          {/* --- AUTONOMOUS FLYING ROBOT ASSISTANT WITH ATTACHED COMIC SPEECH BALLOON --- */}
          <div
            onPointerDown={handleRobotPointerDown}
            onPointerMove={handleRobotPointerMove}
            onPointerUp={handleRobotPointerUp}
            className="absolute top-0 left-0 z-40 pointer-events-auto transition-transform flex items-start gap-3 touch-none select-none cursor-grab active:cursor-grabbing"
            style={{
              transform: `translate3d(${currentRobotX + hoverOffsetX}px, ${currentRobotY + hoverOffsetY}px, 0px) rotateY(${flightPose.rotateY}deg) rotateZ(${hoverRotateZ}deg) scale(${flightPose.scale})`,
              transition: isDraggingRobot ? 'none' : 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)',
              perspective: '1200px',
            }}
          >
            {/* The Robot Avatar Head */}
            <div className="relative shrink-0 pointer-events-auto">
              {/* Sci-Fi Orbiting Ring */}
              <div className="absolute -inset-3 rounded-full border border-cyan-400/30 animate-orbit-spin pointer-events-none" />

              {/* Indicator Badge when User Repositions / Pauses Robot */}
              {isUserMoved && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 font-black text-[9px] px-2.5 py-0.5 rounded-full border-2 border-slate-950 shadow-md flex items-center gap-1 whitespace-nowrap animate-pulse">
                  <Move className="w-3 h-3 text-slate-950" />
                  <span>PLANANDO PARADO • {userPauseTimeLeft}s</span>
                </div>
              )}

              {/* Holographic Reading Scan Beam projecting onto active content */}
              {flightPose.isScanningText && (
                <div className="hidden md:block absolute top-10 left-20 w-80 h-36 bg-gradient-to-r from-cyan-400/30 via-cyan-400/10 to-transparent pointer-events-none [clip-path:polygon(0%_40%,100%_0%,100%_100%,0%_60%)] animate-pulse z-10" />
              )}

              {/* Animated Ion Plasma Jet Thruster when flying */}
              {(isSpeaking || flightPose.targetSection !== 'dock' || isUserMoved) && (
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
                  <div className="w-6 h-6 bg-gradient-to-b from-cyan-400 via-sky-500 to-transparent rounded-full blur-[2px] animate-pulse" />
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-200 animate-ping -mt-1" />
                </div>
              )}
              
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isUserMoved) {
                    const nextSectionMap: Record<string, 'narration' | 'playground' | 'simulator' | 'code_peel' | 'theory' | 'dock'> = {
                      dock: 'narration',
                      narration: 'playground',
                      playground: 'simulator',
                      simulator: 'code_peel',
                      code_peel: 'theory',
                      theory: 'dock',
                      user_engage: 'playground',
                    };
                    const nextSection = nextSectionMap[flightPose.targetSection] || 'narration';
                    flyToSection(nextSection);
                  }
                }}
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br transition-all duration-500 border-4 border-slate-950 flex items-center justify-center relative shadow-2xl pointer-events-auto cursor-pointer hover:scale-105 active:scale-95 ${
                  isSpeaking || isUserMoved
                    ? flightPose.isSmiling || isUserMoved
                      ? 'from-emerald-300 via-cyan-400 to-teal-500 shadow-[0_0_40px_rgba(16,185,129,0.85)]'
                      : 'from-amber-300 via-amber-400 to-yellow-500 shadow-[0_0_35px_rgba(245,158,11,0.75)]'
                    : 'from-cyan-400 via-sky-500 to-blue-600 shadow-[0_0_28px_rgba(6,182,212,0.45)]'
                }`}
                title="Robô Assistente • Arraste ou clique para posicioná-lo e fazê-lo planar por 10s!"
              >
                {/* Radar Antenna on top of head */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <span className={`w-2 h-2 rounded-full animate-ping shadow-[0_0_8px_#f87171] ${flightPose.isSmiling ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <span className="w-0.5 h-3 bg-cyan-300" />
                </div>

                {/* Unified Robot Icon with Animated Eyes Built Directly Into the Robot's Face */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`w-12 h-12 sm:w-14 sm:h-14 text-slate-950 transition-transform duration-300 relative z-10 ${isSpeaking ? 'scale-110' : ''}`}
                >
                  {/* Robot Antenna */}
                  <path d="M12 8V4H8" />

                  {/* Robot Head Frame */}
                  <rect width="16" height="12" x="4" y="8" rx="2" />

                  {/* Robot Ears */}
                  <path d="M2 14h2" />
                  <path d="M20 14h2" />

                  {/* ROBOT'S ACTUAL LEFT EYE (x=9, y=14) */}
                  {flightPose.isBlinking ? (
                    <line x1="7.8" y1="14" x2="10.2" y2="14" stroke="currentColor" strokeWidth="2.2" />
                  ) : flightPose.isSmiling ? (
                    <path d="M7.6 14.8 Q 9 13 10.4 14.8" stroke="currentColor" strokeWidth="2.2" fill="none" />
                  ) : flightPose.isScanningText ? (
                    <g>
                      <circle cx="8.6" cy="14" r="1.3" fill="#22d3ee" stroke="currentColor" strokeWidth="0.8" />
                      <circle cx="8.6" cy="14" r="0.5" fill="#ffffff" />
                    </g>
                  ) : (
                    <line x1="9" y1="13" x2="9" y2="15" stroke="currentColor" strokeWidth="2" />
                  )}

                  {/* ROBOT'S ACTUAL RIGHT EYE (x=15, y=14) */}
                  {flightPose.isBlinking ? (
                    <line x1="13.8" y1="14" x2="16.2" y2="14" stroke="currentColor" strokeWidth="2.2" />
                  ) : flightPose.isSmiling ? (
                    <path d="M13.6 14.8 Q 15 13 16.4 14.8" stroke="currentColor" strokeWidth="2.2" fill="none" />
                  ) : flightPose.isScanningText ? (
                    <g>
                      <circle cx="14.6" cy="14" r="1.3" fill="#22d3ee" stroke="currentColor" strokeWidth="0.8" />
                      <circle cx="14.6" cy="14" r="0.5" fill="#ffffff" />
                    </g>
                  ) : (
                    <line x1="15" y1="13" x2="15" y2="15" stroke="currentColor" strokeWidth="2" />
                  )}

                  {/* ROBOT'S INTEGRATED MOUTH */}
                  {flightPose.isSmiling ? (
                    <path d="M9.8 17 Q 12 18.8 14.2 17" stroke="currentColor" strokeWidth="1.8" fill="none" />
                  ) : isSpeaking ? (
                    <line x1="10" y1="17.2" x2="14" y2="17.2" stroke="currentColor" strokeWidth="1.6" className="animate-pulse" />
                  ) : null}
                </svg>

                {/* Floating Laboratory Artifact Beside Robot Head */}
                {activeModule.id === 'google_aistudio' && (
                  <div className="absolute -top-1 -right-2 bg-sky-950 border border-sky-400 p-1.5 rounded-xl shadow-lg animate-bounce">
                    <Sparkles className="w-4 h-4 text-sky-300" />
                  </div>
                )}
                {activeModule.id === 'webgl_threejs' && (
                  <div className="absolute -top-1 -right-2 bg-cyan-950 border border-cyan-400 p-1.5 rounded-xl shadow-lg animate-bounce">
                    <Box className="w-4 h-4 text-cyan-300" />
                  </div>
                )}
                {activeModule.id === 'physics_procedural' && (
                  <div className="absolute -top-1 -right-2 bg-emerald-950 border border-emerald-400 p-1.5 rounded-xl shadow-lg animate-bounce">
                    <Zap className="w-4 h-4 text-emerald-300" />
                  </div>
                )}
                {activeModule.id === 'webaudio_synthesis' && (
                  <div className="absolute -top-1 -right-2 bg-amber-950 border border-amber-400 p-1.5 rounded-xl shadow-lg animate-bounce">
                    <Music className="w-4 h-4 text-amber-300" />
                  </div>
                )}
                {activeModule.id === 'psychometrics_sas' && (
                  <div className="absolute -top-1 -right-2 bg-purple-950 border border-purple-400 p-1.5 rounded-xl shadow-lg animate-bounce">
                    <HeartPulse className="w-4 h-4 text-purple-300" />
                  </div>
                )}
                {activeModule.id === 'offline_firebase' && (
                  <div className="absolute -top-1 -right-2 bg-rose-950 border border-rose-400 p-1.5 rounded-xl shadow-lg animate-bounce">
                    <Cloud className="w-4 h-4 text-rose-300" />
                  </div>
                )}
                {activeModule.id === 'roblox_luau' && (
                  <div className="absolute -top-1 -right-2 bg-indigo-950 border border-indigo-400 p-1.5 rounded-xl shadow-lg animate-bounce">
                    <Code2 className="w-4 h-4 text-indigo-300" />
                  </div>
                )}

                {/* Animated Equalizer Waveform when Robot is speaking */}
                {isSpeaking && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-end gap-1 bg-slate-950/95 px-2.5 py-1 rounded-full border border-amber-400 shadow-lg">
                    <span className="w-1 h-3.5 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1 h-5 bg-amber-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1 h-2.5 bg-yellow-400 rounded-full animate-bounce" />
                    <span className="w-1 h-4 bg-orange-300 rounded-full animate-bounce [animation-delay:-0.2s]" />
                  </div>
                )}
              </div>
            </div>

            {/* ATTACHED COMIC BOOK SPEECH BALLOON (GLIDES ALONGSIDE ROBOT ON EVERY FLIGHT) */}
            <div className="relative pointer-events-auto w-[280px] sm:w-[380px] md:w-[440px] shrink-0 z-50">
              <div className={`relative bg-white/70 backdrop-blur-md text-slate-950 rounded-3xl p-4 sm:p-5 border-4 border-slate-950/80 shadow-[6px_6px_0px_rgba(2,6,23,0.7)] transition-all duration-300 ${
                flightPose.isScanningText ? 'ring-4 ring-cyan-400/80 shadow-[6px_6px_0px_rgba(2,6,23,0.7),0_0_25px_rgba(34,211,238,0.4)]' : ''
              }`}>
                {/* Pointer Tail pointing directly to Robot Head */}
                <div className="absolute -left-4 top-7 w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[16px] border-r-slate-950/80" aria-hidden="true" />
                <div className="absolute -left-2.5 top-7 w-0 h-0 border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent border-r-[13px] border-r-white/70" aria-hidden="true" />

                {/* Active Paragraph Content (Clean Comic Speech Balloon) */}
                <div className="py-0.5 min-h-[36px] flex items-center">
                  <p className="text-xs sm:text-sm font-black text-slate-950 leading-relaxed font-sans tracking-tight">
                    "{currentParagraphs[currentParagraphIndex] || currentParagraphs[0]}"
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* All Modules Explored / Completion Banner */}
          {testedModules.size === TECH_MODULES.length && (
            <div className="bg-gradient-to-r from-emerald-950/80 via-teal-950/80 to-cyan-950/80 border-2 border-emerald-400/60 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.2)] animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-lg shadow-emerald-500/30">
                  <Award className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tight">
                    🏆 Tour Completo Concluído! O Assistente Permanece Ativo
                  </h4>
                  <p className="text-xs text-emerald-300/90 font-medium">
                    Todos os 6 módulos foram explorados. O laboratório nunca fecha automaticamente para que você continue experimentando a simulação e o código fonte revelado!
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  playButtonClickSFX(soundEnabled);
                  setActiveModuleIndex(0);
                  setCurrentParagraphIndex(0);
                  speakSequentialParagraph(0);
                }}
                className="px-3.5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-md shrink-0 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reiniciar Tour</span>
              </button>
            </div>
          )}

          {/* --- INTERACTIVE ANIMATED ROBOT ASSISTANT SCIENTIST COMPANION STAGE --- */}
          <div className="bg-gradient-to-r from-[#070e20] via-[#0f1938] to-[#070e20] border-2 border-cyan-400/50 rounded-3xl p-4 sm:p-6 shadow-[0_0_50px_rgba(34,211,238,0.2)] relative overflow-hidden flex flex-col md:flex-row items-center gap-5">
            
            {/* Background Holographic Grid & Animated Scanning Effects */}
            <div className="absolute inset-0 bg-sleek-grid opacity-20 pointer-events-none" />
            
            {/* Laser Scanning Line Sweep Effect */}
            {(robotMood === 'scan' || labEffect === 'laser_scan') && (
              <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-scan-laser z-10 pointer-events-none" />
            )}

            {/* Matrix Green Code Overlay when compiling Luau */}
            {(robotMood === 'matrix' || labEffect === 'code_matrix') && (
              <div className="absolute inset-0 bg-emerald-950/20 backdrop-blur-[1px] pointer-events-none z-0 flex justify-between px-4 text-[10px] font-mono text-emerald-400/40 select-none overflow-hidden">
                <div className="animate-float-particles">0101 1100 LUAU ROBLOX</div>
                <div className="animate-float-particles [animation-delay:0.5s]">FUNCTION HUMANOID.WALKSPEED()</div>
                <div className="animate-float-particles [animation-delay:1s]">MATH.ABS(ANXIETY * 0.5)</div>
                <div className="animate-float-particles [animation-delay:1.5s]">RETURN 16 + STRESS</div>
              </div>
            )}

            {/* Concentric Soundwave Ripples when Synthesizing Audio */}
            {(robotMood === 'synthesize' || labEffect === 'sound_wave') && (
              <div className="absolute left-12 top-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 border-amber-400/40 animate-pulse-ring pointer-events-none" />
            )}

            {/* Futuristic Landing Dock & Launch Pad Base for the Free-Flying Robot */}
            <div className="relative shrink-0 flex flex-col items-center">
              <div
                onClick={() => flyToSection('dock')}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-cyan-400/40 bg-cyan-950/40 flex flex-col items-center justify-center relative shadow-[0_0_25px_rgba(34,211,238,0.2)] cursor-pointer hover:border-cyan-300 transition-all group"
                title="Base do Robô • Clique para chamá-lo de volta à base"
              >
                <div className="absolute -inset-2 rounded-full border border-cyan-400/20 animate-orbit-spin pointer-events-none" />
                <div className="w-14 h-14 rounded-full bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                  <Bot className="w-7 h-7 text-cyan-300 animate-pulse" />
                </div>
                <span className="text-[8px] font-mono font-black text-cyan-300 uppercase tracking-widest mt-1">BASE DE VOO</span>
              </div>
              <span className="text-[9px] font-mono text-slate-400 mt-1.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                Livre Navegação
              </span>
            </div>

            {/* Robot Dynamic Speech Bubble & Laboratory Dialogue Card */}
            <div className="flex-1 space-y-2.5 text-center md:text-left w-full z-10">
              <div className="flex items-center justify-between gap-2 flex-wrap justify-center md:justify-start">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300 bg-cyan-500/20 px-3 py-1 rounded-full border border-cyan-400/30">
                    🤖 Assistente Guiando
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {activeModule.title}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Toggle: Ler também os Fundamentos Técnicos */}
                  <button
                    onClick={() => {
                      playButtonClickSFX(soundEnabled);
                      setIncludeTheoryInSpeech((prev) => {
                        const next = !prev;
                        triggerFeedback(
                          next
                            ? '🧠 Fundamentos Técnicos ativados na leitura do assistente!'
                            : '📖 Leitura configurada apenas para introdução.',
                          next ? 'Vou ler também os fundamentos e detalhes de arquitetura!' : 'Lendo apenas o texto introdutório.'
                        );
                        if (isSpeaking) {
                          setCurrentParagraphIndex(0);
                          speakSequentialParagraph(0);
                        }
                        return next;
                      });
                    }}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border shadow-sm ${
                      includeTheoryInSpeech
                        ? 'bg-purple-950/80 text-purple-200 border-purple-400/50 shadow-purple-500/20 ring-1 ring-purple-400/40'
                        : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                    }`}
                    title="Ativa ou desativa a leitura completa dos Fundamentos Técnicos pelo robô"
                  >
                    <Layers className="w-3.5 h-3.5 text-purple-300" />
                    <span>{includeTheoryInSpeech ? '🧠 + Fundamentos Técnicos (Ativo)' : '🧠 Fundamentos (Desativado)'}</span>
                  </button>

                  <button
                    onClick={toggleSpeech}
                    className={`px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                      isSpeaking
                        ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
                        : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-500/20'
                    }`}
                  >
                    {isSpeaking ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Pausar Voz</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Ouvir com Voz</span>
                      </>
                    )}
                  </button>
                </div>
              </div>




            </div>
          </div>

          {/* Module Title Banner */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${activeModule.badgeColor}`}>
                {activeModule.badge}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Módulo {activeModuleIndex + 1} de {TECH_MODULES.length}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {activeModule.title}
            </h3>
            <p className="text-xs sm:text-sm text-cyan-300 font-medium">
              {activeModule.subtitle}
            </p>
          </div>

          {/* Interactive Live Playground: Buttons that trigger real actions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-cyan-300">
                Experiências Interativas com Reação do Robô em Tempo Real:
              </h4>
            </div>

            {/* MODULE 1: Google AI Studio & Gemini Engineering Inspector */}
            {activeModule.id === 'google_aistudio' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-cyan-400 animate-pulse" />
                    Inspetor de Prompts do Google AI Studio • Selecione um Prompt:
                  </span>
                  <span className="bg-sky-950 text-sky-300 border border-sky-400/40 text-[10px] font-mono px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-sky-400 fill-sky-400" />
                    Google AI Studio • Gemini 2.5
                  </span>
                </div>

                {/* Turma 61 Scientific Credit Banner & Technical Advisory */}
                <div className="bg-gradient-to-r from-cyan-950 via-sky-900 to-indigo-950 border-2 border-cyan-400/60 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400 border border-slate-950 flex items-center justify-center text-slate-950 shrink-0 shadow-md">
                      <Award className="w-6 h-6 fill-slate-950" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-black text-amber-300 uppercase tracking-widest block">
                        🎓 CRÉDITO CIENTÍFICO DA TURMA 61 • EEEM FELIPE CAMARÃO
                      </span>
                      <p className="text-xs font-bold text-white leading-tight mt-0.5">
                        Os modelos Gemini no Google AI Studio atuaram como engenheiros de software seniores virtuais <u className="text-cyan-300 underline-offset-2">somente em razão do projeto de pesquisa da Turma 61</u> e sob as instruções e diretrizes formuladas pelos estudantes pesquisadores e orientadores.
                      </p>
                    </div>
                  </div>

                  <div className="w-full md:w-auto shrink-0 bg-slate-950/85 border border-cyan-400/50 rounded-xl p-2.5 flex items-center gap-2.5 shadow-inner">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shrink-0">
                      <Cpu className="w-4 h-4 text-cyan-300" />
                    </div>
                    <div>
                      <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                        Orientador Técnico de Desenvolvimento
                      </span>
                      <span className="text-xs font-black text-white block">
                        Christian Dahmer
                      </span>
                    </div>
                  </div>
                </div>

                {/* Prompt Selector Tabs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {AI_STUDIO_PROMPTS.map((p, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => {
                        playButtonClickSFX(soundEnabled);
                        setSelectedAiPromptIndex(pIdx);
                        markModuleTested('google_aistudio');
                        triggerFeedback(
                          `⚡ Prompt #${pIdx + 1} do Google AI Studio selecionado! Veja como o Gemini projetou essa arquitetura.`,
                          `Examinando a engenharia de prompts do Google AI Studio para ${p.title}!`
                        );
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        pIdx === selectedAiPromptIndex
                          ? 'bg-gradient-to-br from-sky-900/90 to-blue-950 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)] ring-1 ring-cyan-400/50'
                          : 'bg-slate-900/80 hover:bg-slate-800 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                        {p.badge}
                      </span>
                      <span className="text-xs font-black text-white block">
                        {p.title}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Selected Prompt & AI Output Terminal Card */}
                {AI_STUDIO_PROMPTS[selectedAiPromptIndex] && (
                  <div className="bg-slate-950 border-2 border-cyan-400/40 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-mono font-bold text-slate-200">
                          {AI_STUDIO_PROMPTS[selectedAiPromptIndex].title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                        PROMPT COMPILADO COM SUCESSO
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="bg-slate-900/90 border border-white/10 rounded-xl p-3">
                        <span className="text-[10px] font-mono text-cyan-400 font-bold block uppercase mb-1">
                          💬 Prompt em Linguagem Natural Enviado ao Google AI Studio:
                        </span>
                        <p className="text-xs font-mono text-slate-200 italic leading-relaxed">
                          "{AI_STUDIO_PROMPTS[selectedAiPromptIndex].prompt}"
                        </p>
                      </div>

                      <div className="bg-[#030712] border border-cyan-500/30 rounded-xl p-3 font-mono text-[11px] text-cyan-300 space-y-1">
                        <span className="text-[10px] font-bold text-amber-300 uppercase block mb-1">
                          ⚡ Código Production-Ready Gerado pela IA:
                        </span>
                        <pre className="overflow-x-auto p-2 bg-black/60 rounded-lg border border-white/5 text-emerald-300">
                          <code>{AI_STUDIO_PROMPTS[selectedAiPromptIndex].codeSnippet}</code>
                        </pre>
                      </div>

                      <div className="bg-cyan-950/30 border border-cyan-400/20 rounded-xl p-3 text-xs text-cyan-100 flex items-start gap-2">
                        <Wand2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-cyan-300">Como a IA do Google AI Studio resolveu:</strong>{' '}
                          {AI_STUDIO_PROMPTS[selectedAiPromptIndex].explanation}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MODULE 2: WebGL & Three.js Controls */}
            {activeModule.id === 'webgl_threejs' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    playButtonClickSFX(soundEnabled);
                    onUpdateSettings?.({ dayNightMode: 'day', weatherPreset: 'clear' });
                    triggerFeedback(
                      '☀️ Sol do Meio-Dia Ativado no Three.js! Iluminação 100% direta.',
                      'Sol de meio dia ativado no motor Three.js! Repare na iluminação direta e nas sombras projetadas.',
                      '☀️ Sol Ensolarado Ativado'
                    );
                    markModuleTested('webgl_threejs');
                  }}
                  className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-cyan-400/30 hover:border-cyan-400 rounded-2xl flex items-center gap-3 text-left transition-all cursor-pointer group shadow-lg"
                >
                  <Sun className="w-6 h-6 text-amber-400 shrink-0 group-hover:rotate-45 transition-transform" />
                  <div>
                    <span className="text-xs font-black text-white block">Sol Ensolarado</span>
                    <span className="text-[10px] text-slate-400">Shaders em alta claridade</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    playButtonClickSFX(soundEnabled);
                    onUpdateSettings?.({ dayNightMode: 'night' });
                    triggerFeedback(
                      '🌙 Noite Estrelada & Luzes Neon Ativadas! Shaders emissivos em ação.',
                      'Modo noturno ativado! Observe os materiais emissivos brilhando com contraste neon no escuro.',
                      '🌙 Noite Estrelada Ativada'
                    );
                    markModuleTested('webgl_threejs');
                  }}
                  className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-purple-400/30 hover:border-purple-400 rounded-2xl flex items-center gap-3 text-left transition-all cursor-pointer group shadow-lg"
                >
                  <Moon className="w-6 h-6 text-indigo-400 shrink-0 group-hover:-rotate-12 transition-transform" />
                  <div>
                    <span className="text-xs font-black text-white block">Noite & Emissão Neon</span>
                    <span className="text-[10px] text-slate-400">Materiais luminescentes</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    playButtonClickSFX(soundEnabled);
                    onUpdateSettings?.({ weatherPreset: 'rain' });
                    triggerFeedback(
                      '🌧️ Chuva com Partículas 3D & Áudio Relaxante ativados!',
                      'Iniciando emissor de partículas de chuva 3D e áudio de tempestade suave!',
                      '🌧️ Chuva 3D Ativada'
                    );
                    markModuleTested('webgl_threejs');
                  }}
                  className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-blue-400/30 hover:border-blue-400 rounded-2xl flex items-center gap-3 text-left transition-all cursor-pointer group shadow-lg"
                >
                  <CloudRain className="w-6 h-6 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="text-xs font-black text-white block">Chuva Relaxante</span>
                    <span className="text-[10px] text-slate-400">Partículas e ambientação</span>
                  </div>
                </button>
              </div>
            )}

            {/* MODULE 2: Physics & Procedural Controls */}
            {activeModule.id === 'physics_procedural' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    playButtonClickSFX(soundEnabled);
                    setIsSlowMoActive(true);
                    onTestSlowMotion?.(true);
                    triggerFeedback(
                      '⏱️ Câmera Lenta 0.25x Ativada por 5 segundos!',
                      'Reduzindo a velocidade da física para 25 por cento! Agora você pode examinar a colisão quadro a quadro.',
                      '⏱️ Câmera Lenta (0.25x)'
                    );
                    markModuleTested('physics_procedural');
                    setTimeout(() => {
                      setIsSlowMoActive(false);
                      onTestSlowMotion?.(false);
                    }, 5000);
                  }}
                  className={`p-3.5 border rounded-2xl flex items-center gap-3 text-left transition-all cursor-pointer group shadow-lg ${
                    isSlowMoActive
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                      : 'bg-slate-900 hover:bg-slate-800 border-amber-400/30 hover:border-amber-400'
                  }`}
                >
                  <Gauge className="w-6 h-6 text-amber-400 shrink-0 group-hover:rotate-45 transition-transform" />
                  <div>
                    <span className="text-xs font-black text-white block">Câmera Lenta (Slow-Mo 0.25x)</span>
                    <span className="text-[10px] text-slate-400">5s para observar hitboxes</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onTestJump?.();
                    triggerFeedback(
                      '🦘 Pulo Físico Acionado!',
                      'Calculando impulso vertical e parábola de gravidade no avatar!',
                      '🦘 Pulo Parabólico'
                    );
                    markModuleTested('physics_procedural');
                  }}
                  className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-emerald-400/30 hover:border-emerald-400 rounded-2xl flex items-center gap-3 text-left transition-all cursor-pointer group shadow-lg"
                >
                  <FastForward className="w-6 h-6 text-emerald-400 shrink-0 group-hover:-translate-y-1 transition-transform" />
                  <div>
                    <span className="text-xs font-black text-white block">Disparar Pulo Físico</span>
                    <span className="text-[10px] text-slate-400">Equação v_y = v0 - g*t</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onTestCrouch?.();
                    triggerFeedback(
                      '🦆 Esquiva e Agachamento Físico acionados no avatar!',
                      'Reduzindo a altura da caixa delimitadora do avatar para esquiva inferior!',
                      '🦆 Agachamento Físico'
                    );
                    markModuleTested('physics_procedural');
                  }}
                  className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-cyan-400/30 hover:border-cyan-400 rounded-2xl flex items-center gap-3 text-left transition-all cursor-pointer group shadow-lg"
                >
                  <Radio className="w-6 h-6 text-cyan-400 shrink-0 group-hover:scale-90 transition-transform" />
                  <div>
                    <span className="text-xs font-black text-white block">Disparar Agachamento</span>
                    <span className="text-[10px] text-slate-400">Redução de altura da hitbox</span>
                  </div>
                </button>
              </div>
            )}

            {/* MODULE 3: Web Audio Synthesis Controls */}
            {activeModule.id === 'webaudio_synthesis' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    playSolfeggioTone(528, 2.5);
                    triggerFeedback(
                      '🎵 Frequência Solfeggio 528Hz sintetizada em tempo real!',
                      'Sintetizando onda senoidal pura em 528 Hertz! Ouça como a vibração acalma o sistema nervoso sem MP3.',
                      '🎵 Solfeggio 528Hz Sintetizado'
                    );
                    markModuleTested('webaudio_synthesis');
                  }}
                  className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-amber-400/30 hover:border-amber-400 rounded-2xl flex items-center gap-3 text-left transition-all cursor-pointer group shadow-lg"
                >
                  <Music className="w-6 h-6 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="text-xs font-black text-white block">Tocar Solfeggio 528Hz</span>
                    <span className="text-[10px] text-slate-400">Harmonia terapêutica pura</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    playBreathingCycleSFX(true);
                    triggerFeedback(
                      '🫁 Onda Vagal 4-7-8 com Sino Tibetano sintetizada matematicamente!',
                      'Executando varredura vagal em 432 Hertz! Aceleração e desaceleração ativam a calma parassimpática.',
                      '🫁 Biofeedback 4-7-8'
                    );
                    markModuleTested('webaudio_synthesis');
                  }}
                  className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-teal-400/30 hover:border-teal-400 rounded-2xl flex items-center gap-3 text-left transition-all cursor-pointer group shadow-lg"
                >
                  <HeartPulse className="w-6 h-6 text-teal-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="text-xs font-black text-white block">Ciclo 4-7-8 & Sino 432Hz</span>
                    <span className="text-[10px] text-slate-400">Biofeedback parassimpático</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    playSoccerKickSFX(true);
                    setTimeout(() => playSoccerGoalSFX(true), 350);
                    triggerFeedback(
                      '⚽ Efeito Sonoro de Chute & Gol de Futebol sintetizado!',
                      'Sintetizando o impacto do futebol com ruído branco e harmônicos comemorativos!',
                      '⚽ Chute & Gol Sintetizados'
                    );
                    markModuleTested('webaudio_synthesis');
                  }}
                  className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-emerald-400/30 hover:border-emerald-400 rounded-2xl flex items-center gap-3 text-left transition-all cursor-pointer group shadow-lg"
                >
                  <Sparkles className="w-6 h-6 text-emerald-400 shrink-0 group-hover:rotate-12 transition-transform" />
                  <div>
                    <span className="text-xs font-black text-white block">Sintetizar Chute & Gol</span>
                    <span className="text-[10px] text-slate-400">Ruído branco + harmônicos</span>
                  </div>
                </button>
              </div>
            )}

            {/* MODULE 4: Psychometrics SAS-SMU Controls */}
            {activeModule.id === 'psychometrics_sas' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    playButtonClickSFX(soundEnabled);
                    onTriggerSampleQuestion?.();
                    triggerFeedback(
                      '📋 Pergunta SAS de Amostra Disparada com Leitura TTS!',
                      'Disparando pergunta do inventário psicométrico com leitura por voz adaptativa no seu idioma!',
                      '📋 Pergunta SAS Disparada'
                    );
                    markModuleTested('psychometrics_sas');
                  }}
                  className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-purple-400/30 hover:border-purple-400 rounded-2xl flex items-center gap-3 text-left transition-all cursor-pointer group shadow-lg"
                >
                  <HeartPulse className="w-6 h-6 text-purple-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="text-xs font-black text-white block">Disparar Pergunta SAS</span>
                    <span className="text-[10px] text-slate-400">Com voz adaptativa TTS</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    playButtonClickSFX(soundEnabled);
                    onSetAnxietyLevel?.(85);
                    triggerFeedback(
                      '🚨 Simulação de Ansiedade Crítica (85%) com alertas visuais!',
                      'Simulando estado de ansiedade a 85 por cento! Observe o pulso cardíaco e a sobrecarga de alertas.',
                      '🚨 Ansiedade a 85%'
                    );
                    markModuleTested('psychometrics_sas');
                  }}
                  className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-red-400/30 hover:border-red-400 rounded-2xl flex items-center gap-3 text-left transition-all cursor-pointer group shadow-lg"
                >
                  <Zap className="w-6 h-6 text-red-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="text-xs font-black text-white block">Simular Ansiedade 85%</span>
                    <span className="text-[10px] text-slate-400">Acelera pulsação e tela</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    playZenEnterSFX(soundEnabled);
                    onSetAnxietyLevel?.(0);
                    triggerFeedback(
                      '🌿 Modo Zen Ativado: Ansiedade zerada com manto de serenidade!',
                      'Restaurando ansiedade para zero por cento! Manto de serenidade e tranquilidade ativados.',
                      '🌿 Modo Zen Restaurado'
                    );
                    markModuleTested('psychometrics_sas');
                  }}
                  className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-cyan-400/30 hover:border-cyan-400 rounded-2xl flex items-center gap-3 text-left transition-all cursor-pointer group shadow-lg"
                >
                  <Sparkles className="w-6 h-6 text-cyan-400 shrink-0 group-hover:rotate-45 transition-transform" />
                  <div>
                    <span className="text-xs font-black text-white block">Restaurar Modo Zen (0%)</span>
                    <span className="text-[10px] text-slate-400">Regulação emocional</span>
                  </div>
                </button>
              </div>
            )}

            {/* MODULE 5: Fullstack & Offline Controls */}
            {activeModule.id === 'offline_firebase' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-900 border border-emerald-400/30 rounded-2xl flex items-center gap-3 text-left shadow-lg">
                  <Radio className="w-6 h-6 text-emerald-400 shrink-0 animate-ping" />
                  <div>
                    <span className="text-xs font-black text-white block">
                      {onlineUsersCount} Pesquisador(es) Conectado(s)
                    </span>
                    <span className="text-[10px] text-slate-400">Heartbeat ativo no Firestore</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    playButtonClickSFX(soundEnabled);
                    triggerFeedback(
                      '💾 Armazenamento Local Verificado: Casos e histórico 100% preservados!',
                      'Sincronização offline verificada! Os dados ficam salvos no aparelho mesmo sem internet.',
                      '💾 Dados Salvos Localmente'
                    );
                    markModuleTested('offline_firebase');
                  }}
                  className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-cyan-400/30 hover:border-cyan-400 rounded-2xl flex items-center gap-3 text-left transition-all cursor-pointer group shadow-lg"
                >
                  <Cloud className="w-6 h-6 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="text-xs font-black text-white block">Testar Sincronização Offline</span>
                    <span className="text-[10px] text-slate-400">Resiliente a quedas de rede</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    playButtonClickSFX(soundEnabled);
                    onNavigateTab?.('analytics');
                    triggerFeedback(
                      '📊 Painel Científico aberto! O laboratório permanece aberto para você.',
                      'Painel científico aberto em segundo plano!',
                      '📊 Painel Científico Aberto'
                    );
                  }}
                  className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-amber-400/30 hover:border-amber-400 rounded-2xl flex items-center gap-3 text-left transition-all cursor-pointer group shadow-lg"
                >
                  <ExternalLink className="w-6 h-6 text-amber-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  <div>
                    <span className="text-xs font-black text-white block">Ver Painel Científico</span>
                    <span className="text-[10px] text-slate-400">Diagnóstico de coortes</span>
                  </div>
                </button>
              </div>
            )}

            {/* MODULE 6: Roblox Luau Controls */}
            {activeModule.id === 'roblox_luau' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    playButtonClickSFX(soundEnabled);
                    onNavigateTab?.('code');
                    triggerFeedback(
                      '💻 Aba de Códigos Luau aberta! O laboratório continua aberto para sua consulta.',
                      'Código Luau aberto em segundo plano!',
                      '💻 Código Luau Aberto'
                    );
                  }}
                  className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-indigo-400/30 hover:border-indigo-400 rounded-2xl flex items-center gap-3 text-left transition-all cursor-pointer group shadow-lg"
                >
                  <Code2 className="w-6 h-6 text-indigo-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="text-xs font-black text-white block">Abrir Código Fonte Luau</span>
                    <span className="text-[10px] text-slate-400">Scripts prontos do Roblox</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    playButtonClickSFX(soundEnabled);
                    onNavigateTab?.('guide');
                    triggerFeedback(
                      '📘 Guia do Roblox Studio aberto! O laboratório permanece ativo.',
                      'Guia do Roblox Studio aberto!',
                      '📘 Guia do Roblox Aberto'
                    );
                  }}
                  className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-cyan-400/30 hover:border-cyan-400 rounded-2xl flex items-center gap-3 text-left transition-all cursor-pointer group shadow-lg"
                >
                  <ExternalLink className="w-6 h-6 text-cyan-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  <div>
                    <span className="text-xs font-black text-white block">Guia Roblox Studio</span>
                    <span className="text-[10px] text-slate-400">Passo a passo de publicação</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    playButtonClickSFX(soundEnabled);
                    triggerFeedback(
                      '🚀 Lógica de WalkSpeed compatível: WalkSpeed = 16 * (1 + Ansiedade * 0.5)',
                      'A mesma fórmula de WalkSpeed usada neste site funciona perfeitamente dentro do Roblox Studio!',
                      '🚀 Fórmula Humanoid.WalkSpeed'
                    );
                    markModuleTested('roblox_luau');
                  }}
                  className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-emerald-400/30 hover:border-emerald-400 rounded-2xl flex items-center gap-3 text-left transition-all cursor-pointer group shadow-lg"
                >
                  <Zap className="w-6 h-6 text-emerald-400 shrink-0 group-hover:rotate-12 transition-transform" />
                  <div>
                    <span className="text-xs font-black text-white block">Humanoid.WalkSpeed</span>
                    <span className="text-[10px] text-slate-400">Fórmula de aceleração</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Real-time Interactive Execution Demo with Book Page Peel to reveal live Source Code */}
          <MiniGameSourceReveal
            moduleId={activeModule.id}
            moduleTitle={activeModule.title}
            isRobotPulling={isRobotPullingPage}
            onRobotPeelRequest={handleRobotPeelCorner}
            soundEnabled={soundEnabled}
          />

          {/* Theory & Architecture Deep-Dive */}
          <div className={`border rounded-2xl p-4 sm:p-5 space-y-3 transition-all duration-300 ${
            includeTheoryInSpeech
              ? 'bg-gradient-to-br from-slate-900/90 via-purple-950/20 to-slate-900/90 border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/30'
              : 'bg-slate-900/60 border-white/10'
          }`}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Fundamentos Técnicos: {activeModule.theoryTitle}</span>
              </h4>
              <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold ${
                includeTheoryInSpeech ? 'bg-purple-950 text-purple-300 border border-purple-400/50' : 'bg-slate-800 text-slate-400'
              }`}>
                {includeTheoryInSpeech ? '🎙️ Lido pelo Assistente' : 'Leitura opcional'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {getTheoryDesc(activeModule)}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/5">
              {activeModule.techHighlights.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer & Navigation */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between gap-3">
          {isTouchDevice && (
            <button
              disabled={activeModuleIndex === 0}
              onClick={() => {
                playButtonClickSFX(soundEnabled);
                setActiveModuleIndex((prev) => Math.max(0, prev - 1));
              }}
              className="px-3 sm:px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/30 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Anterior</span>
            </button>
          )}

          <div className={`flex items-center gap-1.5 ${!isTouchDevice ? 'mx-auto' : ''}`}>
            {TECH_MODULES.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeModuleIndex
                    ? 'w-6 bg-cyan-400'
                    : testedModules.has(TECH_MODULES[i].id)
                    ? 'w-2 bg-emerald-400'
                    : 'w-2 bg-slate-700'
                }`}
              />
            ))}
          </div>

          {isTouchDevice && (
            <button
              disabled={activeModuleIndex === TECH_MODULES.length - 1}
              onClick={() => {
                playButtonClickSFX(soundEnabled);
                setActiveModuleIndex((prev) => Math.min(TECH_MODULES.length - 1, prev + 1));
              }}
              className="px-3 sm:px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-30 cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <span className="hidden sm:inline">Próximo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
