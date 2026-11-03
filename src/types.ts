export type GameState = 'MENU' | 'LOADING' | 'PLAYING' | 'PAUSED_SAS' | 'PAUSED' | 'MODO_ZEN' | 'VITORIA' | 'DERROTA';

export type AppLanguage = 'pt' | 'es' | 'en' | 'de';

export type CharacterId = 'guto' | 'leo' | 'caio';

export interface CharacterInfo {
  id: CharacterId;
  name: string;
  clothingTitle: string;
  clothingDescription: string;
  bio: string;
  avatarColor: string;
  badge: string;
  motto: string;
  perks: string[];
}

export const CHARACTER_PROFILES: Record<CharacterId, CharacterInfo> = {
  guto: {
    id: 'guto',
    name: 'Guto',
    clothingTitle: 'Moletom Azul',
    clothingDescription: 'Casaco moletom azul marinho com estampa frontal "PESQUISADORES", cabelo castanho claro e olhar entusiasmado.',
    bio: 'Super comunicativo, ágil e curioso. Lidera as investigações sobre o tempo de uso de telas, redes sociais e gatilhos de FOMO.',
    avatarColor: '#1d4ed8', // Royal/Navy Blue
    badge: 'O Impulsivo Conectado',
    motto: '"Pesquisamos para entender, aprender e transformar!"',
    perks: ['Arrancada Ágil', 'Reação Rápida em Perguntas', 'Atitude Entusiasta'],
  },
  leo: {
    id: 'leo',
    name: 'Léo',
    clothingTitle: 'Camiseta Branca, Tipóia & Luke (Pinscher)',
    clothingDescription: 'Camiseta branca com brasão dos Pesquisadores, tipóia com gesso decorado e acompanhado sempre do seu fiel Pinscher caramelo Luke.',
    bio: 'Demonstra resiliência incomparável. Acompanhado do seu fiel cãozinho Luke (Pinscher Caramelo), espalha mensagens de autocuidado e apoio mútuo.',
    avatarColor: '#e11d48', // Warm Rose/Red accent
    badge: 'O Resiliente Empático',
    motto: '"O diálogo nos fortalece. O autocuidado nos equilibra."',
    perks: ['Companheiro Luke 🐕 (IA Coletor Autônomo)', '+15% Resistência à Ansiedade', 'Super Resiliência'],
  },
  caio: {
    id: 'caio',
    name: 'Caio',
    clothingTitle: 'Camiseta Verde, Jaqueta Azul & Pipoca (Beagle)',
    clothingDescription: 'Camiseta verde vibrante sob jaqueta azul escuro aberta, cabelo cacheado com mechas douradas, caneca de café e acompanhado pelo seu leal Beagle Pipoca.',
    bio: 'Observador crítico e estiloso. Acompanhado do seu alegre cãozinho Beagle Pipoca, analisa os impactos psicológicos das mídias digitais com foco em soluções práticas e equilíbrio.',
    avatarColor: '#16a34a', // Emerald Green
    badge: 'O Analista Crítico',
    motto: '"Pesquisar é buscar respostas, mas também cuidar de si e do outro."',
    perks: ['Companheiro Pipoca 🐕 (Beagle IA Autônomo)', 'Visão Crítica de FOMO', 'Maior Bônus em Respostas NÃO'],
  },
};

export type DemoProfile = 'Equilibrado' | 'Impulsivo/FOMO' | 'Calmo/Zen' | 'Explorador' | 'Anti-Ansiedade';

export interface SASQuestion {
  id?: number;
  timeTrigger: number; // e.g. 50, 40, 30, 20, 10
  question: string;
  category?: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAIXO';
  zenOnNao?: boolean;
  simEffect: {
    anxiety: number; // e.g. +10
    speed: number;   // e.g. +0.3
  };
  naoEffect: {
    anxiety: number; // e.g. -5
    speed: number;   // e.g. -0.2
  };
}

