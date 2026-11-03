import React, { useState } from 'react';
import {
  X,
  Download,
  Monitor,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  Zap,
  Laptop,
  ArrowRight,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { playButtonClickSFX } from '../utils/audio';

interface WindowsInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled?: boolean;
}

export const WindowsInstallModal: React.FC<WindowsInstallModalProps> = ({
  isOpen,
  onClose,
  soundEnabled = true,
}) => {
  const { isInstallable, isInstalled, isWindows, promptInstall, downloadWindowsInstaller } = usePWAInstall();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [activeTab, setActiveTab] = useState<'pwa' | 'bat' | 'guide'>('pwa');

  if (!isOpen) return null;

  const copyAppUrl = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-[10010] bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#090d18] border-2 border-blue-500/50 rounded-[32px] shadow-[0_0_60px_rgba(59,130,246,0.25)] flex flex-col max-h-[92vh] overflow-hidden text-white my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Windows Blue Gradient Header Accent */}
        <div className="w-full h-2 bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600" />

        {/* Modal Top Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between gap-3 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-indigo-600 border border-blue-300/40 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-blue-500/20 shrink-0">
              <Monitor className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-300 bg-blue-950/80 border border-blue-400/40 px-2.5 py-0.5 rounded-full">
                  🪟 Windows 10 & 11 • PWA Native
                </span>
                {isWindows && (
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-400/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Windows Detectado
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-white mt-0.5">
                Instalar no Windows (Desktop App)
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

        {/* Sub-Header Tabs */}
        <div className="bg-slate-950 border-b border-white/10 px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'pwa'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4 text-cyan-300" />
            <span>1. Instalação PWA (1-Clique)</span>
          </button>

          <button
            onClick={() => setActiveTab('bat')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'bat'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Download className="w-4 h-4 text-emerald-300" />
            <span>2. Criador de Atalho (.BAT)</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-amber-300" />
            <span>3. Passo a Passo Manual</span>
          </button>
        </div>

        {/* Modal Main Content Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5">

          {/* TAB 1: PWA DIRECT INSTALLATION */}
          {activeTab === 'pwa' && (
            <div className="space-y-4">
              <div className="bg-slate-900/90 border-2 border-blue-400/40 rounded-3xl p-5 space-y-4 shadow-xl relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
                    <Laptop className="w-5 h-5 text-cyan-300" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      Instalar como Aplicativo Nativo no Windows
                    </h3>
                    <p className="text-xs text-slate-300">
                      O PWA instala o jogo na sua **Área de Trabalho**, no **Menu Iniciar** e na **Barra de Tarefas do Windows**.
                    </p>
                  </div>
                </div>

                {isInstalled ? (
                  <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl flex items-center gap-3">
                    <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-sm font-black text-emerald-200 block">
                        Jogo Já Instalado no Windows!
                      </span>
                      <span className="text-xs text-emerald-300/80">
                        Você já está rodando em modo aplicativo nativo com aceleração de GPU e janela limpa.
                      </span>
                    </div>
                  </div>
                ) : isInstallable ? (
                  <button
                    onClick={promptInstall}
                    className="w-full py-3.5 px-5 bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 hover:from-blue-400 hover:to-emerald-300 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/20 transition-all transform hover:scale-102 cursor-pointer"
                  >
                    <Download className="w-5 h-5 fill-slate-950" />
                    <span>Instalar Sobrecarga Digital no Windows Agora</span>
                  </button>
                ) : (
                  <div className="p-4 bg-slate-950/80 border border-amber-400/30 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Instalação PWA via Navegador no Windows</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Se o botão automático não aparecer acima, você pode instalar em 2 cliques pelo seu navegador (Microsoft Edge, Chrome, Brave ou Opera):
                    </p>
                    <div className="p-3 bg-slate-900 border border-white/10 rounded-xl text-xs font-mono text-cyan-200">
                      Edge/Chrome ➔ Clique nos "..." do topo do navegador ➔ "Aplicativos" ➔ "Instalar este site como aplicativo".
                    </div>
                  </div>
                )}

                {/* Benefits Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Sem barras de abas ou navegação do browser</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Desempenho 60 FPS com aceleração GPU</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Monitor className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Ícone na Área de Trabalho e Menu Iniciar</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Alternância rápida de janela via Alt + Tab</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WINDOWS BAT SHORTCUT CREATOR */}
          {activeTab === 'bat' && (
            <div className="space-y-4">
              <div className="bg-slate-900/90 border-2 border-emerald-400/40 rounded-3xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                    <Download className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      Gerador de Atalho de Área de Trabalho (.BAT para Windows)
                    </h3>
                    <p className="text-xs text-slate-300">
                      Crie um instalador oficial para gerar o atalho direto na sua Área de Trabalho do Windows.
                    </p>
                  </div>
                </div>

                <button
                  onClick={downloadWindowsInstaller}
                  className="w-full py-3.5 px-5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 transition-all transform hover:scale-102 cursor-pointer"
                >
                  <Download className="w-5 h-5 fill-slate-950" />
                  <span>Baixar Criador de Atalho Windows (.BAT)</span>
                </button>

                {/* Instructions steps */}
                <div className="space-y-2.5 pt-2 border-t border-white/10">
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-300">
                    Como executar o arquivo no Windows:
                  </h4>
                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex items-start gap-2.5 p-2.5 bg-slate-950 border border-white/5 rounded-xl">
                      <span className="w-5 h-5 rounded-full bg-emerald-400 text-slate-950 font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        1
                      </span>
                      <span>
                        Clique no botão acima e salve o arquivo <strong className="text-white">Instalar_Sobrecarga_Digital_Windows.bat</strong>.
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5 p-2.5 bg-slate-950 border border-white/5 rounded-xl">
                      <span className="w-5 h-5 rounded-full bg-emerald-400 text-slate-950 font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        2
                      </span>
                      <span>
                        Abra sua pasta <strong className="text-white">Downloads</strong> e dê dois cliques no arquivo <strong className="text-white">Instalar_Sobrecarga_Digital_Windows.bat</strong>.
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5 p-2.5 bg-slate-950 border border-white/5 rounded-xl">
                      <span className="w-5 h-5 rounded-full bg-emerald-400 text-slate-950 font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        3
                      </span>
                      <span>
                        Pronto! Um atalho chamado <strong className="text-cyan-300">"Sobrecarga Digital - Jogo 3D"</strong> será criado na sua Área de Trabalho do Windows!
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STEP-BY-STEP MANUAL GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="bg-slate-900/90 border-2 border-amber-400/40 rounded-3xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
                    <HelpCircle className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      Guia Ilustrado para Microsoft Edge & Google Chrome
                    </h3>
                    <p className="text-xs text-slate-300">
                      Siga o passo a passo nativo do seu navegador preferido no Windows 10 e Windows 11.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Edge Guide Card */}
                  <div className="p-4 bg-slate-950 border border-cyan-400/30 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black uppercase text-cyan-300">
                      <Monitor className="w-4 h-4 text-cyan-400" />
                      <span>Microsoft Edge (Windows)</span>
                    </div>
                    <ol className="text-xs text-slate-300 space-y-1.5 list-decimal pl-4">
                      <li>Clique no ícone de 3 pontos (<strong className="text-white">...</strong>) no canto superior direito.</li>
                      <li>Passe o mouse sobre <strong className="text-white">Aplicativos (Apps)</strong>.</li>
                      <li>Clique em <strong className="text-cyan-300">"Instalar este site como aplicativo"</strong>.</li>
                      <li>Marque as caixas para fixar na Barra de Tarefas e Iniciar.</li>
                    </ol>
                  </div>

                  {/* Chrome Guide Card */}
                  <div className="p-4 bg-slate-950 border border-amber-400/30 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black uppercase text-amber-300">
                      <Monitor className="w-4 h-4 text-amber-400" />
                      <span>Google Chrome (Windows)</span>
                    </div>
                    <ol className="text-xs text-slate-300 space-y-1.5 list-decimal pl-4">
                      <li>Clique no menu de 3 pontos (<strong className="text-white">⋮</strong>) no topo.</li>
                      <li>Selecione <strong className="text-white">Salvar e Compartilhar</strong> ou <strong className="text-white">Mais Ferramentas</strong>.</li>
                      <li>Clique em <strong className="text-amber-300">"Instalar Sobrecarga Digital"</strong> ou "Criar atalho".</li>
                      <li>Marque a opção <strong className="text-white">"Abrir como janela"</strong>.</li>
                    </ol>
                  </div>
                </div>

                {/* Copy URL Section */}
                <div className="p-3.5 bg-slate-950/80 border border-white/10 rounded-2xl flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-slate-200">
                      Link do Jogo para Compartilhar no Windows:
                    </span>
                  </div>

                  <button
                    onClick={copyAppUrl}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-bold text-cyan-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-cyan-300" />
                    <span>{copiedUrl ? 'Link Copiado!' : 'Copiar URL'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400 font-mono">
            Windows 10 / 11 • PWA Compliant • 60 FPS GPU
          </span>

          <button
            onClick={() => {
              playButtonClickSFX(soundEnabled);
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
