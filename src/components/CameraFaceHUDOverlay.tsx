import React, { useState } from 'react';
import { CameraOff, Target, ChevronDown, ChevronUp, Check, Eye } from 'lucide-react';
import { CameraMotionState } from '../hooks/useCameraFaceTracking';
import { playButtonClickSFX } from '../utils/audio';

interface CameraFaceHUDOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  motionState: CameraMotionState;
  onCalibrate: () => void;
  onToggleEnabled: () => void;
  soundEnabled?: boolean;
  invertX?: boolean;
}

export const CameraFaceHUDOverlay: React.FC<CameraFaceHUDOverlayProps> = ({
  videoRef,
  canvasRef,
  motionState,
  onCalibrate,
  onToggleEnabled,
  soundEnabled = true,
  invertX = true,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [justCalibrated, setJustCalibrated] = useState<boolean>(false);

  const handleCalibrate = () => {
    playButtonClickSFX(soundEnabled);
    onCalibrate();
    setJustCalibrated(true);
    setTimeout(() => setJustCalibrated(false), 1200);
  };

  if (!motionState.isStreaming && motionState.permissionDenied) {
    return (
      <div className="fixed bottom-20 left-4 z-40 bg-rose-950/90 border border-rose-400/50 p-3 rounded-2xl text-xs text-rose-200 max-w-xs shadow-xl animate-in fade-in">
        <div className="flex items-center gap-2 font-bold mb-1">
          <CameraOff className="w-4 h-4 text-rose-400" />
          <span>Câmera Indisponível</span>
        </div>
        <span>Permissão de webcam negada. Permita o acesso à câmera para usar navegação por rosto.</span>
      </div>
    );
  }

  // Calculate normalized offsets for the calibration sphere (-42px to +42px)
  const sphereX = Math.max(-42, Math.min(42, (motionState.deltaX / 30) * 42));
  const sphereY = Math.max(-42, Math.min(42, (motionState.deltaY / 25) * 42));
  const isCentered = motionState.activeDirection === 'CENTER';

  return (
    <div className="fixed bottom-20 left-4 z-[9990] flex flex-col items-start gap-1.5 transition-all">
      {/* Hidden Offscreen Processing Canvas */}
      <canvas
        ref={canvasRef}
        width={320}
        height={240}
        className="hidden"
      />

      {/* Main HUD Window */}
      <div className="w-56 bg-[#070c18]/95 border-2 border-cyan-400/60 backdrop-blur-xl rounded-2xl p-2.5 shadow-[0_0_30px_rgba(34,211,238,0.25)] flex flex-col gap-2 text-white">
        
        {/* Top Header */}
        <div className="flex items-center justify-between gap-1 border-b border-white/10 pb-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
              👁️ Rosto & Gestos
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized((prev) => !prev)}
              className="p-1 hover:bg-white/10 rounded-lg text-slate-300 transition-colors cursor-pointer"
              title={isMinimized ? 'Expandir HUD da Câmera' : 'Minimizar HUD da Câmera'}
            >
              {isMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => {
                playButtonClickSFX(soundEnabled);
                onToggleEnabled();
              }}
              className="p-1 hover:bg-rose-500/20 rounded-lg text-rose-300 transition-colors cursor-pointer"
              title="Desativar Câmera de Acessibilidade"
            >
              <CameraOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Minimized Quick Status */}
        {isMinimized ? (
          <div className="flex items-center justify-between gap-2 py-1">
            <span className="text-[10px] font-bold text-cyan-300">
              {motionState.activeDirection === 'CENTER' ? '🟢 Centro' : `🎯 ${motionState.activeDirection}`}
            </span>
            <button
              onClick={handleCalibrate}
              className="text-[9px] font-black px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 cursor-pointer"
            >
              Calibrar
            </button>
          </div>
        ) : (
          <>
            {/* 1. Imagem da Câmera (Webcam Feed) */}
            <div className="relative w-full h-24 bg-slate-950 rounded-xl overflow-hidden border border-cyan-400/40 shadow-inner flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className={`w-full h-full object-cover ${invertX ? 'scale-x-[-1]' : ''}`}
              />

              {/* Live Badge */}
              <div className="absolute top-1 left-1.5 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded-md border border-white/10 pointer-events-none">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[8px] font-mono font-bold text-white tracking-widest">
                  AO VIVO
                </span>
              </div>

              {/* Face Guide Silhouette in Camera */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                <div className="w-14 h-18 rounded-[50%] border border-dashed border-cyan-300" />
              </div>
            </div>

            {/* 2. Abaixo da imagem da câmera: Alvo Central com a Esfera de Calibração */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                  <Target className="w-2.5 h-2.5" /> Alvo Central
                </span>
                <span className="text-[8px] font-mono text-slate-400">
                  ΔX: {motionState.deltaX} ΔY: {motionState.deltaY}
                </span>
              </div>

              {/* Radar Reticle Target Box */}
              <div className="relative w-full h-28 bg-slate-950/90 rounded-xl border border-cyan-400/40 overflow-hidden flex items-center justify-center shadow-inner">
                {/* Background Grid Accent */}
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px] opacity-40 pointer-events-none" />

                {/* Reticle Lines (Axes) */}
                <div className="w-full h-px bg-cyan-400/25 absolute pointer-events-none" />
                <div className="h-full w-px bg-cyan-400/25 absolute pointer-events-none" />

                {/* Concentric Guide Rings */}
                {/* Outer Ring */}
                <div className="w-24 h-24 rounded-full border border-cyan-400/20 absolute pointer-events-none" />
                {/* Trigger Threshold Ring */}
                <div className="w-16 h-16 rounded-full border border-cyan-400/40 absolute pointer-events-none" />
                {/* Neutral Deadzone Center Ring */}
                <div className={`w-8 h-8 rounded-full border border-dashed absolute pointer-events-none transition-colors duration-200 ${
                  isCentered ? 'border-emerald-400/80 bg-emerald-500/10' : 'border-slate-600 bg-transparent'
                }`} />

                {/* Direction Labels around target */}
                <span className="absolute top-1 text-[7px] font-black uppercase text-slate-400 pointer-events-none">
                  ▲ PULO
                </span>
                <span className="absolute bottom-1 text-[7px] font-black uppercase text-slate-400 pointer-events-none">
                  ▼ ABAIXAR
                </span>
                <span className="absolute left-1.5 text-[7px] font-black uppercase text-slate-400 pointer-events-none">
                  ◀ ESQ
                </span>
                <span className="absolute right-1.5 text-[7px] font-black uppercase text-slate-400 pointer-events-none">
                  DIR ▶
                </span>

                {/* Esfera de Calibração (Calibration Sphere) */}
                <div
                  className="absolute pointer-events-none transition-transform duration-75 ease-out"
                  style={{
                    transform: `translate(${sphereX}px, ${sphereY}px)`,
                  }}
                >
                  <div className={`relative w-[18px] h-[18px] rounded-full flex items-center justify-center transition-all duration-150 ${
                    isCentered
                      ? 'bg-gradient-to-br from-emerald-200 via-emerald-400 to-teal-700 shadow-[0_0_12px_#10b981]'
                      : 'bg-gradient-to-br from-cyan-200 via-cyan-400 to-blue-600 shadow-[0_0_14px_#06b6d4]'
                  }`}>
                    {/* Inner 3D Sphere Highlight */}
                    <div className="w-1.5 h-1.5 rounded-full bg-white/80 absolute top-0.5 left-0.5" />
                    {/* Center Reticle Point */}
                    <div className="w-1 h-1 rounded-full bg-slate-950" />
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="bg-slate-950/90 border border-white/10 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase text-center truncate">
                {motionState.activeDirection === 'LEFT' && (
                  <span className="text-cyan-300 animate-pulse">◀️ ESQUERDA (Girar Rosto)</span>
                )}
                {motionState.activeDirection === 'RIGHT' && (
                  <span className="text-cyan-300 animate-pulse">DIREITA ▶️ (Girar Rosto)</span>
                )}
                {motionState.activeDirection === 'UP' && (
                  <span className="text-emerald-300 animate-pulse">🔼 PULO (Erguer Cabeça)</span>
                )}
                {motionState.activeDirection === 'DOWN' && (
                  <span className="text-purple-300 animate-pulse">🔽 ABAIXAR (Abaixar Cabeça)</span>
                )}
                {motionState.activeDirection === 'CENTER' && (
                  <span className="text-emerald-400 font-bold">🟢 CENTRO NEUTRO</span>
                )}
              </div>
            </div>

            {/* 3. Botão de Calibração do Centro */}
            <button
              onClick={handleCalibrate}
              className={`w-full py-1.5 px-2 font-black text-[10px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95 ${
                justCalibrated
                  ? 'bg-emerald-400 text-slate-950 shadow-emerald-400/40'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950'
              }`}
              title="Calibrar Centro Neutro da Cabeça"
            >
              {justCalibrated ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Centro Calibrado!</span>
                </>
              ) : (
                <>
                  <Target className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Calibrar Centro</span>
                </>
              )}
            </button>
          </>
        )}

      </div>
    </div>
  );
};
