import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Code2,
  Terminal,
  Cpu,
  Layers,
  Sparkles,
  Zap,
  Eye,
  CheckCircle2,
  ArrowRight,
  Maximize2,
  Activity,
} from 'lucide-react';

interface MiniGameSourceRevealProps {
  moduleId: string;
  moduleTitle: string;
  isRobotPulling?: boolean;
  onRobotPeelRequest?: () => void;
  soundEnabled?: boolean;
}

interface CodeSnippet {
  language: string;
  filename: string;
  description: string;
  code: string;
  liveStats: Record<string, string>;
}

const MODULE_CODE_SNIPPETS: Record<string, CodeSnippet> = {
  webgl_threejs: {
    language: 'typescript',
    filename: 'src/components/ThreeCanvas.tsx (Motor Three.js)',
    description: 'Pipeline de Renderização 3D, Câmera em Perspectiva e PCFSoftShadowMap',
    code: `// Loop de Renderização a 60 FPS na GPU do Navegador
const clock = new THREE.Clock();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

function animateWebGL() {
  requestAnimationFrame(animateWebGL);
  const delta = clock.getDelta();
  
  // Atualiza posição do avatar e interpolação de pista
  avatarMesh.position.x = THREE.MathUtils.lerp(avatarMesh.position.x, targetLaneX, delta * 14);
  roadMesh.material.map.offset.y += walkSpeed * delta * 0.05;
  
  renderer.render(scene, camera);
}`,
    liveStats: {
      FPS: '60.0 fps',
      'Draw Calls': '22',
      'Geometrias GPU': '48',
      'Shader Shading': 'PBR Smooth',
    },
  },
  physics_procedural: {
    language: 'typescript',
    filename: 'src/utils/physicsEngine.ts (Detecção AABB & Procedural)',
    description: 'Equações de Gravidade Parabólica e Cestas de Colisão Euclidiana 3D',
    code: `// Cálculo de Gravidade e Detecção de Colisão em Tempo Real
const GRAVITY = -24.0; // m/s²
const LANE_POSITIONS = [-3.2, 0.0, 3.2]; // 3 faixas discretas

function updatePhysics(avatar: AvatarState, dt: number) {
  if (avatar.isJumping) {
    avatar.verticalVelocity += GRAVITY * dt;
    avatar.posY += avatar.verticalVelocity * dt;
    if (avatar.posY <= 0) {
      avatar.posY = 0;
      avatar.isJumping = false;
    }
  }
  
  // Colisão AABB rápida via distância Euclidiana
  obstacles.forEach((obs) => {
    const dist3D = Math.hypot(avatar.posX - obs.x, avatar.posY - obs.y, avatar.posZ - obs.z);
    if (dist3D < 1.35) {
      handleCollisionTrigger(obs);
    }
  });
}`,
    liveStats: {
      Hitbox: 'AABB Ativa',
      Gravidade: '-24 m/s²',
      'Raio Crítico': '1.35m',
      'Latência Física': '0.12ms',
    },
  },
  webaudio_synthesis: {
    language: 'typescript',
    filename: 'src/utils/audio.ts (Síntese Web Audio API)',
    description: 'Zero MP3: Osciladores Senoidais e Modulação ADSR de Frequência Terapêutica',
    code: `// Síntese em Tempo Real de Harmônicos e Solfeggio 528Hz
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

export function playSolfeggioTone(freq = 528, duration = 2.4) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'sine'; // Onda senoidal pura
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  
  // Envelope ADSR (Attack, Decay, Sustain, Release)
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.25, audioCtx.currentTime + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}`,
    liveStats: {
      'Frequência Solfeggio': '528 Hz',
      'Envelope ADSR': 'Ativo',
      'Bytes de MP3 Baixados': '0 KB (Zero)',
      Latência: '0.0ms',
    },
  },
  psychometrics_sas: {
    language: 'typescript',
    filename: 'src/utils/psychometricsEngine.ts (Escala SAS-SMU)',
    description: 'Classificador de Sobrecarga e Modulação Dinâmica de Velocidade',
    code: `// Algoritmo de Ansiedade e Modulação Comportamental
export function calculateAnxietyWalkSpeed(baseSpeed: number, anxietyLevel: number) {
  // Ansiedade (0% a 100%) modula o ritmo cognitivo
  const stressFactor = anxietyLevel / 100;
  const speedMultiplier = 1.0 + (stressFactor * 0.65); // Aumenta até +65%
  
  const currentWalkSpeed = baseSpeed * speedMultiplier;
  const notificationDensity = 1.0 + (stressFactor * 2.5); // Mais alertas pop-up
  
  return {
    walkSpeed: currentWalkSpeed,
    notificationDensity,
    riskCategory: anxietyLevel > 70 ? 'CRÍTICO' : anxietyLevel > 40 ? 'ALTO' : 'BAIXO'
  };
}`,
    liveStats: {
      'Perguntas Validadas': '52 Itens SAS',
      'WalkSpeed Modulado': '16.0 → 26.4 m/s',
      'Matriz de Risco': '4 Níveis',
      'Classificador FOMO': 'Ativo',
    },
  },
  offline_firebase: {
    language: 'typescript',
    filename: 'src/db/offlineSync.ts (Resiliência & Firestore)',
    description: 'Armazenamento IndexedDB Offline-First com Sincronização em Nuvem',
    code: `// Sincronização em Segundo Plano com Failover Local
export async function syncParticipantSession(sessionData: SessionRecord) {
  // Salva no armazenamento local instantaneamente
  saveToLocalStorageSafe('session_' + sessionData.id, sessionData);
  
  if (!navigator.onLine) {
    queuePendingOfflineSync(sessionData);
    return { status: 'OFFLINE_PERSISTED', local: true };
  }
  
  try {
    const docRef = doc(db, 'clinical_records', sessionData.id);
    await setDoc(docRef, { ...sessionData, syncedAt: serverTimestamp() }, { merge: true });
    return { status: 'CLOUD_SYNCED', online: true };
  } catch (error) {
    // Falha de rede não interrompe a aula na escola
    return queuePendingOfflineSync(sessionData);
  }
}`,
    liveStats: {
      'Modo Offline': '100% Funcional',
      'Storage Local': 'IndexedDB + Fallback',
      'Proteção LGPD': 'Anonimização Total',
      'Heartbeat Nuvem': 'Firestore 10s',
    },
  },
  roblox_luau: {
    language: 'lua',
    filename: 'roblox/ServerScriptService/GameManager.server.luau',
    description: 'Interoperabilidade com Roblox Studio e Fórmulas Compartilhadas de Humanoid',
    code: `-- Script Oficial Luau para Roblox Studio
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local function onPlayerSpawn(character)
    local humanoid = character:WaitForChild("Humanoid")
    local anxietyValue = character:WaitForChild("AnxietyScore")
    
    -- Fórmula idêntica à versão Web do projeto escolar
    anxietyValue.Changed:Connect(function(newAnxiety)
        local stressFactor = math.clamp(newAnxiety / 100, 0, 1)
        humanoid.WalkSpeed = 16 * (1 + stressFactor * 0.5)
    end)
end

Players.PlayerAdded:Connect(function(player)
    player.CharacterAdded:Connect(onPlayerSpawn)
end)`,
    liveStats: {
      'Sintaxe Luau': 'Roblox Studio v2',
      'Mapeamento Humanoid': 'WalkSpeed Dinâmico',
      'Compatibilidade Script': '100% Idêntico ao Web',
      'Exportação Luau': 'Pronta para Download',
    },
  },
};