export interface FallingItem {
  id: string;
  type: 'Feed' | 'Like' | 'Wifi' | 'Smartphone' | 'Geometric' | 'Coffee' | 'Book' | 'Exercício Físico' | 'Atividade ao Ar Livre' | 'Desconexão' | 'Bola de Futebol' | 'Encontro Presencial' | 'CardNotificacao' | 'CardNotifPendente' | 'CardFeed' | 'Hamburguer' | 'Violão' | 'Cachorro' | 'WhatsApp' | 'YouTube' | 'Facebook' | 'TikTok' | 'MoedaOuro' | 'Buraco' | 'PequenaPared' | 'Cone' | 'Cavalete' | 'Cilindro' | 'Remedio';
  position: [number, number, number]; // [x, y, z]
  speed: number;
  rotation: [number, number, number];
  color: string;
  isGroundItem?: boolean;
  lifetime?: number; // seconds remaining on path before despawning
  maxLifetime?: number;
  collected?: boolean;
}

export interface LuauScript {
  id: string;
  name: string;
  path: string; // e.g. 'ServerScriptService/GameManager.server.luau'
  service: 'ReplicatedStorage' | 'ServerScriptService' | 'StarterPlayerScripts' | 'StarterGui';
  type: 'Script' | 'LocalScript' | 'ModuleScript' | 'Setup';
  description: string;
  code: string;
}

export interface StressDiagnostic {
  level: 'Baixo' | 'Moderado' | 'Alto' | 'Colapso Digital';
  percentage: number;
  description: string;
  recommendations: string[];
}

export interface DataCollectionAudience {
  id: string;
  name: string;
  ageRange: string; // e.g. '12 - 14 anos', '15 - 17 anos', '9 - 11 anos', '18 - 24 anos', '25 - 59 anos', '60+ anos'
  categoryLabel: string; // e.g. 'Adolescentes (Anos Finais)', 'Jovens (Ensino Médio)', etc.
  schoolGradeDefault: string;
  dailyScreenHoursDefault: string;
  focusPlatforms: string[];
  description: string;
  ethicalProtocol: string;
  isCustom?: boolean;
  targetSampleSize?: number;
  color?: string;
}

export interface PlayerProfile {
  name: string;
  anonymousCode?: string;
  age?: string;
  dailyScreenHours?: string;
  schoolGrade?: string;
  notes?: string;
  audienceId?: string;
  audienceName?: string;
}

export interface CollectedCase {
  id: string; // e.g. 'CASO-001'
  playerName: string; // Anonymous Participant identifier or codename
  anonymousCode?: string;
  age?: string;
  dailyScreenHours?: string;
  schoolGrade?: string;
  notes?: string;
  audienceId?: string;
  audienceName?: string;
  timestamp: number;
  dateFormatted?: string;
  date?: string;
  sessionDuration?: number; // in seconds
  sessionTime?: number;
  gameStateOutcome?: 'VITORIA' | 'DERROTA' | 'CONCLUIDO';
  totalQuestionsAnswered: number;
  yesAnswers: number;
  noAnswers: number;
  affirmativePercentage?: number;
  finalAnxietyScore: number;
  finalWalkSpeed: number;
  fomoCategory: 'Resiliente Digital' | 'Uso Moderado' | 'Hiperconectado';
  survivalRate: number;
  wellnessScore?: number;
  goldCoins?: number;
  criticalResponseTime: number;
  lowResponseTime?: number;
  answersList?: Array<{ question: string; answer: 'SIM' | 'NÃO'; category?: string; timeTrigger: number }>;
  source: 'GAMEPLAY_REAL' | 'PESQUISA_CLINICA' | 'MANUAL_OBSERVER';
  diagnosticTitle?: string;
  diagnosticDescription?: string;
  clinicalSummary?: string;
  recommendations?: string[];
}

export interface GamepadActionMap {
  jumpButtons: number[];
  crouchButtons: number[];
  leftButtons: number[];
  rightButtons: number[];
  pauseButtons: number[];
  simButtons?: number[];
  naoButtons?: number[];
}

export interface GamepadCustomAxes {
  horizontalAxis: number;
  verticalAxis: number;
}

