import React, { useState } from 'react';
import { LUAU_SCRIPTS } from '../luauScripts';
import { LuauScript } from '../types';
import { Copy, Check, Download, Folder, FileCode, Terminal, Server, Smartphone, Layers, Search, Sparkles } from 'lucide-react';
import JSZip from 'jszip';
import saveAs from 'file-saver';

export const LuauCodeViewer: React.FC = () => {
  const [selectedScript, setSelectedScript] = useState<LuauScript>(LUAU_SCRIPTS[0]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadSingle = (script: LuauScript) => {
    const blob = new Blob([script.code], { type: 'text/plain;charset=utf-8' });
    const fileName = script.name.endsWith('.luau') ? script.name : `${script.name}.luau`;
    saveAs(blob, fileName);
  };

  const handleDownloadAllZip = () => {
    const zip = new JSZip();
    const folder = zip.folder('SobrecargaDigital_RobloxStudio');

    LUAU_SCRIPTS.forEach((s) => {
      folder?.file(s.path, s.code);
    });

    zip.generateAsync({ type: 'blob' }).then((content) => {
      saveAs(content, 'SobrecargaDigital_LuauScripts.zip');
    });
  };

  const filteredScripts = LUAU_SCRIPTS.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'ReplicatedStorage':
        return <Layers className="w-4 h-4 text-cyan-400" />;
      case 'ServerScriptService':
        return <Server className="w-4 h-4 text-emerald-400" />;
      case 'StarterPlayerScripts':
        return <Smartphone className="w-4 h-4 text-blue-400" />;
      case 'StarterGui':
        return <Terminal className="w-4 h-4 text-amber-400" />;
      default:
        return <Folder className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[32px] p-4 sm:p-6 shadow-2xl min-h-[680px]">
      {/* --- SIDEBAR: ROBLOX STUDIO HIERARCHY TREE --- */}
      <div className="w-full lg:w-80 flex flex-col gap-4 border-r border-white/10 pr-0 lg:pr-6 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-sm tracking-wide">Roblox Explorer</h3>
          </div>
          <button
            onClick={handleDownloadAllZip}
            className="text-[11px] bg-cyan-400/20 hover:bg-cyan-400/30 text-cyan-300 border border-cyan-400/40 px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 uppercase tracking-wider shadow-[0_0_15px_rgba(34,211,238,0.2)]"
            title="Baixar todos os scripts compactados em .zip"
          >
            <Download className="w-3.5 h-3.5" /> Baixar ZIP
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-white/40" />
          <input
            type="text"
            placeholder="Buscar script ou serviço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-white/40 focus:outline-none focus:border-cyan-400 transition-all"
          />
        </div>

        {/* Script List Grouped by Service */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[520px]">
          {filteredScripts.map((script) => {
            const isSelected = selectedScript.id === script.id;
            return (
              <button
                key={script.id}
                onClick={() => setSelectedScript(script)}
                className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-3 group ${
                  isSelected
                    ? 'bg-cyan-400/20 border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                    : 'bg-black/30 border-white/5 hover:bg-white/10 text-slate-300'
                }`}
              >
                <div className="p-2 rounded-xl bg-black/40 border border-white/10 shrink-0">
                  {getServiceIcon(script.service)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs truncate group-hover:text-cyan-300">
                      {script.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-slate-400 shrink-0">
                      {script.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50 truncate mt-0.5">
                    {script.service}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* --- MAIN CODE DISPLAY & EDITOR PANEL --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-black/40 rounded-2xl border border-white/10 overflow-hidden">
        {/* Header Bar */}
        <div className="bg-black/60 border-b border-white/10 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <FileCode className="w-5 h-5 text-cyan-400" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-white text-sm">{selectedScript.name}</h2>
                <span className="text-[10px] bg-white/10 text-cyan-300 px-2 py-0.5 rounded-full border border-white/10 font-mono">
                  {selectedScript.service}
                </span>
              </div>
              <p className="text-xs text-white/60 mt-0.5">{selectedScript.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadSingle(selectedScript)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Baixar .luau
            </button>

            <button
              onClick={() => handleCopy(selectedScript.code, selectedScript.id)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border shadow-md ${
                copiedId === selectedScript.id
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-cyan-400/20 hover:bg-cyan-400/30 text-cyan-300 border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
              }`}
            >
              {copiedId === selectedScript.id ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copiar Luau
                </>
              )}
            </button>
          </div>
        </div>

        {/* Luau Code Viewport */}
        <div className="flex-1 p-4 sm:p-6 font-mono text-xs overflow-x-auto bg-black/60 text-slate-200 leading-relaxed max-h-[580px] overflow-y-auto">
          <pre className="whitespace-pre">
            <code>
              {selectedScript.code.split('\n').map((line, idx) => (
                <div key={idx} className="table-row">
                  <span className="table-cell text-right pr-4 select-none text-white/30 font-mono text-[11px] w-10">
                    {idx + 1}
                  </span>
                  <span className="table-cell">{line}</span>
                </div>
              ))}
            </code>
          </pre>
        </div>

        {/* Footer Hint */}
        <div className="bg-black/60 border-t border-white/10 px-4 py-2.5 text-[11px] text-white/50 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Padrão Luau v5.0 compatível com Roblox Studio 2026
          </span>
          <span>Caminho: <code className="text-cyan-300 font-mono">{selectedScript.path}</code></span>
        </div>
      </div>
    </div>
  );
};
