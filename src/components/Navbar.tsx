import React from 'react';
import { Gamepad2, ShieldAlert, BarChart3, QrCode, BookOpen, Gamepad } from 'lucide-react';
import { GameState, GamepadConfig } from '../types';

interface NavbarProps {
  activeTab: 'simulator' | 'code' | 'guide' | 'analytics';
  setActiveTab: (tab: 'simulator' | 'code' | 'guide' | 'analytics') => void;
  gameState?: GameState;
  onStartGame?: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  isGamepadModalOpen: boolean;
  setIsGamepadModalOpen: (open: boolean) => void;
  gamepadConfig: GamepadConfig;
  showQrModal: boolean;
  setShowQrModal: (show: boolean) => void;
  showStudyModal: boolean;
  setShowStudyModal: (show: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  gameState,
  onStartGame,
  soundEnabled,
  setSoundEnabled,
  isGamepadModalOpen,
  setIsGamepadModalOpen,
  gamepadConfig,
  showQrModal,
  setShowQrModal,
  showStudyModal,
  setShowStudyModal,
}) => {

  return (
    <header className="w-full bg-[#050508]/80 backdrop-blur-2xl border-b border-white/10 sticky top-0 px-4 sm:px-8 py-3.5 transition-all z-40">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3 sm:gap-4">
        {/* Title / Logo / Badge */}
        <div className="flex items-center gap-3.5 flex-wrap justify-center sm:justify-start">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-cyan-400/10 to-transparent flex items-center justify-center text-cyan-400 border border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.2)] shrink-0">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-light tracking-tight text-white uppercase">
              Entre redes <span className="font-bold text-cyan-400">há ansiedade</span>
            </h1>
            <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-widest block opacity-90">
              Simulador Interativo Educacional
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowQrModal(true)}
              className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 rounded-full text-cyan-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(34,211,238,0.2)] cursor-pointer active:scale-95 whitespace-nowrap"
              title="Abrir QR Code do Simulador"
            >
              <QrCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>QR Code</span>
            </button>

            <button
              onClick={() => setShowStudyModal(true)}
              className="px-3.5 py-1.5 bg-[#0c1424] hover:bg-[#121e35] border border-cyan-400/30 rounded-full text-cyan-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(34,211,238,0.2)] cursor-pointer active:scale-95 whitespace-nowrap"
              title="Abrir Informações sobre o Estudo"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Informações sobre o Estudo</span>
            </button>
          </div>
        </div>

        {/* Tab & Action Button Switcher at Top */}
        <div className="flex items-center justify-center bg-black/60 border border-white/10 backdrop-blur-xl p-1.5 rounded-2xl shadow-inner gap-1.5 flex-nowrap shrink-0 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Gamepad2 className="w-4 h-4 shrink-0" /> Jogo Interativo
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" /> Diagnóstico
          </button>

          {/* Vertical Divider */}
          <div className="w-px h-6 bg-white/10 shrink-0 mx-0.5" />

          {/* Gamepad Bluetooth Config Button */}
          <button
            onClick={() => setIsGamepadModalOpen(true)}
            className={`px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
              gamepadConfig.enabled
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25'
                : 'text-white/40 hover:text-white/60 hover:bg-white/5 border border-transparent'
            }`}
            title="Configurar Controle Bluetooth / Gamepad"
          >
            <Gamepad className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-[10px] tracking-wider">
              {gamepadConfig.enabled ? 'Controle' : 'Sem Controle'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