export interface GamepadConfig {
  enabled: boolean;
  mode: 'analog' | 'dpad' | 'buttons';
  deadzone: number;
  invert: boolean;
  actionMap?: GamepadActionMap;
  customAxes?: GamepadCustomAxes;
  blockAnalogInQuestions?: boolean;
}

export interface GameSettings {
  // Parâmetros de Gameplay & Acessibilidade
  questionInterval: number; // Intervalo em segundos entre perguntas (ex: 5, 10, 15, 20, 30, 60), padrão: 15
  autoPauseOnQuestions: boolean; // Pausar jogo durante a pergunta (padrão: true)
  enableQuestionTTS: boolean; // Leitura de áudio por voz das perguntas (padrão: true)
  baseGameSpeed: number; // Velocidade base do jogo (padrão: 1.0)
  gameDifficulty: 'facil' | 'normal' | 'dificil' | 'extremo'; // Dificuldade geral (padrão: 'normal')
  harmfulPercent: number; // Volume de elementos nocivos em % (padrão: 50%)
  beneficialPercent: number; // Volume de elementos benéficos em % (padrão: 50%)
  itemSpawnDensity: 'baixa' | 'normal' | 'alta' | 'caos'; // Densidade de itens na pista (padrão: 'normal')
  invincibleTrainingMode: boolean; // Modo treino / invulnerabilidade sem colapso por ansiedade (padrão: false)
  enableGoldCoins: boolean; // Habilitar moedas de ouro de incentivo ao longo do caminho (+1 Ponto) (padrão: true)

  // Parâmetros de Renderização e Gráficos
  graphicsPreset?: 'desempenho' | 'equilibrado' | 'ultra'; // Predefinição geral de desempenho gráfico
  enableShadows: boolean; // Sombra ativada ou desativada (padrão: true)
  enableTextures: boolean; // Texturas detalhadas ativadas ou modo cores planas (padrão: true)
  enableInternetClouds?: boolean; // Habilitar nuvens de internet realistas no céu de onde caem os itens nocivos (padrão: true)
  renderDepth: 'curta' | 'media' | 'longa'; // Profundidade de renderização / distância de visão (padrão: 'media')
  mode3D: boolean; // Modo 3D Perspectiva ou Modo 2D Lateral Plano (padrão: true)
  resolutionScale: number; // Escala de renderização / resolução (0.5 = 50%, 0.75 = 75%, 1.0 = 100%, 1.25 = 125%)
  fpsLimit: number; // Ajuste de frames / limite de FPS (30, 60, 120, 0 = Ilimitado)
  cameraFOV: number; // Campo de Visão da câmera 3D em graus (50 a 90, padrão: 65)

  // Interface & Áudio Complementar
  language?: AppLanguage; // Idioma do jogo e sintetizador TTS ('pt', 'es', 'en', 'de')
  sfxVolume: number; // Volume dos efeitos sonoros de 0 a 100% (padrão: 100)
  showFPSCounter: boolean; // Exibir contador de FPS e estatísticas na HUD (padrão: false)
  touchButtonsSize: 'pequeno' | 'medio' | 'grande'; // Tamanho dos botões virtuais touch (padrão: 'medio')

  // Configuração Individual de Efeitos Sonoros (SFX)
  sfxObstacleHit?: boolean; // Som de colisão com obstáculo
  sfxHarmfulHit?: boolean; // Som de impacto de itens nocivos
  sfxCoinCollect?: boolean; // Som de coleta de moedas de ouro
  sfxWellnessCollect?: boolean; // Som de coleta de bem-estar / bônus
  sfxSoccer?: boolean; // Som da partida de futebol (chute e gol)
  sfxFishing?: boolean; // Som de pescaria (splash e catch)
  sfxPigeon?: boolean; // Som de alimentar pássaros
  sfxHorse?: boolean; // Som de acariciar cavalo
  sfxDog?: boolean; // Som de latido do cachorro

  // Personalização da Voz do Sintetizador TTS
  ttsVoiceURI?: string; // URI ou Nome da Voz TTS Selecionada
  ttsPitch?: number; // Tom/Agudeza da Voz (0.5 a 1.5, padrão: 1.0)
  ttsRate?: number; // Velocidade de Leitura da Voz (0.5 a 1.5, padrão: 1.0)


