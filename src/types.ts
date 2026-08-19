export type GameState = 'MENU' | 'PLAYING' | 'PAUSED_SAS' | 'PAUSED' | 'MODO_ZEN' | 'VITORIA' | 'DERROTA';

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
  type: 'Feed' | 'Like' | 'Wifi' | 'Smartphone' | 'Geometric' | 'Coffee' | 'Book' | 'Exercício Físico' | 'Atividade ao Ar Livre' | 'Desconexão' | 'Bola de Futebol' | 'Encontro Presencial' | 'CardNotificacao' | 'CardNotifPendente' | 'CardFeed' | 'Hamburguer' | 'Violão' | 'Cachorro' | 'WhatsApp' | 'YouTube' | 'Facebook';
  position: [number, number, number]; // [x, y, z]
  speed: number;
  rotation: [number, number, number];
  color: string;
  isGroundItem?: boolean;
  lifetime?: number; // seconds remaining on path before despawning
  maxLifetime?: number;
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

export interface GamepadConfig {
  enabled: boolean;
  mode: 'analog' | 'dpad' | 'buttons';
  deadzone: number;
  invert: boolean;
}
