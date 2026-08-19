import React, { useState } from 'react';
import { Copy, Check, Terminal, FolderPlus, Play, Layers, Sparkles, HelpCircle } from 'lucide-react';
import { LUAU_SCRIPTS } from '../luauScripts';

export const RobloxSetupGuide: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const commandScript = LUAU_SCRIPTS.find((s) => s.id === 'studio_installer')?.code || '';

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(commandScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[32px] p-6 sm:p-8 shadow-2xl space-y-8 text-white">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div>
          <span className="text-[10px] font-black text-cyan-300 uppercase tracking-[0.3em] bg-cyan-400/20 border border-cyan-400/30 px-3 py-1 rounded-full">
            Guia de Configuração
          </span>
          <h2 className="text-2xl sm:text-3xl font-light text-white mt-2">
            MONTAGEM E ESTRUTURAÇÃO DO <span className="font-bold text-cyan-400">PROJETO</span>
          </h2>
          <p className="text-xs text-white/60 mt-1">
            Instruções completas para estruturar o projeto "Sobrecarga Digital".
          </p>
        </div>
      </div>

      {/* Quick Automated Command Bar Setup */}
      <div className="bg-black/40 border border-cyan-400/30 p-6 rounded-2xl shadow-xl space-y-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">
              Método 1: Instalação Automática via Command Bar (1 Clique)
            </h3>
          </div>
          <button
            onClick={handleCopyCommand}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border shadow-md ${
              copied
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-cyan-400/20 hover:bg-cyan-400/30 text-cyan-300 border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiado para Área de Transferência!' : 'Copiar Script de Instalação'}
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Abra o Roblox Studio no seu projeto. No menu superior, vá em <strong className="text-cyan-300">View → Command Bar</strong>. Cole o script abaixo na barra de comandos e pressione <strong className="text-cyan-400">ENTER</strong>. Ele criará todas as pastas, RemoteEvents, Gui ScreenGuis com UICorner e templates de assets automaticamente!
        </p>

        <div className="bg-black/60 p-4 rounded-xl border border-white/10 font-mono text-xs text-slate-300 max-h-40 overflow-y-auto">
          <pre>{commandScript}</pre>
        </div>
      </div>

      {/* Manual Step by Step Hierarchy */}
      <div className="space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2 uppercase tracking-wider">
          <FolderPlus className="w-5 h-5 text-amber-400" /> Método 2: Organização Manual dos Serviços e Scripts
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Step 1: ReplicatedStorage */}
          <div className="bg-black/40 p-5 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <Layers className="w-4 h-4" /> 1. ReplicatedStorage
            </div>
            <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
              <li>
                Crie uma pasta chamada <code className="text-cyan-300 font-mono">Events</code>. Adicione os RemoteEvents:
                <div className="flex flex-wrap gap-1 mt-1.5 font-mono text-[10px]">
                  <span className="bg-white/10 border border-white/10 px-2 py-0.5 rounded text-amber-300">SASAnswerEvent</span>
                  <span className="bg-white/10 border border-white/10 px-2 py-0.5 rounded text-amber-300">ToggleZenMode</span>
                  <span className="bg-white/10 border border-white/10 px-2 py-0.5 rounded text-amber-300">EndGameEvent</span>
                  <span className="bg-white/10 border border-white/10 px-2 py-0.5 rounded text-amber-300">OpenSASModal</span>
                  <span className="bg-white/10 border border-white/10 px-2 py-0.5 rounded text-amber-300">PlaySpecialAnim</span>
                </div>
              </li>
              <li>
                Crie uma pasta chamada <code className="text-cyan-300 font-mono">Assets</code> com os modelos 3D dos objetos caindo:
                <span className="block font-mono text-[11px] text-white/50 mt-1">Feed, Like, Wifi, Geometric, Coffee, Book</span>
              </li>
            </ul>
          </div>

          {/* Step 2: ServerScriptService */}
          <div className="bg-black/40 p-5 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Terminal className="w-4 h-4" /> 2. ServerScriptService
            </div>
            <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
              <li>
                Adicione o <strong className="text-white">Script</strong>: <code className="text-emerald-300 font-mono">GameManager</code> (Server Script).
              </li>
              <li>
                Adicione o <strong className="text-white">Script</strong>: <code className="text-emerald-300 font-mono">SASNarrativeSystem</code> (Server Script).
              </li>
              <li>Estes scripts rodam no servidor e gerenciam a lógica dos 60 segundos, spawn, física e perguntas.</li>
            </ul>
          </div>

          {/* Step 3: StarterPlayer */}
          <div className="bg-black/40 p-5 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
              <Play className="w-4 h-4" /> 3. StarterPlayer → StarterPlayerScripts
            </div>
            <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
              <li>
                Adicione o <strong className="text-white">LocalScript</strong>: <code className="text-blue-300 font-mono">PlayerController</code>.
              </li>
              <li>Trata a movimentação no eixo X (A/D, Setas e Gamepad) e animações R15 do avatar.</li>
            </ul>
          </div>

          {/* Step 4: StarterGui */}
          <div className="bg-black/40 p-5 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Sparkles className="w-4 h-4" /> 4. StarterGui
            </div>
            <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
              <li><code className="text-amber-300 font-mono">HUDGui</code> + LocalScript <code className="text-amber-200 font-mono">HUDController</code></li>
              <li><code className="text-amber-300 font-mono">SASModalGui</code> + LocalScript <code className="text-amber-200 font-mono">SASModalController</code></li>
              <li><code className="text-amber-300 font-mono">ZenBannerGui</code> + LocalScript <code className="text-amber-200 font-mono">ZenBannerController</code></li>
              <li><code className="text-amber-300 font-mono">EndScreenGui</code> + LocalScript <code className="text-amber-200 font-mono">EndScreenController</code></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Studio Lighting & Test Tips */}
      <div className="bg-black/40 p-5 rounded-2xl border border-white/10 space-y-3">
        <h4 className="font-bold text-sm text-white flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-cyan-400" /> Configurações de Iluminação e Teste no Roblox Studio
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="bg-black/60 p-3.5 rounded-xl border border-white/10">
            <strong className="text-cyan-400 block mb-1 uppercase tracking-wider text-[10px]">Lighting Technology</strong>
            Defina a propriedade <code className="text-white">Technology</code> como <strong>Future</strong> para sombras e iluminação cinematográfica.
          </div>
          <div className="bg-black/60 p-3.5 rounded-xl border border-white/10">
            <strong className="text-cyan-400 block mb-1 uppercase tracking-wider text-[10px]">BlurEffect</strong>
            Certifique-se de que o <code className="text-white">Lighting</code> possui autorização para criar efeitos de Blur temporários durante os marcos SAS.
          </div>
          <div className="bg-black/60 p-3.5 rounded-xl border border-white/10">
            <strong className="text-cyan-400 block mb-1 uppercase tracking-wider text-[10px]">Teste Gamepad</strong>
            No Roblox Studio, pressione <code className="text-white">F5</code> para Play Test. Você pode conectar um controle de Xbox/PlayStation via USB ou Bluetooth.
          </div>
        </div>
      </div>
    </div>
  );
};