  hideAnxietySpeedCard?: boolean; // Ocultar Barra de Ansiedade e Velocidade
  hideTrophiesScoreCard?: boolean; // Ocultar Card de Pontuação e Troféus de Bem-estar
  hideQuestionTTSCard?: boolean; // Ocultar Card do Leitor e Alertas de Pergunta
  hideControlsCard?: boolean; // Ocultar Botões Virtuais / Joysticks Touch
  hideShopButton?: boolean; // Ocultar Botão da Loja de Habilidades
  disableAnxietyLighting?: boolean; // Desabilitar Ciclo de Iluminação Baseado na Ansiedade
  hideVotingCard?: boolean; // Ocultar votação na tela inicial
  dayNightMode?: 'auto' | 'day' | 'night'; // Modo Dia/Noite (Automático, Dia, Noite)
  weatherPreset?: 'auto' | 'clear' | 'sunset' | 'night' | 'rain' | 'fog'; // Preset de Clima e Atmosfera
  weatherAmbientSound?: boolean; // Habilitar Som Ambiental Dinâmico de Clima (Chuva, Passarinhos, Vento)
  hideHorizonScenery?: boolean; // Ocultar cenário de horizonte
  showVoiceAssistant?: boolean; // Exibir assistente flutuante de tutorial por voz (padrão: true)
  enableWelcome30sTutorial?: boolean; // Tutorial narrado de boas-vindas nos primeiros 30s destacando bem-estar vs invasivos (padrão: true)
  activeAudienceId?: string; // ID do público-alvo de coleta de dados ativo (padrão: 'audiencia_adolescentes_12_14')
}

export interface PlayerSkills {
  doubleJump: boolean;
  shield: boolean;
  magnet: boolean;
  resilience: number;
  betterShoes: boolean;
  hoodie: boolean;
  hoodieColor?: string;
  cap: boolean;
  capColor?: string;
  bicycle: boolean;
  skate: boolean;
  patinete: boolean;
  soccerKit: boolean;
  calmingTea: boolean;
  breathingBand: boolean;
  activeVehicle?: 'none' | 'bicycle' | 'skate' | 'patinete';
  activeShoes?: 'basic' | 'runner_lite' | 'super_sprint' | 'absolute_comfort';
  ownedShoes?: ('basic' | 'runner_lite' | 'super_sprint' | 'absolute_comfort')[];
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  questionInterval: 10,
  autoPauseOnQuestions: true,
  enableQuestionTTS: true,
  baseGameSpeed: 1.0,
  gameDifficulty: 'facil',
  harmfulPercent: 30,
  beneficialPercent: 70,
  itemSpawnDensity: 'normal',
  invincibleTrainingMode: false,
  enableGoldCoins: true,

  graphicsPreset: 'equilibrado',
  enableShadows: true,
  enableTextures: true,
  enableInternetClouds: true,
  renderDepth: 'media',
  mode3D: true,
  resolutionScale: 1.0,
  fpsLimit: 60,
  cameraFOV: 65,

  language: 'pt',
  sfxVolume: 100,
  showFPSCounter: false,
  touchButtonsSize: 'medio',
  sfxObstacleHit: true,
  sfxHarmfulHit: true,
  sfxCoinCollect: true,
  sfxWellnessCollect: true,
  sfxSoccer: true,
  sfxFishing: true,
  sfxPigeon: true,
  sfxHorse: true,
  sfxDog: true,

  ttsVoiceURI: '',
  ttsPitch: 1.0,
  ttsRate: 1.0,

  hideAnxietySpeedCard: false,
  hideTrophiesScoreCard: false,
  hideQuestionTTSCard: false,
  hideControlsCard: false,
  hideShopButton: false,
  disableAnxietyLighting: false,
  hideVotingCard: false,
  dayNightMode: 'auto',
  weatherPreset: 'auto',
  weatherAmbientSound: true,
  hideHorizonScenery: true,
  showVoiceAssistant: false,
  enableWelcome30sTutorial: false,
  activeAudienceId: 'audiencia_adolescentes_12_14',
};
