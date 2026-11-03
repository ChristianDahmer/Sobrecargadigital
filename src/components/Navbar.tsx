import React, { useState } from 'react';
import { Gamepad2, ShieldAlert, BarChart3, QrCode, BookOpen, Settings, Bot, Globe, ChevronDown, Check } from 'lucide-react';
import { GameState, GamepadConfig } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface NavbarProps {
  activeTab: 'simulator' | 'code' | 'guide' | 'analytics' | 'informacoes';
  setActiveTab: (tab: 'simulator' | 'code' | 'guide' | 'analytics' | 'informacoes') => void;
  gameState?: GameState;
  onStartGame?: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  isGamepadModalOpen?: boolean;
  setIsGamepadModalOpen?: (open: boolean) => void;
  gamepadConfig?: GamepadConfig;
  showQrModal: boolean;
  setShowQrModal: (show: boolean) => void;
  onOpenControlPanel?: () => void;
  onOpenWindowsInstall?: () => void;
  onOpenCameraAccessibility?: () => void;
  isCameraAccessibilityActive?: boolean;
  isDemoMode?: boolean;
  onToggleDemoMode?: () => void;
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
  onOpenControlPanel,
  onOpenWindowsInstall,
  onOpenCameraAccessibility,
  isCameraAccessibilityActive = false,
  isDemoMode = false,
  onToggleDemoMode,
}) => {
  const { language, setLanguage, t, languages } = useLanguage();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const currentLang = languages.find((l) => l.code === language) || languages[0];

  return (
    <header className="w-full bg-[#050508]/90 backdrop-blur-2xl border-b border-white/10 sticky top-0 px-4 sm:px-8 py-3.5 transition-all z-[9995]">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3 sm:gap-4">
        {/* Title / Logo / Badge + Action Buttons */}
        <div className="flex items-center gap-3.5 flex-wrap justify-center sm:justify-start">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-cyan-400/10 to-transparent flex items-center justify-center text-cyan-400 border border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.2)] shrink-0">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-light tracking-tight text-white uppercase">
              {language === 'es' ? 'Entre redes ' : language === 'en' ? 'Anxiety between ' : language === 'de' ? 'Zwischen Netzen ' : 'Entre redes '}
              <span className="font-bold text-cyan-400">
                {language === 'es' ? 'hay ansiedad' : language === 'en' ? 'networks' : language === 'de' ? 'herrscht Angst' : 'há ansiedade'}
              </span>
            </h1>
            <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-widest block opacity-90">
              {t('app.subtitle')}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowQrModal(true)}
              className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 rounded-full text-cyan-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(34,211,238,0.2)] cursor-pointer active:scale-95 whitespace-nowrap"
              title="QR Code"
            >
              <QrCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{t('nav.qrCode')}</span>
            </button>

            <a
              href="/assets/aistudio/roleta_gire_e_desconecte-2_6ae11244.html"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400/40 rounded-full text-pink-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(244,63,94,0.2)] cursor-pointer active:scale-95 whitespace-nowrap"
              title="Roleta"
            >
              <span>{t('nav.spinWheel')}</span>
            </a>

            <a
              href="/assets/aistudio/Questionario_Dependencia_Redes_Sociais_Autores-1_5fd2c8f5.html"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 rounded-full text-indigo-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(91,75,183,0.2)] cursor-pointer active:scale-95 whitespace-nowrap"
              title="Questionário"
            >
              <span>{t('nav.quickQuiz')}</span>
            </a>

            {onToggleDemoMode && (
              <button
                onClick={onToggleDemoMode}
                className={`px-3 py-1.5 border rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
                  isDemoMode
                    ? 'bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.5)] animate-pulse'
                    : 'bg-black/40 hover:bg-white/10 border-white/20 text-white/70'
                }`}
                title="Modo Demo"
              >
                <Bot className={`w-3.5 h-3.5 ${isDemoMode ? 'text-cyan-300 animate-spin' : 'text-white/60'}`} />
                <span>{isDemoMode ? t('nav.demoActive') : t('nav.demoMode')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher & Combobox Actions */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-center shrink-0">
          {/* Navigation Tabs (Scrollable on very small screens) */}
          <div className="flex items-center justify-center bg-black/60 border border-white/10 backdrop-blur-xl p-1.5 rounded-2xl shadow-inner gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${
                activeTab === 'simulator'
                  ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Gamepad2 className="w-4 h-4 shrink-0" /> {t('nav.game')}
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" /> {t('nav.analytics')}
            </button>

            <button
              onClick={() => setActiveTab('informacoes')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${
                activeTab === 'informacoes'
                  ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" /> {t('nav.info')}
            </button>
          </div>

          {/* Action Tools: Language Combobox + Settings Button (No overflow clipping, high z-index) */}
          <div className="flex items-center gap-1.5 shrink-0 relative z-[9996]">
            {/* Combo de Seleção de Idioma (Combobox Unificado) */}
            <div className="relative shrink-0">
              <button
                id="language-select-combobox"
                type="button"
                onClick={() => setIsLangMenuOpen((prev) => !prev)}
                aria-expanded={isLangMenuOpen}
                aria-haspopup="listbox"
                className="px-3 py-2 bg-[#090d16]/95 hover:bg-[#111827] border border-cyan-400/50 hover:border-cyan-300 rounded-2xl text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(34,211,238,0.2)] group"
                title="Selecionar Idioma / Select Language"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0 group-hover:rotate-12 transition-transform" />
                <span className="text-base leading-none">
                  {currentLang.flag}
                </span>
                <span className="text-xs font-bold text-slate-100 hidden sm:inline">
                  {currentLang.name}
                </span>
                <span className="text-[10px] font-mono font-black uppercase text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-400/30">
                  {currentLang.code.toUpperCase()}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-cyan-300 transition-transform duration-200 shrink-0 ${isLangMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLangMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[9997]"
                    onClick={() => setIsLangMenuOpen(false)}
                  />
                  <div
                    role="listbox"
                    aria-labelledby="language-select-combobox"
                    className="absolute right-0 top-full mt-2 w-52 bg-[#090d16]/95 border-2 border-cyan-400/60 backdrop-blur-2xl rounded-2xl shadow-[0_0_40px_rgba(34,211,238,0.35)] p-1.5 z-[9998] flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-cyan-300/80 border-b border-white/10 flex items-center justify-between">
                      <span>{t('nav.language', 'Selecionar Idioma')}</span>
                      <Globe className="w-3 h-3 text-cyan-400" />
                    </div>
                    {languages.map((l) => {
                      const isSelected = language === l.code;
                      return (
                        <button
                          key={l.code}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            setLanguage(l.code);
                            setIsLangMenuOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                              : 'text-slate-200 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{l.flag}</span>
                            <span>{l.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-mono font-black uppercase ${isSelected ? 'text-slate-950' : 'text-slate-400'}`}>
                              {l.code}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] text-slate-950 shrink-0" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Control Panel / Settings Gear Button */}
            {onOpenControlPanel && (
              <button
                onClick={onOpenControlPanel}
                className="p-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-400/40 rounded-2xl text-cyan-300 transition-all shadow-[0_0_12px_rgba(34,211,238,0.2)] cursor-pointer active:scale-95 shrink-0 flex items-center justify-center group"
                title={t('nav.settings')}
              >
                <Settings className="w-5 h-5 text-cyan-300 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
