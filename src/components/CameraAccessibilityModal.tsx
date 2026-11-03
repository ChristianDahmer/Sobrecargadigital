import React, { useRef, useEffect, useState } from 'react';
import {
  X,
  Camera,
  CameraOff,
  Target,
  Eye,
  ShieldCheck,
  Video,
  CheckCircle2,
  HelpCircle,
  Check,
} from 'lucide-react';
import { CameraMotionState, CameraTrackingConfig } from '../hooks/useCameraFaceTracking';
import { playButtonClickSFX } from '../utils/audio';

interface CameraAccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CameraTrackingConfig;
  onUpdateConfig: (newConfig: Partial<CameraTrackingConfig>) => void;
  motionState: CameraMotionState;
  onCalibrate: () => void;
  soundEnabled?: boolean;
  mediaStream?: MediaStream | null;
}

export const CameraAccessibilityModal: React.FC<CameraAccessibilityModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  motionState,
  onCalibrate,
  soundEnabled = true,
  mediaStream,
}) => {
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);
  const [justCalibrated, setJustCalibrated] = useState<boolean>(false);

  // Attach webcam stream to modal preview video
  useEffect(() => {
    if (modalVideoRef.current && mediaStream) {
      modalVideoRef.current.srcObject = mediaStream;
      modalVideoRef.current.play().catch(console.warn);
    } else if (modalVideoRef.current) {
      modalVideoRef.current.srcObject = null;
    }
  }, [mediaStream, isOpen, config.enabled]);

  if (!isOpen) return null;

  const handleCalibrate = () => {
    playButtonClickSFX(soundEnabled);
    onCalibrate();
    setJustCalibrated(true);
    setTimeout(() => setJustCalibrated(false), 1500);
  };

  // Calculate normalized offsets for the modal calibration sphere (-58px to +58px)
  const sphereX = Math.max(-58, Math.min(58, (motionState.deltaX / 30) * 58));
  const sphereY = Math.max(-58, Math.min(58, (motionState.deltaY / 25) * 58));
  const isCentered = motionState.activeDirection === 'CENTER';

  return (
    <div className="fixed inset-0 z-[10010] bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#080d1a] border-2 border-cyan-400/50 rounded-[32px] shadow-[0_0_60px_rgba(34,211,238,0.25)] flex flex-col max-h-[92vh] overflow-hidden text-white my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Accent Gradient Bar */}
        <div className="w-full h-2 bg-gradient-to-r from-cyan-400 via-emerald-400 to-indigo-500" />

        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between gap-3 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 border border-cyan-300/40 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20 shrink-0">
              <Eye className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300 bg-cyan-950/80 border border-cyan-400/40 px-2.5 py-0.5 rounded-full">
                  👁️ Acessibilidade Universal • Rosto & Gestos
                </span>
                {motionState.isStreaming && (
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-400/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Câmera Ativa
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-white mt-0.5">
                Navegação por Movimentos Faciais
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              playButtonClickSFX(soundEnabled);
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors cursor-pointer shrink-0"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5">
          
          {/* Main Toggle Card */}
          <div className="bg-slate-900/90 border-2 border-cyan-400/40 rounded-3xl p-4 sm:p-5 flex items-center justify-between flex-wrap gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center shrink-0">
                <Video className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  Ativar Controle por Câmera / Rosto
                </h3>
                <p className="text-xs text-slate-300">
                  Controle o jogo e responda perguntas psicométricas inclinando a cabeça na webcam.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                playButtonClickSFX(soundEnabled);
                onUpdateConfig({ enabled: !config.enabled });
              }}
              className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg flex items-center gap-2 ${
                config.enabled
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              {config.enabled ? (
                <>
                  <Camera className="w-4 h-4 fill-slate-950" />
                  <span>Câmera Ativada</span>
                </>
              ) : (
                <>
                  <CameraOff className="w-4 h-4" />
                  <span>Ativar Câmera</span>
                </>
              )}
            </button>
          </div>

          {/* Test & Calibration Studio with Live Camera Feed */}
          {config.enabled && (
            <div className="bg-slate-950 border-2 border-cyan-400/40 rounded-3xl p-4 sm:p-5 space-y-4 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black uppercase text-cyan-300 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-cyan-400" /> Calibração do Centro e Rastreamento
                </span>

                <button
                  onClick={handleCalibrate}
                  className={`px-4 py-2 font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95 ${
                    justCalibrated
                      ? 'bg-emerald-400 text-slate-950 shadow-emerald-400/40'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950'
                  }`}
                >
                  {justCalibrated ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Centro Calibrado!</span>
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 fill-slate-950" />
                      <span>Calibrar Centro Neutro</span>
                    </>
                  )}
                </button>
              </div>

              {/* Grid: Live Camera Feed + Central Calibration Target */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Imagem da Câmera em Tempo Real (Webcam Feed) */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                    <span className="flex items-center gap-1 text-cyan-300">
                      <Camera className="w-3.5 h-3.5" /> Imagem da Câmera
                    </span>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Ao Vivo
                    </span>
                  </div>

                  <div className="relative w-full h-48 sm:h-52 bg-slate-900 rounded-2xl overflow-hidden border border-cyan-400/40 shadow-inner flex items-center justify-center">
                    {mediaStream ? (
                      <video
                        ref={modalVideoRef}
                        playsInline
                        autoPlay
                        muted
                        className={`w-full h-full object-cover ${config.invertX ? 'scale-x-[-1]' : ''}`}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-500 gap-2">
                        <CameraOff className="w-8 h-8 opacity-40 animate-pulse" />
                        <span className="text-xs">Aguardando sinal da câmera...</span>
                      </div>
                    )}

                    {/* Face Guide Silhouette */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
                      <div className="w-24 h-32 rounded-[50%] border-2 border-dashed border-cyan-300 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-cyan-400/60" />
                      </div>
                    </div>

                    {/* Camera Overlay Guide Text */}
                    <div className="absolute bottom-2 inset-x-2 bg-slate-950/85 backdrop-blur-sm border border-white/10 px-2.5 py-1 rounded-xl text-center">
                      <span className="text-[10px] text-slate-300 font-medium">
                        Posicione o rosto no centro e olhe para frente
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Alvo Central com a Esfera de Calibração */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                    <span className="flex items-center gap-1 text-cyan-300">
                      <Target className="w-3.5 h-3.5" /> Alvo Central & Esfera
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400">
                      ΔX: {motionState.deltaX} • ΔY: {motionState.deltaY}
                    </span>
                  </div>

                  {/* Large Radar Reticle Box */}
                  <div className="relative w-full h-48 sm:h-52 bg-slate-900/90 rounded-2xl border border-cyan-400/40 overflow-hidden flex items-center justify-center shadow-inner">
                    {/* Background Grid */}
                    <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:14px_14px] opacity-40 pointer-events-none" />

                    {/* Reticle Lines (Axes) */}
                    <div className="w-full h-px bg-cyan-400/25 absolute pointer-events-none" />
                    <div className="h-full w-px bg-cyan-400/25 absolute pointer-events-none" />

                    {/* Concentric Guide Rings */}
                    <div className="w-36 h-36 rounded-full border border-cyan-400/20 absolute pointer-events-none" />
                    <div className="w-24 h-24 rounded-full border border-cyan-400/40 absolute pointer-events-none" />
                    <div className={`w-12 h-12 rounded-full border-2 border-dashed absolute pointer-events-none transition-colors duration-200 ${
                      isCentered ? 'border-emerald-400 bg-emerald-500/10' : 'border-slate-600 bg-transparent'
                    }`} />

                    {/* Direction Labels */}
                    <span className="absolute top-2 text-[8px] font-black uppercase text-slate-400 pointer-events-none">
                      ▲ PULO (Cima)
                    </span>
                    <span className="absolute bottom-2 text-[8px] font-black uppercase text-slate-400 pointer-events-none">
                      ▼ ABAIXAR (Baixo)
                    </span>
                    <span className="absolute left-2 text-[8px] font-black uppercase text-slate-400 pointer-events-none">
                      ◀ ESQUERDA
                    </span>
                    <span className="absolute right-2 text-[8px] font-black uppercase text-slate-400 pointer-events-none">
                      DIREITA ▶
                    </span>

                    {/* Esfera de Calibração (Calibration Sphere) */}
                    <div
                      className="absolute pointer-events-none transition-transform duration-75 ease-out"
                      style={{
                        transform: `translate(${sphereX}px, ${sphereY}px)`,
                      }}
                    >
                      <div className={`relative w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150 ${
                        isCentered
                          ? 'bg-gradient-to-br from-emerald-200 via-emerald-400 to-teal-700 shadow-[0_0_16px_#10b981]'
                          : 'bg-gradient-to-br from-cyan-200 via-cyan-400 to-blue-600 shadow-[0_0_18px_#06b6d4]'
                      }`}>
                        {/* 3D Highlight */}
                        <div className="w-2 h-2 rounded-full bg-white/80 absolute top-0.5 left-0.5" />
                        {/* Center Reticle Point */}
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Status Feedback Badge */}
              <div className="p-3 bg-slate-900 border border-white/10 rounded-2xl text-center text-xs font-black uppercase tracking-wider">
                {motionState.activeDirection === 'LEFT' && (
                  <span className="text-cyan-300 animate-pulse">◀️ ESQUERDA (Girar/Inclinar Rosto • Move Esquerda / Responde NÃO)</span>
                )}
                {motionState.activeDirection === 'RIGHT' && (
                  <span className="text-cyan-300 animate-pulse">DIREITA ▶️ (Girar/Inclinar Rosto • Move Direita / Responde SIM)</span>
                )}
                {motionState.activeDirection === 'UP' && (
                  <span className="text-emerald-300 animate-pulse">🔼 PULO (Erguer Cabeça • Pula Obstáculo)</span>
                )}
                {motionState.activeDirection === 'DOWN' && (
                  <span className="text-purple-300 animate-pulse">🔽 ABAIXAR (Abaixar Cabeça • Agacha no Jogo)</span>
                )}
                {motionState.activeDirection === 'CENTER' && (
                  <span className="text-emerald-400 font-bold">🟢 CENTRO NEUTRO (Cabeça Calibrada em Repouso)</span>
                )}
              </div>

              {/* Parameter Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    Sensibilidade de Movimento:
                  </label>
                  <div className="flex gap-1.5">
                    {(['baixa', 'media', 'alta'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          playButtonClickSFX(soundEnabled);
                          onUpdateConfig({ sensitivity: s });
                        }}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer border ${
                          config.sensitivity === s
                            ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-md'
                            : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    Espelhamento da Câmera (Inverter X):
                  </label>
                  <button
                    onClick={() => {
                      playButtonClickSFX(soundEnabled);
                      onUpdateConfig({ invertX: !config.invertX });
                    }}
                    className={`w-full py-1.5 px-3 rounded-xl text-xs font-black uppercase transition-all cursor-pointer border flex items-center justify-center gap-2 ${
                      config.invertX
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50'
                        : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <span>Espelho Natural {config.invertX ? '(Ligado)' : '(Desligado)'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Gestures Guide Grid */}
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>Guia de Gestos e Movimentos Faciais:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
              <div className="p-3 bg-slate-950 border border-white/5 rounded-xl flex items-center gap-3">
                <span className="text-2xl">👈</span>
                <div>
                  <strong className="text-white block">Inclinar Rosto para a Esquerda</strong>
                  <span className="text-[11px] text-slate-400">Move avatar para a esquerda / Responde NÃO</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-white/5 rounded-xl flex items-center gap-3">
                <span className="text-2xl">👉</span>
                <div>
                  <strong className="text-white block">Inclinar Rosto para a Direita</strong>
                  <span className="text-[11px] text-slate-400">Move avatar para a direita / Responde SIM</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-white/5 rounded-xl flex items-center gap-3">
                <span className="text-2xl">👆</span>
                <div>
                  <strong className="text-white block">Erguer a Cabeça</strong>
                  <span className="text-[11px] text-slate-400">Pula obstáculos no caminho (Jump)</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-white/5 rounded-xl flex items-center gap-3">
                <span className="text-2xl">👇</span>
                <div>
                  <strong className="text-white block">Abaixar a Cabeça</strong>
                  <span className="text-[11px] text-slate-400">Agacha para esquivar (Crouch)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Guarantee Banner */}
          <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-xs text-emerald-200">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              <strong>Privacidade Garantida:</strong> O rastreamento facial é processado 100% localmente no seu dispositivo. Nenhuma imagem ou vídeo é gravado ou enviado para a internet.
            </span>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400 font-mono">
            Acessibilidade Web • Visão Computacional Local 30 FPS
          </span>

          <button
            onClick={() => {
              playButtonClickSFX(soundEnabled);
              onClose();
            }}
            className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-colors cursor-pointer"
          >
            Concluído
          </button>
        </div>

      </div>
    </div>
  );
};
