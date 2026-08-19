import React, { useEffect, useState, useRef } from 'react';
import { Gamepad, X, Sliders, Check, HelpCircle, Bluetooth, Info, Sparkles, Cpu, Settings } from 'lucide-react';
import { GamepadConfig } from '../types';

interface GamepadConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GamepadConfig;
  onUpdateConfig: (newConfig: GamepadConfig) => void;
}

export const GamepadConfigModal: React.FC<GamepadConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
}) => {
  const [activeGamepad, setActiveGamepad] = useState<Gamepad | null>(null);
  const [liveXAxis, setLiveXAxis] = useState<number>(0);
  const [pressedButtons, setPressedButtons] = useState<number[]>([]);
  const requestRef = useRef<number>(0);

  // Poll real-time gamepad state for live feedback inside modal
  useEffect(() => {
    if (!isOpen) return;

    const pollGamepad = () => {
      const gamepads = navigator.getGamepads();
      const gp = Array.from(gamepads).find((g) => g !== null);

      if (gp) {
        setActiveGamepad(gp);
        setLiveXAxis(gp.axes[0] || 0);

        const pressed: number[] = [];
        gp.buttons.forEach((btn, idx) => {
          if (btn.pressed) pressed.push(idx);
        });
        setPressedButtons(pressed);
      } else {
        setActiveGamepad(null);
        setLiveXAxis(0);
        setPressedButtons([]);
      }

      requestRef.current = requestAnimationFrame(pollGamepad);
    };

    requestRef.current = requestAnimationFrame(pollGamepad);

    return () => {
      cancelAnimationFrame(requestRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleEnabled = () => {
    onUpdateConfig({ ...config, enabled: !config.enabled });
  };

  const setMode = (mode: GamepadConfig['mode']) => {
    onUpdateConfig({ ...config, mode });
  };

  const handleDeadzoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateConfig({ ...config, deadzone: parseFloat(e.target.value) });
  };

  const toggleInvert = () => {
    onUpdateConfig({ ...config, invert: !config.invert });
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto select-none">
      <div className="w-[640px] max-w-full bg-[#0d101d]/95 border border-white/10 rounded-[32px] p-6 sm:p-8 flex flex-col gap-6 shadow-2xl relative text-white max-h-[90vh] overflow-y-auto">
        
        {/* Header decoration */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Modal Title */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-400/10 border border-cyan-400/30 rounded-xl text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <Gamepad className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                Controle Bluetooth <span className="text-cyan-400 font-light text-sm tracking-widest uppercase">Gamepad</span>
              </h2>
              <p className="text-xs text-white/60">
                Configure e teste joysticks, controles de Xbox, PS4/PS5 ou Switch via Bluetooth.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all cursor-pointer text-white/80 active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Activation Toggle */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <Bluetooth className={`w-5 h-5 ${config.enabled ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
            <div>
              <span className="font-bold text-sm block">Ativar Mapeamento Bluetooth</span>
              <span className="text-[10px] text-white/50 block">Habilita a escuta contínua de controles conectados</span>
            </div>
          </div>
          <button
            onClick={toggleEnabled}
            className={`px-4 py-2 text-xs font-bold tracking-widest uppercase rounded-xl border transition-all active:scale-95 cursor-pointer ${
              config.enabled
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.25)]'
                : 'bg-white/5 text-slate-400 border-white/10'
            }`}
          >
            {config.enabled ? 'ATIVADO' : 'DESATIVADO'}
          </button>
        </div>

        {/* Gamepad Connection Status Dashboard */}
        <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" /> Painel de Hardware Ativo
          </span>

          {activeGamepad ? (
            <div className="space-y-3">
              <div className="bg-cyan-400/10 border border-cyan-400/20 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    CONECTADO COM SUCESSO
                  </span>
                  <span className="text-sm font-semibold tracking-tight text-white block mt-1 truncate max-w-[320px]">
                    {activeGamepad.id}
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-white/5 border border-white/10 px-2 py-1 rounded text-white/60">
                  ID: #{activeGamepad.index}
                </span>
              </div>

              {/* REAL TIME VISUALIZER OF INPUTS */}
              <div className="grid grid-cols-2 gap-3 bg-black/30 p-3 rounded-xl border border-white/5">
                {/* Analog Visualizer */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Analógico Horizontal</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-3 bg-slate-950 rounded-full relative overflow-hidden border border-white/5">
                      {/* Zero line */}
                      <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-white/20" />
                      {/* Stick position bar */}
                      <div
                        className={`absolute top-0 bottom-0 ${liveXAxis < 0 ? 'right-1/2 bg-cyan-400' : 'left-1/2 bg-cyan-400'}`}
                        style={{
                          width: `${Math.min(50, Math.abs(liveXAxis) * 50)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono w-10 text-right text-cyan-300">
                      {liveXAxis.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Pressed Buttons Visualizer */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Botões Ativos</span>
                  <div className="flex flex-wrap gap-1 max-h-[38px] overflow-y-auto">
                    {pressedButtons.length > 0 ? (
                      pressedButtons.map((btn) => (
                        <span key={btn} className="px-1.5 py-0.5 bg-purple-500/30 border border-purple-400/40 text-purple-300 text-[9px] font-mono rounded font-bold">
                          B{btn}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-white/30 italic">Aguardando comando...</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center space-y-2 border border-dashed border-white/10 rounded-xl">
              <span className="text-xs text-white/40 italic block">Nenhum controle detectado no navegador.</span>
              <p className="text-[10px] text-white/30 max-w-sm mx-auto">
                Ligue seu controle Bluetooth e pressione qualquer botão para que ele seja detectado instantaneamente pelo sistema.
              </p>
            </div>
          )}
        </div>

        {/* CONFIGURATIONS FORM */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* CONTROL SCHEME MODE */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-cyan-400" /> Esquema de Controle
            </span>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => setMode('analog')}
                className={`w-full py-2.5 px-3 rounded-xl border text-left flex justify-between items-center transition-all cursor-pointer active:scale-95 ${
                  config.mode === 'analog'
                    ? 'bg-cyan-500/10 border-cyan-400/40 text-cyan-300'
                    : 'bg-black/30 border-white/5 text-slate-300 hover:border-white/10'
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold">Analógico Esquerdo</span>
                  <span className="text-[9px] text-white/40">Movimentação fluida via Analógico</span>
                </div>
                {config.mode === 'analog' && <Check className="w-4 h-4 text-cyan-400" />}
              </button>

              <button
                onClick={() => setMode('dpad')}
                className={`w-full py-2.5 px-3 rounded-xl border text-left flex justify-between items-center transition-all cursor-pointer active:scale-95 ${
                  config.mode === 'dpad'
                    ? 'bg-cyan-500/10 border-cyan-400/40 text-cyan-300'
                    : 'bg-black/30 border-white/5 text-slate-300 hover:border-white/10'
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold">D-Pad (Direcional Digital)</span>
                  <span className="text-[9px] text-white/40">Utiliza as setas digitais do controle</span>
                </div>
                {config.mode === 'dpad' && <Check className="w-4 h-4 text-cyan-400" />}
              </button>

              <button
                onClick={() => setMode('buttons')}
                className={`w-full py-2.5 px-3 rounded-xl border text-left flex justify-between items-center transition-all cursor-pointer active:scale-95 ${
                  config.mode === 'buttons'
                    ? 'bg-cyan-500/10 border-cyan-400/40 text-cyan-300'
                    : 'bg-black/30 border-white/5 text-slate-300 hover:border-white/10'
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold">Botões Principais (A/B ou L1/R1)</span>
                  <span className="text-[9px] text-white/40">Botões de ação ou gatilhos superiores</span>
                </div>
                {config.mode === 'buttons' && <Check className="w-4 h-4 text-cyan-400" />}
              </button>
            </div>
          </div>

          {/* CALIBRATION & SENSITIVITY */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Sensibilidade & Zona Morta
              </span>

              <div className="space-y-2 bg-black/30 p-3 rounded-xl border border-white/5">
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>Zona Morta do Analógico</span>
                  <span className="font-mono text-cyan-300">{config.deadzone.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.45"
                  step="0.05"
                  value={config.deadzone}
                  onChange={handleDeadzoneChange}
                  className="w-full accent-cyan-400 bg-slate-950 rounded-lg cursor-pointer"
                />
                <span className="text-[9px] text-white/40 block leading-tight">
                  Valores menores respondem mais rápido, valores maiores evitam drifting de analógicos velhos.
                </span>
              </div>
            </div>

            {/* INVERT DIRECTION */}
            <div className="flex items-center justify-between bg-black/30 p-3 rounded-xl border border-white/5">
              <div className="flex flex-col">
                <span className="text-xs font-bold">Inverter Controles</span>
                <span className="text-[9px] text-white/40">Inverte esquerda e direita</span>
              </div>
              <button
                onClick={toggleInvert}
                className={`w-10 h-6 rounded-full p-0.5 border transition-colors flex ${
                  config.invert ? 'bg-cyan-500 border-cyan-400 justify-end' : 'bg-slate-950 border-white/10 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow" />
              </button>
            </div>
          </div>
        </div>

        {/* CONNECTION GUIDE / MANUAL */}
        <div className="bg-cyan-500/5 border border-cyan-400/20 rounded-2xl p-4 space-y-2 text-left">
          <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-cyan-400" /> Guia de Emparelhamento Bluetooth:
          </span>
          <ul className="text-[10.5px] text-slate-300 space-y-1.5 list-disc list-inside">
            <li>
              <strong>Xbox One/Series</strong>: Segure o botão de emparelhamento no topo por 3s até piscar rápido, conecte via Bluetooth no dispositivo.
            </li>
            <li>
              <strong>PS4/PS5 (DualShock/DualSense)</strong>: Segure <strong>SHARE + PS</strong> por 4s até a barra de luz pulsar duplo em branco.
            </li>
            <li>
              <strong>Nintendo Switch</strong>: Segure o botão <strong>SYNC</strong> (no trilho dos Joy-Cons ou traseira do Pro) por 3s até as luzes rolarem.
            </li>
            <li>
              Após emparelhar, pressione **qualquer botão** do controle com o jogo aberto para ativá-lo.
            </li>
          </ul>
        </div>

        {/* Confirm Footer */}
        <button
          onClick={onClose}
          className="w-full py-3.5 bg-cyan-400/20 hover:bg-cyan-400/30 text-cyan-300 border border-cyan-400/40 rounded-2xl font-bold transition-all text-xs tracking-wider uppercase shadow-xl hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" /> CONFIRMAR CONFIGURAÇÃO
        </button>

      </div>
    </div>
  );
};