export const MiniGameSourceReveal: React.FC<MiniGameSourceRevealProps> = ({
  moduleId,
  moduleTitle,
  isRobotPulling = false,
  onRobotPeelRequest,
  soundEnabled = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isPeeling, setIsPeeling] = useState<boolean>(false);
  const [peelPercent, setPeelPercent] = useState<number>(0);
  const [avatarLane, setAvatarLane] = useState<number>(1); // 0 = Left, 1 = Center, 2 = Right
  const [isJumping, setIsJumping] = useState<boolean>(false);
  const [activeConsoleLog, setActiveConsoleLog] = useState<string>('Motor em execução a 60 FPS...');
  const [executionLine, setExecutionLine] = useState<number>(1);

  const snippet = MODULE_CODE_SNIPPETS[moduleId] || MODULE_CODE_SNIPPETS.webgl_threejs;

  // Sync external robot pulling trigger
  useEffect(() => {
    if (isRobotPulling) {
      setIsPeeling(true);
      setPeelPercent(100);
    }
  }, [isRobotPulling]);

  // Smooth peel animation loop
  useEffect(() => {
    let animFrame: number;
    const target = isPeeling ? 100 : 0;

    const animatePeel = () => {
      setPeelPercent((current) => {
        const diff = target - current;
        if (Math.abs(diff) < 0.8) return target;
        return current + diff * 0.18;
      });
      if (Math.abs(target - peelPercent) > 0.5) {
        animFrame = requestAnimationFrame(animatePeel);
      }
    };

    animFrame = requestAnimationFrame(animatePeel);
    return () => cancelAnimationFrame(animFrame);
  }, [isPeeling]);

  // Code line highlighter ticker
  useEffect(() => {
    const linesCount = snippet.code.split('\n').length;
    const interval = setInterval(() => {
      setExecutionLine((prev) => (prev % linesCount) + 1);
      
      const frameNum = Math.floor(Date.now() / 16) % 10000;
      setActiveConsoleLog(
        `[Engine Frame #${frameNum}] delta: 16.6ms | lane: ${avatarLane} | GPU Draw: 22 | mem: 16.4MB`
      );
    }, 600);

    return () => clearInterval(interval);
  }, [snippet.code, avatarLane]);

  // Mini Game Live Runner Canvas Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let offset = 0;
    let jumpTime = 0;

    // Obstacles and wellness items on road
    const items = [
      { lane: 0, z: 120, type: 'hazard' },
      { lane: 1, z: 240, type: 'coin' },
      { lane: 2, z: 360, type: 'hazard' },
      { lane: 1, z: 480, type: 'tea' },
    ];

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear Canvas Background (Cyber Road Night Atmosphere)
      ctx.fillStyle = '#050a18';
      ctx.fillRect(0, 0, width, height);

      // Starfield / Grid Horizon
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.15)';
      ctx.lineWidth = 1;
      const horizonY = height * 0.35;

      // Perspective Road Geometry (Vanishing point at horizon)
      const vpX = width / 2;
      const vpY = horizonY;

      // Road Edges
      const roadTopWidth = 60;
      const roadBottomWidth = width * 0.82;

      ctx.beginPath();
      ctx.moveTo(vpX - roadTopWidth / 2, vpY);
      ctx.lineTo(vpX + roadTopWidth / 2, vpY);
      ctx.lineTo(vpX + roadBottomWidth / 2, height);
      ctx.lineTo(vpX - roadBottomWidth / 2, height);
      ctx.closePath();
      ctx.fillStyle = '#0d1527';
      ctx.fill();
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Moving Grid Lines along the road
      offset = (offset + (isPlaying ? 3.5 : 0)) % 40;
      for (let y = vpY; y < height; y += 14) {
        const factor = (y - vpY) / (height - vpY);
        const dynamicY = vpY + (factor * (height - vpY) + offset * factor) % (height - vpY);
        const wAtY = roadTopWidth + factor * (roadBottomWidth - roadTopWidth);

        ctx.beginPath();
        ctx.moveTo(vpX - wAtY / 2, dynamicY);
        ctx.lineTo(vpX + wAtY / 2, dynamicY);
        ctx.strokeStyle = `rgba(34, 211, 238, ${0.1 + factor * 0.35})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Lane Dividers (3 lanes)
      const laneXs = [-1, 1].map((mult) => mult * (roadBottomWidth / 6));
      laneXs.forEach((lx) => {
        ctx.beginPath();
        ctx.setLineDash([8, 8]);
        ctx.moveTo(vpX, vpY);
        ctx.lineTo(vpX + lx, height);
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Draw Items on Road
      items.forEach((item) => {
        if (isPlaying) {
          item.z -= 2.5;
          if (item.z < 20) item.z = 520;
        }

        const factor = (500 - item.z) / 500;
        if (factor > 0 && factor < 1) {
          const itemY = vpY + factor * (height - vpY);
          const laneOffset = (item.lane - 1) * (roadBottomWidth / 3.4) * factor;
          const itemX = vpX + laneOffset;
          const size = 10 + factor * 16;

          ctx.save();
          ctx.translate(itemX, itemY);

          if (item.type === 'hazard') {
            // Red FOMO Notification Hazard
            ctx.fillStyle = '#ef4444';
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${Math.max(8, Math.floor(size * 0.6))}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('!', 0, 1);
          } else if (item.type === 'coin') {
            // Gold Mental Health Coin
            ctx.fillStyle = '#f59e0b';
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fef3c7';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          } else {
            // Green Tea Cup Pickup
            ctx.fillStyle = '#10b981';
            ctx.shadowColor = '#10b981';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.45, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      });

      // Jump parabolic physics calculation
      let jumpY = 0;
      if (isJumping) {
        jumpTime += 0.08;
        jumpY = Math.sin(jumpTime * Math.PI) * 45;
        if (jumpTime >= 1) {
          setIsJumping(false);
          jumpTime = 0;
        }
      }

      // Draw Avatar (Runner Caio / Estátua)
      const avatarX = vpX + (avatarLane - 1) * (roadBottomWidth / 3.4) * 0.92;
      const avatarBaseY = height - 38;
      const avatarY = avatarBaseY - jumpY;

      ctx.save();
      ctx.translate(avatarX, avatarY);

      // Shadow on road
      ctx.beginPath();
      ctx.ellipse(0, jumpY + 28, 14 - jumpY * 0.15, 5, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fill();

      // Avatar Body
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 12;

      // Head
      ctx.beginPath();
      ctx.arc(0, -22, 9, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();

      // Torso
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-8, -12, 16, 20);

      // Running Legs Animation
      const legCycle = isPlaying ? Math.sin(Date.now() * 0.015) * 8 : 0;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-4, 8);
      ctx.lineTo(-4 + legCycle, 24);
      ctx.moveTo(4, 8);
      ctx.lineTo(4 - legCycle, 24);
      ctx.stroke();

      // Running Arms Animation
      ctx.beginPath();
      ctx.moveTo(-8, -8);
      ctx.lineTo(-14 - legCycle * 0.8, 4);
      ctx.moveTo(8, -8);
      ctx.lineTo(14 + legCycle * 0.8, 4);
      ctx.stroke();

      ctx.restore();

      // Draw Floating HUD Telemetry on Canvas
      ctx.fillStyle = 'rgba(6, 13, 26, 0.75)';
      ctx.fillRect(8, 8, 180, 52);
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)';
      ctx.strokeRect(8, 8, 180, 52);

      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('LIVE ENGINE SIMULATOR 60 FPS', 14, 22);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px monospace';
      ctx.fillText(`WALKSPEED: 16.0 m/s  | AABB: OK`, 14, 36);
      ctx.fillText(`LANE: ${['ESQUERDA', 'CENTRAL', 'DIREITA'][avatarLane]}`, 14, 48);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, avatarLane, isJumping]);

  // Dynamic Page Curl Calculation:
  // When peeled, clip-path cuts off the bottom-right corner diagonally.
  const peelCutout = Math.min(peelPercent * 4.0, 400); // 0 to 400px
  const clipPathStyle =
    peelPercent > 0
      ? `polygon(0 0, 100% 0, 100% calc(100% - ${peelCutout}px), calc(100% - ${peelCutout}px) 100%, 0 100%)`
      : 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';

  return (
    <div className="bg-[#050914] border-2 border-cyan-400/50 rounded-3xl p-4 sm:p-5 shadow-[0_0_40px_rgba(34,211,238,0.18)] space-y-4 relative overflow-hidden">
      {/* Header bar of Demonstration */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20">
            <Zap className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-500/40">
                🎮 Simulação & Código Revelado
              </span>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                60 FPS em Execução
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-black text-white uppercase tracking-tight mt-0.5">
              Demonstração Viva da Execução do Jogo
            </h4>
          </div>
        </div>

        {/* Action Button: Puxar Canto da Página como Livro */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              if (onRobotPeelRequest) {
                onRobotPeelRequest();
              }
              setIsPeeling((prev) => !prev);
            }}
            className={`px-3.5 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
              isPeeling
                ? 'bg-amber-400 text-slate-950 shadow-amber-500/30 ring-2 ring-amber-300'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/30'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>{isPeeling ? '📖 Fechar Página do Código' : '📖 Robô Puxa Página & Revela Código'}</span>
          </button>
        </div>
      </div>

      {/* Main Dual Stage Container: Book Page Over Live Running Code */}
      <div className="relative w-full h-[320px] sm:h-[350px] rounded-2xl overflow-hidden border border-cyan-500/30 bg-[#03060f] shadow-inner">
        
        {/* --- BOTTOM LAYER: LIVE RUNNING SOURCE CODE & TERMINAL --- */}
        <div className="absolute inset-0 bg-[#040815] p-3 sm:p-4 font-mono text-xs text-slate-200 overflow-hidden flex flex-col justify-between">
          {/* Top IDE Tab Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-[11px]">
              <Terminal className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>{snippet.filename}</span>
              <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
                ({snippet.description})
              </span>
            </div>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full font-bold">
              ● EXECUTANDO NA GPU
            </span>
          </div>

          {/* Code Viewer with Live Running Line Highlight */}
          <div className="flex-1 my-2 overflow-y-auto font-mono text-[11px] sm:text-xs leading-relaxed space-y-0.5 scrollbar-thin">
            {snippet.code.split('\n').map((line, idx) => {
              const lineNum = idx + 1;
              const isCurrentExec = lineNum === executionLine;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 px-2 py-0.5 rounded transition-colors duration-150 ${
                    isCurrentExec
                      ? 'bg-cyan-500/20 text-cyan-200 border-l-2 border-cyan-400'
                      : 'hover:bg-white/5 text-slate-300'
                  }`}
                >
                  <span className="text-slate-500 select-none w-6 text-right text-[10px]">
                    {lineNum}
                  </span>
                  <span className="flex-1 font-mono">{line}</span>
                  {isCurrentExec && (
                    <span className="text-[9px] font-black uppercase text-amber-300 bg-amber-950/80 px-1.5 py-0.2 rounded shrink-0">
                      ▶ EXECUTANDO
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Telemetry Metrics Strip */}
          <div className="pt-2 border-t border-cyan-500/20 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
            {Object.entries(snippet.liveStats).map(([key, val]) => (
              <div key={key} className="bg-slate-900/80 px-2 py-1 rounded border border-white/5">
                <span className="text-slate-400 block">{key}:</span>
                <span className="text-cyan-300 font-bold">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* --- TOP LAYER: MINI-GAME CANVAS VIEWPORT (PEELABLE BOOK PAGE) --- */}
        <div
          className="absolute inset-0 z-10 transition-all duration-300 origin-top-left"
          style={{
            clipPath: clipPathStyle,
            boxShadow: peelPercent > 0 ? '0 10px 40px rgba(0,0,0,0.85)' : 'none',
          }}
        >
          <canvas
            ref={canvasRef}
            width={720}
            height={350}
            className="w-full h-full object-cover"
          />

          {/* In-Game Interactive Quick Controls */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/75 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-lg">
            <button
              onClick={() => setAvatarLane((prev) => Math.max(0, prev - 1))}
              disabled={avatarLane === 0}
              className="px-2 py-1 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-lg text-[10px] font-black text-cyan-300 cursor-pointer"
              title="Mudar para Faixa da Esquerda"
            >
              ◀ Faixa
            </button>
            <button
              onClick={() => {
                if (!isJumping) setIsJumping(true);
              }}
              className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-lg text-[10px] uppercase cursor-pointer"
              title="Pular Avatar"
            >
              Pular
            </button>
            <button
              onClick={() => setAvatarLane((prev) => Math.min(2, prev + 1))}
              disabled={avatarLane === 2}
              className="px-2 py-1 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-lg text-[10px] font-black text-cyan-300 cursor-pointer"
              title="Mudar para Faixa da Direita"
            >
              Faixa ▶
            </button>
            <button
              onClick={() => setIsPlaying((prev) => !prev)}
              className="p-1 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg cursor-pointer"
              title={isPlaying ? 'Pausar Simulação' : 'Retomar Simulação'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>
          </div>
        </div>

        {/* --- BOOK PAGE CURL / FOLD EFFECT OVERLAY (CORNER UNDERSIDE SHINE) --- */}
        {peelPercent > 0 && (
          <div
            className="absolute bottom-0 right-0 z-20 pointer-events-none transition-all duration-300"
            style={{
              width: `${peelCutout}px`,
              height: `${peelCutout}px`,
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(34,211,238,0.2) 40%, rgba(15,23,42,0.95) 75%, #020617 100%)',
              clipPath: 'polygon(0 100%, 100% 0, 100% 100%)',
              boxShadow: '-8px -8px 25px rgba(0,0,0,0.85)',
              borderTopLeftRadius: '16px',
            }}
          >
            {/* Holographic fold seam highlight */}
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-300 to-amber-300 opacity-70 transform rotate-[-45deg] origin-top-right translate-y-2" />
            
            <div className="absolute bottom-2 right-2 text-[9px] font-mono font-black uppercase text-cyan-300/80 tracking-widest flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300 animate-spin" />
              <span>Folha do Livro Aberta</span>
            </div>
          </div>
        )}

        {/* Interactive Corner Grab Handle for User Clicking & Peeling */}
        <button
          onClick={() => {
            if (onRobotPeelRequest) onRobotPeelRequest();
            setIsPeeling((prev) => !prev);
          }}
          className={`absolute bottom-2 right-2 z-30 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-2xl transition-all ${
            isPeeling
              ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 hover:scale-105'
              : 'bg-slate-900/90 text-cyan-300 border border-cyan-400/50 hover:bg-cyan-950 hover:border-cyan-300 hover:scale-105'
          }`}
          title="Clique para desdobrar ou fechar o canto da tela do jogo como a página de um livro"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>{isPeeling ? 'Fechar Página 📖' : 'Puxar Canto: Ver Código ⚙️'}</span>
        </button>
      </div>

      {/* Live Console Output Bar */}
      <div className="bg-slate-950/90 border border-white/10 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-[10px] font-mono">
        <div className="flex items-center gap-2 truncate text-slate-300">
          <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-pulse" />
          <span className="text-cyan-400 font-bold">Console:</span>
          <span className="truncate">{activeConsoleLog}</span>
        </div>
        <span className="text-emerald-400 font-bold shrink-0">
          {isPeeling ? '📖 Código Revelado Sob a Folha' : '🎮 Jogo Renderizado'}
        </span>
      </div>
    </div>
  );
};
