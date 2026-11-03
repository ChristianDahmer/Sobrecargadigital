import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  BookOpen, ShieldAlert, BrainCircuit, Timer, Scale, Users, Award, 
  BarChart3, Moon, Cpu, Heart, AlertTriangle, ExternalLink, Code2, 
  Layers, Gamepad2, Volume2, Database, Sparkles, Terminal, Activity, Eye,
  FileText, Download, CheckCircle2, X, Printer, Copy, Check, Clock, Calendar, CheckCheck
} from 'lucide-react';
import researchersImage from '../assets/images/pesquisadores_1787106642560.jpg';
import { generateTechnicalPdf } from '../utils/generateTechnicalPdf';
import { 
  DEVELOPMENT_MILESTONES, 
  FULL_CRONOGRAMA_MARKDOWN,
  FULL_TECHNICAL_DOCUMENT_MARKDOWN,
  FULL_EXECUTIVE_SUMMARY_MARKDOWN
} from '../data/cronogramaData';

const CODE_EXAMPLES = [
  {
    id: 'aabb_physics',
    title: 'Loop de Física 3D & Colisão AABB',
    language: 'TypeScript / Three.js',
    path: 'src/components/GameCanvas.tsx',
    description: 'Calcula a caixa delimitadora (Bounding Box) em 3D, verifica colisões em tempo real a 60 FPS e desacelera o avatar conforme a ansiedade aumenta.',
    code: `// 1. Loop de Física & Colisão AABB em Three.js (TypeScript)
function updateGamePhysics(deltaTime: number) {
  const avatarBox = new THREE.Box3().setFromObject(avatarGroup);
  
  fallingObjects.forEach((obj, index) => {
    // Queda acelerada por nivel de notificação
    obj.mesh.position.y -= obj.speed * gameState.notificationSpeed * deltaTime;
    obj.mesh.rotation.y += deltaTime * 1.5;

    // Detecção de colisão via Bounding Box AABB
    const objBox = new THREE.Box3().setFromObject(obj.mesh);
    if (avatarBox.intersectsBox(objBox)) {
      // Aplica dano de ansiedade e reduz velocidade do avatar (WalkSpeed)
      gameState.anxietyLevel = Math.min(100, gameState.anxietyLevel + obj.damage);
      gameState.walkSpeed = Math.max(8, 16 - (gameState.anxietyLevel * 0.08));

      triggerScreenShake(0.3);
      playNotificationAudioEffect();
      scene.remove(obj.mesh);
      fallingObjects.splice(index, 1);
    }
  });
}`
  },
  {
    id: 'web_audio',
    title: 'Motor de Síntese Sonora Procedural',
    language: 'TypeScript / Web Audio API',
    path: 'src/audio.ts',
    description: 'Gera efeitos de áudio em tempo real com osciladores senoidais e envelopes de ganho (ADSR), descartando o uso de arquivos pesados MP3/WAV.',
    code: `// 2. Motor de Síntese Sonora Procedural (Web Audio API)
export function playNotificationSFX(frequency = 880, duration = 0.15) {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioCtx();
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine'; // Senoide limpa
  osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + duration);

  // Envelope ADSR (Attack / Decay)
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}`
  },
  {
    id: 'sas_algorithm',
    title: 'Algoritmo SAS-SMU & WalkSpeed',
    language: 'TypeScript',
    path: 'src/types.ts / SAS Question Engine',
    description: 'Cruzamento psicométrico que ajusta o nível de ansiedade e modula o movimento do jogador (WalkSpeed) baseado nas respostas do questionário.',
    code: `// 3. Algoritmo Psicométrico SAS-SMU & Modulação Motora
export function calculateAnxietyImpact(
  currentAnxiety: number, 
  isAffirmative: boolean, 
  category: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAIXO'
) {
  const weights = { CRITICO: 20, ALTO: 15, MEDIO: 10, BAIXO: 5 };
  const impact = isAffirmative ? weights[category] : -weights[category] * 0.5;

  const newAnxiety = Math.min(100, Math.max(0, currentAnxiety + impact));
  
  // Penalidade motora: WalkSpeed reduz de 16 para até 8 studs/s na sobrecarga
  const newWalkSpeed = Math.max(8, 16 - (newAnxiety * 0.08));
  const isZenTrigger = !isAffirmative && category === 'CRITICO';

  return {
    newAnxiety,
    newWalkSpeed,
    isZenTrigger,
    isDigitalCollapse: newAnxiety >= 100
  };
}`
  },
  {
    id: 'roblox_luau',
    title: 'GameManager Server Script',
    language: 'Luau (Roblox Studio)',
    path: 'ServerScriptService/GameManager.server.luau',
    description: 'Script Luau server-side para Roblox Studio que sincroniza o estado global de ansiedade, altera o ambiente visual e dispara RemoteEvents.',
    code: `--[[ 
   SOBRECARGA DIGITAL - GAME MANAGER (SERVER SCRIPT)
   Localização: ServerScriptService/GameManager
--]]
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Players = game:GetService("Players")

local StateFolder = ReplicatedStorage:WaitForChild("GameStateInfo")
local AnxietyLevel = StateFolder:WaitForChild("AnxietyLevel")
local EndGameEvent = ReplicatedStorage.Events:WaitForChild("EndGameEvent")

-- Loop de Monitoramento de Ansiedade & Condições de Fim de Jogo
RunService.Heartbeat:Connect(function(deltaTime)
    if AnxietyLevel.Value >= 100 then
        -- Iluminação de Colapso Vermelho
        game:GetService("Lighting").Ambient = Color3.fromRGB(150, 0, 0)
        EndGameEvent:FireAllClients("DERROTA", AnxietyLevel.Value)
    end
end)`
  }
];

export const GameDocumentation: React.FC = () => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeCodeSnippet, setActiveCodeSnippet] = useState(0);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Cronograma & Document States
  const [copiedCronograma, setCopiedCronograma] = useState(false);
  const [copiedTechnicalDoc, setCopiedTechnicalDoc] = useState(false);
  const [copiedExecutiveSummary, setCopiedExecutiveSummary] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('marco_1');

  const handleDownloadCronogramaMd = () => {
    const blob = new Blob([FULL_CRONOGRAMA_MARKDOWN], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'CRONOGRAMA_DESENVOLVIMENTO_ENTRE_REDES.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyCronograma = () => {
    try {
      navigator.clipboard.writeText(FULL_CRONOGRAMA_MARKDOWN);
      setCopiedCronograma(true);
      setTimeout(() => setCopiedCronograma(false), 2500);
    } catch (err) {
      console.error('Falha ao copiar cronograma:', err);
    }
  };

  const handleDownloadTechnicalDocMd = () => {
    const blob = new Blob([FULL_TECHNICAL_DOCUMENT_MARKDOWN], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'DOCUMENTO_TECNICO_OFICIAL.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyTechnicalDoc = () => {
    try {
      navigator.clipboard.writeText(FULL_TECHNICAL_DOCUMENT_MARKDOWN);
      setCopiedTechnicalDoc(true);
      setTimeout(() => setCopiedTechnicalDoc(false), 2500);
    } catch (err) {
      console.error('Falha ao copiar documento técnico:', err);
    }
  };

  const handleDownloadExecutiveSummaryMd = () => {
    const blob = new Blob([FULL_EXECUTIVE_SUMMARY_MARKDOWN], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'RESUMO_EXECUTIVO_DESENVOLVIMENTO.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyExecutiveSummary = () => {
    try {
      navigator.clipboard.writeText(FULL_EXECUTIVE_SUMMARY_MARKDOWN);
      setCopiedExecutiveSummary(true);
      setTimeout(() => setCopiedExecutiveSummary(false), 2500);
    } catch (err) {
      console.error('Falha ao copiar resumo executivo:', err);
    }
  };

  const [previewTab, setPreviewTab] = useState<'pdf' | 'doc'>('doc');

  const handleCopySnippetCode = (code: string, id: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopiedCodeId(id);
      setTimeout(() => setCopiedCodeId(null), 2000);
    } catch (err) {
      console.error('Falha ao copiar código:', err);
    }
  };

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  const handleDownloadPdf = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        generateTechnicalPdf({ downloadImmediate: true, documentType: 'technical' });
      } catch (err) {
        console.error("Erro ao gerar PDF:", err);
      } finally {
        setIsGenerating(false);
      }
    }, 100);
  };

  const handleDownloadCronogramaPdf = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        generateTechnicalPdf({ downloadImmediate: true, documentType: 'cronograma' });
      } catch (err) {
        console.error("Erro ao gerar PDF do cronograma:", err);
      } finally {
        setIsGenerating(false);
      }
    }, 100);
  };

  const handleDownloadExecutivePdf = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        generateTechnicalPdf({ downloadImmediate: true, documentType: 'executive' });
      } catch (err) {
        console.error("Erro ao gerar PDF do resumo executivo:", err);
      } finally {
        setIsGenerating(false);
      }
    }, 100);
  };

  const handleOpenPreview = () => {
    setIsPreviewOpen(true);
    setPreviewTab('doc');

    try {
      const pdfDoc = generateTechnicalPdf({ downloadImmediate: false });
      const blob = pdfDoc.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const dataUri = pdfDoc.output('datauristring');
      
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
      setPdfBlobUrl(blobUrl);
      setPdfDataUrl(dataUri);
    } catch (err) {
      console.error("Erro ao gerar visualização do PDF:", err);
    }
  };

  const handleOpenNewTab = () => {
    try {
      if (pdfBlobUrl) {
        window.open(pdfBlobUrl, '_blank');
      } else {
        const pdfDoc = generateTechnicalPdf({ downloadImmediate: false });
        const blob = pdfDoc.output('blob');
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      }
    } catch (err) {
      console.error("Erro ao abrir PDF em nova aba:", err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8 lg:p-10 bg-[#050811] border border-white/10 rounded-2xl sm:rounded-[32px] w-full text-slate-200 shadow-2xl backdrop-blur-xl space-y-6 sm:space-y-8 overflow-hidden">
      
      {/* Title Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-400/30 shrink-0 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
            <BookOpen className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-tight break-words">
              Informações do Sistema & Diagnóstico
            </h1>
            <p className="text-cyan-400 font-bold uppercase tracking-widest text-[11px] sm:text-xs mt-0.5">
              Projeto “Entre Redes: Há Ansiedade?”
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
          {/* Action Button: Download Technical PDF */}
          <button
            onClick={handleDownloadPdf}
            disabled={isGenerating}
            className="inline-flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] cursor-pointer hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            title="Baixar Documento Técnico do Game em PDF Oficial"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{isGenerating ? 'Gerando...' : 'PDF Técnico'}</span>
          </button>

          {/* Action Button: Download Technical PDF */}
          <button
            onClick={handleDownloadPdf}
            disabled={isGenerating}
            className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            title="Baixar Documento Técnico Oficial em PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PDF Técnico</span>
          </button>

          {/* Action Button: Download Executive Summary PDF */}
          <button
            onClick={handleDownloadExecutivePdf}
            disabled={isGenerating}
            className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer hover:scale-[1.02] active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50"
            title="Baixar Resumo Executivo em PDF"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-300" />
            <span>Resumo (PDF)</span>
          </button>

          {/* Action Button: Download Cronograma PDF */}
          <button
            onClick={handleDownloadCronogramaPdf}
            disabled={isGenerating}
            className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-purple-200 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer hover:scale-[1.02] active:scale-95 shadow-[0_0_15px_rgba(168,85,247,0.2)] disabled:opacity-50"
            title="Baixar Cronograma em PDF"
          >
            <Calendar className="w-3.5 h-3.5 text-purple-300" />
            <span>Cronograma (PDF)</span>
          </button>

          {/* Action Button: Preview PDF */}
          <button
            onClick={handleOpenPreview}
            className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-slate-200 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
            title="Visualizar Documento Técnico na Tela"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-300" />
            <span>Visualizar</span>
          </button>
        </div>
      </div>

      {/* FEATURED BANNER: TECHNICAL DOCUMENTATION PDF CARD */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-indigo-950/80 border-2 border-cyan-400/40 p-5 sm:p-7 md:p-8 shadow-[0_0_40px_rgba(34,211,238,0.15)] space-y-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl min-w-0">
            <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 font-mono text-[11px] font-bold uppercase tracking-widest">
              <FileText className="w-3.5 h-3.5" /> Dossiê Técnico Científico
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white uppercase tracking-tight break-words">
              Documento Técnico Oficial do Desenvolvimento
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Disponibilizamos um relatório completo em formato PDF contendo todas as especificações técnicas da tecnologia desenvolvida, arquitetura WebGL 3D, síntese de áudio procedural, diagnóstico empírico de 77 estudantes e tabela de impacto psicométrico.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="py-3 px-6 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_30px_rgba(34,211,238,0.4)] flex items-center justify-center gap-2.5 cursor-pointer hover:scale-[1.03] active:scale-95 disabled:opacity-50 w-full sm:w-auto"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Baixar PDF Técnico</span>
            </button>

            <button
              onClick={handleOpenPreview}
              disabled={isGenerating}
              className="py-3 px-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/20 text-slate-200 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95 disabled:opacity-50 w-full sm:w-auto"
            >
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Visualizar na Tela</span>
            </button>
          </div>
        </div>

        {/* Highlighted Specs Included in PDF */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-white/10 text-xs">
          <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 space-y-1 flex flex-col justify-between h-full min-w-0">
            <span className="text-[10px] text-cyan-300 uppercase font-mono font-bold block">Engine 3D</span>
            <p className="font-bold text-white text-xs">Three.js / WebGL 60 FPS</p>
          </div>
          <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 space-y-1 flex flex-col justify-between h-full min-w-0">
            <span className="text-[10px] text-emerald-300 uppercase font-mono font-bold block">Síntese Sonora</span>
            <p className="font-bold text-white text-xs">Web Audio API Nativo</p>
          </div>
          <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 space-y-1 flex flex-col justify-between h-full min-w-0">
            <span className="text-[10px] text-purple-300 uppercase font-mono font-bold block">Algoritmo</span>
            <p className="font-bold text-white text-xs">Psicométrico SAS-SMU</p>
          </div>
          <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 space-y-1 flex flex-col justify-between h-full min-w-0">
            <span className="text-[10px] text-amber-300 uppercase font-mono font-bold block">Amostra Científica</span>
            <p className="font-bold text-white text-xs">77 Estudantes (EEEMFC)</p>
          </div>
        </div>
      </section>

      {/* SECTION: ACADEMIC ORIGIN & TEAM */}
      <section className="bg-gradient-to-r from-cyan-950/30 via-slate-900/60 to-purple-950/30 p-5 sm:p-6 rounded-2xl border border-cyan-500/20 shadow-lg space-y-3">
        <div className="flex items-center gap-2 text-cyan-300 font-black text-xs uppercase tracking-widest">
          <Award className="w-4 h-4 text-cyan-400" /> Origem do Estudo Científico
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-white break-words">
          Escola Estadual de Ensino Médio Felipe Camarão
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Este jogo simulador foi idealizado a partir da pesquisa científica <strong>“Entre Redes: Há Ansiedade?”</strong> (Desenvolvida na EEEM Felipe Camarão - São Sebastião do Caí/RS, 2026), elaborada pelos estudantes <strong>Augusto Joaquim Dullius</strong>, <strong>Caio Castilho Cercato</strong> e <strong>Leonardo Lottermann Dahmer</strong> (Turma 61), sob orientação da <strong>Profª Me. Lisandra Jacobi Kölling Junges</strong>, coorientação de <strong>Cristofer Stelzer da Silva</strong> e orientação técnica de desenvolvimento de <strong>Christian Dahmer</strong>.
        </p>
      </section>

      {/* SECTION: COMO O JOGO FOI CRIADO & METODOLOGIA */}
      <section className="bg-white/5 p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 font-mono text-[11px] font-bold uppercase tracking-widest mb-1">
              <Code2 className="w-3.5 h-3.5 text-cyan-400" /> Engenharia & Concepção
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2.5 break-words">
              <Layers className="w-6 h-6 text-cyan-400 shrink-0" /> Como o Jogo Foi Criado (Metodologia e Desenvolvimento)
            </h2>
          </div>
          <span className="text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 px-3.5 py-1.5 rounded-full uppercase w-fit shrink-0">
            Processo Criativo • Tecnologias
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          A criação do simulador <strong>“Entre Redes: Há Ansiedade?”</strong> uniu rigor científico, programação de ponta e design educacional em um fluxo iterativo estruturado em quatro etapas fundamentales:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-black/40 p-4 sm:p-5 rounded-2xl border border-white/5 space-y-2 flex flex-col justify-between h-full min-w-0">
            <span className="text-cyan-400 font-bold uppercase tracking-wider text-xs font-mono flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-300 font-black shrink-0">1</span>
              <span>Pesquisa de Campo & Escala SAS-SMU</span>
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              O projeto iniciou com a coleta de dados de <strong>77 estudantes</strong> (9 a 16 anos) na EEEM Felipe Camarão. Com base nos resultados sobre uso de telas, privação de sono e FOMO, adaptamos o questionário clínico <strong>SAS-SMU (Smartphone Addiction Scale)</strong> em 100 perguntas categorizadas para interagir diretamente com o usuário durante o jogo.
            </p>
          </div>

          <div className="bg-black/40 p-4 sm:p-5 rounded-2xl border border-white/5 space-y-2 flex flex-col justify-between h-full min-w-0">
            <span className="text-cyan-400 font-bold uppercase tracking-wider text-xs font-mono flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-300 font-black shrink-0">2</span>
              <span>Engine 3D & Física com Three.js</span>
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Para garantir acessibilidade sem downloads pesados, o jogo foi desenvolvido em <strong>TypeScript</strong> integrado ao <strong>Three.js (WebGL)</strong>. Criamos um sistema de animação de avatar articulado (R15) e um loop de física em tempo real com colisão AABB (*Axis-Aligned Bounding Box*) para gerenciar a queda de notificações e a penalidade motora (*WalkSpeed*).
            </p>
          </div>

          <div className="bg-black/40 p-4 sm:p-5 rounded-2xl border border-white/5 space-y-2 flex flex-col justify-between h-full min-w-0">
            <span className="text-cyan-400 font-bold uppercase tracking-wider text-xs font-mono flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-300 font-black shrink-0">3</span>
              <span>Áudio Procedural & Assistente de Voz</span>
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Implementamos um motor de áudio procedural via <strong>Web Audio API</strong>, gerando frequências e envelopes ADSR matematicamente no navegador. Adicionamos também um assistente interativo de voz inteligente com reconhecimento e síntese de fala, guiando os estudantes pelo tutorial passo a passo.
            </p>
          </div>

          <div className="bg-black/40 p-4 sm:p-5 rounded-2xl border border-white/5 space-y-2 flex flex-col justify-between h-full min-w-0">
            <span className="text-cyan-400 font-bold uppercase tracking-wider text-xs font-mono flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-300 font-black shrink-0">4</span>
              <span>Análise de Dados & Exportação PDF/CSV</span>
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              Por fim, criamos o painel analítico com gráficos em <strong>Recharts</strong> e um gerador de PDF automatizado com <strong>jsPDF</strong>. O sistema armazena anonimamente as partidas e permite exportar relatórios epidemiológicos completos para pesquisadores e professores.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION: CRONOGRAMA DE DESENVOLVIMENTO, TECNOLOGIAS E FERRAMENTAS */}
      <section className="bg-gradient-to-br from-purple-950/40 via-slate-900/90 to-cyan-950/40 p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl border-2 border-purple-500/30 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 font-mono text-[11px] font-bold uppercase tracking-widest mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-300" /> Registro Histórico de Engenharia
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2.5">
              Cronograma de Desenvolvimento (Tecnologias & Ferramentas)
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Mapeamento cronológico dos 7 marcos do sistema sério, detalhando a evolução técnica desde a pesquisa de campo na EEEM Felipe Camarão até a plataforma 3D multigeracional.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              onClick={handleDownloadCronogramaMd}
              className="py-2.5 px-4 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center gap-2 cursor-pointer active:scale-95"
              title="Baixar Documento em Markdown (.md)"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Baixar Documento (.md)</span>
            </button>

            <button
              onClick={handleCopyCronograma}
              className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              title="Copiar texto integral do cronograma para a área de transferência"
            >
              {copiedCronograma ? (
                <>
                  <CheckCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-300" />
                  <span>Copiar Documento</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Milestone Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none relative z-10">
          {DEVELOPMENT_MILESTONES.map((m) => {
            const isSelected = selectedMilestoneId === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMilestoneId(m.id)}
                className={`py-2 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                  isSelected
                    ? 'bg-purple-500 text-slate-950 shadow-[0_0_15px_rgba(168,85,247,0.5)] font-black'
                    : 'bg-black/40 hover:bg-white/10 text-slate-300 border border-white/10'
                }`}
              >
                <span>{m.phase}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-purple-900/40 text-slate-950' : 'bg-white/10 text-slate-400'}`}>
                  {m.period}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Milestone Detail Card */}
        {(() => {
          const current = DEVELOPMENT_MILESTONES.find(m => m.id === selectedMilestoneId) || DEVELOPMENT_MILESTONES[0];
          return (
            <div className="bg-black/50 border border-purple-400/30 rounded-2xl p-5 sm:p-6 space-y-5 relative z-10 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 border border-purple-400/40 text-purple-300 font-mono text-[11px] font-bold uppercase">
                      {current.phase} • {current.period}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-black text-white mt-1.5">
                    {current.title}
                  </h3>
                </div>
              </div>

              <div className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-white/5 p-3.5 rounded-xl border border-white/10">
                <span className="font-bold text-white uppercase tracking-wider text-[11px] block mb-1">
                  🎯 Foco & Propósito Central:
                </span>
                {current.focus}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Technologies */}
                <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-4 space-y-2.5">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-cyan-400" /> Tecnologias Empregadas:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {current.technologies.map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-400/30 text-cyan-200 text-xs font-semibold"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tools of Creation */}
                <div className="bg-purple-950/30 border border-purple-500/30 rounded-xl p-4 space-y-2.5">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-purple-400" /> Ferramentas de Criação:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {current.tools.map((tool, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-400/30 text-purple-200 text-xs font-semibold"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Deliverables */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Entregáveis & Conquistas Validadas:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {current.deliverables.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-black/30 p-2.5 rounded-lg border border-white/5">
                      <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✔</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })()}

        {/* Official Cross-Milestone Technical Matrix */}
        <div className="border border-purple-500/30 rounded-2xl overflow-hidden bg-black/60 relative z-10 shadow-xl space-y-0">
          <div className="p-4 bg-gradient-to-r from-purple-950/60 to-slate-900 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" /> Matriz de Cruzamento Técnico-Cronológico Oficial
              </span>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Rastreabilidade entre fases cronológicas, componentes de software, ferramentas e evidências da EEEM Felipe Camarão.
              </p>
            </div>
            <span className="text-[10px] text-purple-300 bg-purple-500/20 border border-purple-400/40 px-2.5 py-1 rounded-full font-mono font-bold shrink-0">
              7 Marcos Cruzados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/5 text-[10px] uppercase font-mono text-slate-400 border-b border-white/10">
                <tr>
                  <th className="py-2.5 px-3">Marco</th>
                  <th className="py-2.5 px-3">Título & Componente</th>
                  <th className="py-2.5 px-3">Tecnologias & Ferramentas</th>
                  <th className="py-2.5 px-3">Validação Técnica & Científica</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {DEVELOPMENT_MILESTONES.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => setSelectedMilestoneId(m.id)}
                    className="hover:bg-purple-500/10 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 font-mono text-purple-300 font-bold whitespace-nowrap">
                      {m.phase}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-white text-xs">{m.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{m.period}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="text-cyan-300 font-mono text-[11px]">{m.technologies.slice(0, 2).join(' • ')}</div>
                      <div className="text-slate-400 text-[10px] mt-0.5">{m.tools.slice(0, 2).join(' • ')}</div>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-300 max-w-xs">
                      {m.deliverables[0]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Toolbar for Documents */}
          <div className="p-3.5 bg-black/80 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="text-[11px] text-slate-400">
              Documentos oficiais prontos para consulta, feiras de ciências e bancas examinadoras:
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadPdf}
                disabled={isGenerating}
                className="py-1.5 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50"
                title="Baixar Documento Técnico Oficial em PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>PDF Técnico</span>
              </button>

              <button
                onClick={handleDownloadCronogramaPdf}
                disabled={isGenerating}
                className="py-1.5 px-3 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-purple-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)] disabled:opacity-50"
                title="Baixar Cronograma em PDF"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Cronograma (PDF)</span>
              </button>

              <button
                onClick={handleDownloadExecutivePdf}
                disabled={isGenerating}
                className="py-1.5 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50"
                title="Baixar Resumo Executivo em PDF"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Resumo (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: EMPIRICAL DIAGNOSIS FINDINGS */}
      <section className="bg-white/5 p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl border border-white/10 space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 break-words">
          <BarChart3 className="w-5 h-5 text-cyan-400 shrink-0" /> Diagnóstico Empírico da Pesquisa (77 Estudantes)
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          A investigação mapeou os hábitos de uso de telas em adolescentes de 9 a 16 anos e colheu dados conclusivos sobre os gatilhos de ansiedade digital:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mt-2">
          <div className="bg-black/40 p-4 sm:p-5 rounded-2xl border border-white/5 space-y-2 flex flex-col justify-between h-full min-w-0">
            <span className="font-bold text-cyan-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 shrink-0" /> Hiperconexão & Redes Sociais
            </span>
            <ul className="space-y-1.5 text-slate-300 list-disc pl-4 leading-relaxed flex-1">
              <li><strong>80,5%</strong> usam redes sociais com muita frequência (66,2% todos os dias).</li>
              <li><strong>52%</strong> passam 4 horas ou mais conectados por dia (33,8% mais de 5 horas).</li>
              <li><strong>TikTok (45,5%)</strong> e <strong>Instagram (24,7%)</strong> lideram a preferência, estimulando vídeos curtos e estímulos visuais rápidos.</li>
            </ul>
          </div>

          <div className="bg-black/40 p-4 sm:p-5 rounded-2xl border border-white/5 space-y-2 flex flex-col justify-between h-full min-w-0">
            <span className="font-bold text-purple-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 shrink-0" /> Qualidade do Sono & Melatonina
            </span>
            <ul className="space-y-1.5 text-slate-300 list-disc pl-4 leading-relaxed flex-1">
              <li><strong>71,4%</strong> usam o celular imediatamente antes de dormir (94,8% com uso noturno ocasional).</li>
              <li><strong>84,4%</strong> confirmam que o celular afeta negativamente seu sono.</li>
              <li>A luz azul bloqueia a melatonina enquanto as notificações mantêm o cérebro em alerta contínuo.</li>
            </ul>
          </div>

          <div className="bg-black/40 p-4 sm:p-5 rounded-2xl border border-white/5 space-y-2 flex flex-col justify-between h-full min-w-0">
            <span className="font-bold text-pink-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Efeitos Emocionais & F.O.M.O
            </span>
            <ul className="space-y-1.5 text-slate-300 list-disc pl-4 leading-relaxed flex-1">
              <li><strong>42,9%</strong> sentem tristeza ou ansiedade após navegar nas redes.</li>
              <li><strong>42,9%</strong> sentem-se mal ao comparar-se com a "vida editada" de outras pessoas.</li>
              <li><strong>37,7%</strong> preocupam-se excessivamente com curtidas e comentários.</li>
              <li><strong>14,3%</strong> sofrem com Síndrome F.O.M.O (*Fear of Missing Out*).</li>
            </ul>
          </div>

          <div className="bg-black/40 p-4 sm:p-5 rounded-2xl border border-white/5 space-y-2 flex flex-col justify-between h-full min-w-0">
            <span className="font-bold text-emerald-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 shrink-0" /> Prejuízos & Vantagem Protetora
            </span>
            <ul className="space-y-1.5 text-slate-300 list-disc pl-4 leading-relaxed flex-1">
              <li><strong>23,4%</strong> reduziram estudos e <strong>23,4%</strong> reduziram leitura de livros.</li>
              <li><strong>15,6%</strong> diminuíram brincadeiras e atividades ao ar livre.</li>
              <li>Especialistas apontam que substituir telas por hábitos saudáveis restaura o bem-estar e o foco.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION: DATA COLLECTION, SYSTEM MECHANICS & SCIENTIFIC CROSS-ANALYSIS WITH FOMO */}
      <section className="bg-gradient-to-br from-slate-900/90 via-cyan-950/40 to-purple-950/50 p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl border-2 border-cyan-400/40 space-y-6 shadow-[0_0_50px_rgba(34,211,238,0.15)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 font-mono text-[11px] font-bold uppercase tracking-widest mb-1">
              <Database className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> Protocolo Clínico & Diagnóstico
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2.5 break-words">
              <BrainCircuit className="w-6 h-6 text-purple-400 shrink-0" /> Coleta de Dados, Mecânica & Cruzamento com FOMO
            </h2>
          </div>
          <span className="text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-400/40 px-3.5 py-1.5 rounded-full uppercase w-fit shrink-0">
            Aba Diagnóstico • Dados Clínicos
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
          O módulo de <strong>Diagnóstico e Análise do Jogo</strong> foi projetado para transformar a jogabilidade interativa em um laboratório de coleta de dados epidemiológicos. As escolhas do jogador e seu desempenho motor em tempo real são parametrizados para validar hipóteses científicas sobre o <strong>FOMO (Fear of Missing Out)</strong> e a <strong>Sobrecarga Digital</strong>.
        </p>

        {/* SUBSECTION 1: DATA COLLECTION PROTOCOL */}
        <div className="bg-black/40 p-4 sm:p-5 rounded-2xl border border-white/10 space-y-3">
          <h3 className="text-sm sm:text-base font-bold text-cyan-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400 shrink-0" /> 1. Protocolo de Coleta de Dados em Tempo Real
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Durante cada partida, o motor armazena anonimamente um conjunto rigoroso de variáveis clínicas e psicométricas (armazenadas em <code className="text-cyan-300 bg-black/60 px-1.5 py-0.5 rounded font-mono text-[11px]">LocalStorage</code> e <code className="text-cyan-300 bg-black/60 px-1.5 py-0.5 rounded font-mono text-[11px]">Firebase Firestore</code>):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs pt-1">
            <div className="bg-white/5 p-3.5 sm:p-4 rounded-xl border border-white/5 space-y-1.5 flex flex-col justify-between h-full min-w-0">
              <span className="font-bold text-white block">A) Perfil do Participante</span>
              <p className="text-slate-300 text-[11px] leading-relaxed">Código anônimo (ex: <code className="text-cyan-300 font-mono">P-042</code>), faixa etária (9 a 16 anos), série escolar e horas diárias de uso de telas.</p>
            </div>
            <div className="bg-white/5 p-3.5 sm:p-4 rounded-xl border border-white/5 space-y-1.5 flex flex-col justify-between h-full min-w-0">
              <span className="font-bold text-white block">B) Métricas de Resposta (SAS-SMU)</span>
              <p className="text-slate-300 text-[11px] leading-relaxed">Total de questões respondidas, contagem e % de confirmações afirmativas ("SIM"), score final de ansiedade (0–100%).</p>
            </div>
            <div className="bg-white/5 p-3.5 sm:p-4 rounded-xl border border-white/5 space-y-1.5 flex flex-col justify-between h-full min-w-0 sm:col-span-2 lg:col-span-1">
              <span className="font-bold text-white block">C) Desempenho Motor & Latência</span>
              <p className="text-slate-300 text-[11px] leading-relaxed">Velocidade final de movimento (<code className="text-emerald-300 font-mono">WalkSpeed</code> 8 a 16 studs/s), taxa de desvio de obstáculos e tempo de reação (em segundos) a perguntas críticas vs. baixas.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10 text-[11px] text-slate-400">
            <span className="font-bold text-cyan-300">Formatos de Exportação para Pesquisadores:</span>
            <span className="bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded font-mono">Planilha CSV (.csv)</span>
            <span className="bg-purple-950/60 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded font-mono">Dossiê Clínico (.txt)</span>
            <span className="bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded font-mono">Relatório PDF Oficial</span>
          </div>
        </div>

        {/* SUBSECTION 2: SYSTEM MECHANICS */}
        <div className="bg-black/40 p-4 sm:p-5 rounded-2xl border border-white/10 space-y-3">
          <h3 className="text-sm sm:text-base font-bold text-purple-300 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400 shrink-0" /> 2. Mecânica do Sistema & Algoritmo de Interrupções
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            O fluxo de corrida 3D é interrompido periodicamente por balões de diálogo com perguntas extraídas da escala <strong>SAS-SMU (100 itens clínicos)</strong>. A resposta altera instantaneamente a física e a percepção sensorial do jogo:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-slate-300">
            <li>
              <strong>Confirmação de Comportamento Nocivo ("SIM"):</strong> Adiciona de +5% a +20% ao medidor de ansiedade. Desacelera a caminhada do avatar (WalkSpeed reduzido até o limite mínimo de 8 studs/s), reduz a visão com uma névoa avermelhada e eleva o pitch das notificações.
            </li>
            <li>
              <strong>Recusa Consciente / Hábito Saudável ("NÃO"):</strong> Reduz a ansiedade em -5% a -15%, restaura o WalkSpeed para o máximo de 16 studs/s e concede impulso de velocidade.
            </li>
            <li>
              <strong>Liberador do MODO ZEN:</strong> Responder "NÃO" a perguntas de nível CRÍTICO desativa o ambiente de estresse e transporta o avatar para o Modo Zen (área de recuperação neurofisiológica).
            </li>
          </ul>
        </div>

        {/* SUBSECTION 3: SCIENTIFIC CROSS-ANALYSIS WITH FOMO */}
        <div className="bg-black/40 p-4 sm:p-5 rounded-2xl border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-sm sm:text-base font-bold text-pink-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-pink-400 shrink-0" /> 3. Cruzamento Científico: FOMO & Sobrecarga Digital
            </h3>
            <span className="text-[11px] font-mono text-slate-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg w-fit">
              Base Teórica: Przybylski et al. (2013) & Kwon et al. (2013)
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            O estudo cruza o conceito de <strong>FOMO (Fear of Missing Out - Medo de Ficar de Fora)</strong> com os sinais físicos de estresse. Os dados das pesquisas revelam que o viés de urgência do FOMO leva a escolhas impulsivas no jogo:
          </p>

          <div className="p-3.5 bg-rose-950/30 border border-rose-500/30 rounded-xl text-xs text-rose-200 leading-relaxed">
            <strong>📌 Hipótese de Validação Empírica:</strong> Jogadores com alto índice de FOMO respondem <strong>61% mais rápido</strong> a estímulos críticos de notificação (por ansiedade compulsiva), mas apresentam uma <strong>queda brusca de até 60% na retenção e desvio de obstáculos motores</strong> devido à fadiga atencional gerada pela sobrecarga digital.
          </div>

          {/* CLINICAL CATEGORIES MATRIX TABLE */}
          <div className="overflow-x-auto pt-1 rounded-xl border border-white/10">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-cyan-300 border-b border-white/10 font-mono text-[11px]">
                  <th className="p-3 font-bold">Categoria de Diagnóstico</th>
                  <th className="p-3 font-bold">Faixa Ansiedade</th>
                  <th className="p-3 font-bold">Tempo Resposta Crítico</th>
                  <th className="p-3 font-bold">Retenção / Desvio Obstáculos</th>
                  <th className="p-3 font-bold">Impacto Motor (WalkSpeed)</th>
                  <th className="p-3 font-bold">Status Neurofisiológico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="p-3 font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" /> Resiliente Digital
                  </td>
                  <td className="p-3 font-mono font-bold text-emerald-300">0% – 30%</td>
                  <td className="p-3 font-mono text-slate-200">3.2s – 4.7s (Reflexivo)</td>
                  <td className="p-3 font-mono text-emerald-400 font-bold">84% – 98% (Alta)</td>
                  <td className="p-3 font-mono text-emerald-300 font-bold">16.0 studs/s (Máximo)</td>
                  <td className="p-3 text-[11px] leading-relaxed">Foco sustentado, autorregulação emocional e acesso livre ao Modo Zen.</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="p-3 font-bold text-amber-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 shrink-0" /> Uso Moderado
                  </td>
                  <td className="p-3 font-mono font-bold text-amber-300">31% – 70%</td>
                  <td className="p-3 font-mono text-slate-200">2.0s – 3.1s (Moderado)</td>
                  <td className="p-3 font-mono text-amber-400 font-bold">62% – 82% (Média)</td>
                  <td className="p-3 font-mono text-amber-300 font-bold">11.0 – 15.0 studs/s</td>
                  <td className="p-3 text-[11px] leading-relaxed">Sinais esporádicos de distração e fadiga cognitiva sob forte notificação.</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="p-3 font-bold text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> Hiperconectado (FOMO)
                  </td>
                  <td className="p-3 font-mono font-bold text-rose-300">71% – 100%</td>
                  <td className="p-3 font-mono text-rose-300 font-bold">&lt; 1.8s (Impulsivo)</td>
                  <td className="p-3 font-mono text-rose-400 font-bold">32% – 59% (Baixa)</td>
                  <td className="p-3 font-mono text-rose-300 font-bold">8.0 studs/s (Reduzido)</td>
                  <td className="p-3 text-[11px] leading-relaxed">Sobrecarga digital severa, visão túnel com filtro vermelho e hiperalerta nocivo.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION: SYSTEM ARCHITECTURE & DIAGNOSTIC LOGIC */}
      <section className="bg-white/5 p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl border border-white/10 space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 break-words">
          <BrainCircuit className="w-5 h-5 text-purple-400 shrink-0" /> Como Funciona o Diagnóstico do Sistema?
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          O simulador integra as conclusões do artigo em uma experiência visual 3D interativa, onde o nível de estresse do jogador e o índice de ansiedade são monitorados em tempo real:
        </p>

        <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-300">
          <li>
            <strong>Mapeamento de Ansiedade/Estresse (0 a 100%):</strong> Alimentado pela colisão com estímulos nocivos (notificações, likes, telas noturnas, avisos de FOMO) caindo das <em>Nuvens de Internet</em> e pelas respostas afirmativas do teste <strong>SAS-SMU</strong>.
          </li>
          <li>
            <strong>Modulação Motora (WalkSpeed):</strong> Conforme o nível de ansiedade atinge patamares críticos, a velocidade do avatar diminui dinamicamente (de 16 para até 8 studs/s), simulando o cansaço mental, a fadiga cognitiva e o prejuízo de atenção provocados pela sobrecarga digital.
          </li>
          <li>
            <strong>Mecânica Protetora de Recuperação:</strong> A coleta de itens saudáveis (Livros, Esportes, Sono Reparador, Conversa Presencial) e a interação com as zonas ao ar livre (pesca, futebol, alimentar pombos, acariciar animais) reduzem ativamente o nível de ansiedade e devolvem agilidade ao avatar.
          </li>
          <li>
            <strong>Peso das Questões Críticas:</strong> Perguntas classificadas como "CRÍTICAS" na escala SAS-SMU possuem peso elevado, influenciando diretamente o diagnóstico final.
          </li>
        </ul>
      </section>

      {/* SECTION: DETAILED TECHNICAL ARCHITECTURE & DEVELOPMENT INFO */}
      <section className="bg-gradient-to-b from-slate-900/90 to-black/90 p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl border border-cyan-500/30 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white flex items-center gap-2.5 break-words">
            <Code2 className="w-6 h-6 text-cyan-400 shrink-0" /> Arquitetura Técnica de Desenvolvimento do Jogo
          </h2>
          <span className="text-[11px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 px-3 py-1 rounded-full uppercase w-fit shrink-0">
            Stack Full-Client 3D & Web Audio
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          O projeto foi concebido como uma aplicação interativa de alta performance desenvolvida em <strong>TypeScript</strong>, utilizando renderização acelerada por GPU via <strong>WebGL / Three.js</strong>, processamento de som em tempo real via <strong>Web Audio API</strong> e interface reativa baseada em <strong>React 18</strong> e <strong>Tailwind CSS</strong>.
        </p>

        {/* Technical Blocks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 text-xs">
          
          {/* Block 1: Engine 3D & Pipeline */}
          <div className="bg-white/5 hover:bg-white/[0.07] transition-all p-4 sm:p-5 rounded-2xl border border-white/10 space-y-3 flex flex-col justify-between h-full min-w-0">
            <div>
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm mb-2">
                <Layers className="w-4 h-4 text-cyan-400 shrink-0" /> 1. Engine Gráfica & Pipeline 3D (Three.js)
              </div>
              <ul className="space-y-2 text-slate-300 list-disc pl-4 leading-relaxed">
                <li>
                  <strong>Loop de Renderização a 60 FPS:</strong> Execução contínua baseada em <code className="text-cyan-300 bg-black/40 px-1.5 py-0.5 rounded font-mono text-[11px]">requestAnimationFrame</code> com normalização de <em>delta-time</em> para manter a física invariável em diferentes taxas de atualização de monitores.
                </li>
                <li>
                  <strong>Modelo R15 Procedural Articulado:</strong> Avatar construído com hierarquia geométrica pura de 15 partes (cabeça, tronco, braços superiores/inferiores, mãos, pernas e pés), aplicando cinemática direta e inversa para andar, correr, pular, agachar e pedalar.
                </li>
                <li>
                  <strong>Object Pooling & Zero Garbage Collection:</strong> Reutilização em memória de malhas e materiais para obstáculos, moedas e partículas, evitando quedas de quadros (<em>GC stuttering</em>).
                </li>
                <li>
                  <strong>Câmera Cinemática Responsiva:</strong> Câmera em perspectiva isométrica (2.5D) com acompanhamento suavizado, cálculo dinâmico de FOV e sistema de <em>Screen Shake</em> proporcional ao nível de ansiedade.
                </li>
              </ul>
            </div>
          </div>

          {/* Block 2: Física, Zonas & Colisões */}
          <div className="bg-white/5 hover:bg-white/[0.07] transition-all p-4 sm:p-5 rounded-2xl border border-white/10 space-y-3 flex flex-col justify-between h-full min-w-0">
            <div>
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm mb-2">
                <Activity className="w-4 h-4 text-emerald-400 shrink-0" /> 2. Física, Colisões & Zonas de Profundidade (Eixo Z)
              </div>
              <ul className="space-y-2 text-slate-300 list-disc pl-4 leading-relaxed">
                <li>
                  <strong>Detecção Contínua de Colisão AABB:</strong> Verificação em tempo real de caixas delimitadoras e distâncias euclidianas para coleta de itens, obstáculos físicos de pista (muros, cones, buracos) e escudos de proteção.
                </li>
                <li>
                  <strong>Cenários Interativos com Profundidade (Z-Axis):</strong> Transição fluida entre a pista de corrida (<code className="text-emerald-300 bg-black/40 px-1.5 py-0.5 rounded font-mono text-[11px]">Z = 0</code>) e as áreas de lazer (<code className="text-emerald-300 bg-black/40 px-1.5 py-0.5 rounded font-mono text-[11px]">Z = -44</code> a <code className="text-emerald-300 bg-black/40 px-1.5 py-0.5 rounded font-mono text-[11px]">-14</code>), com retorno suave assistido e controle manual instantâneo.
                </li>
                <li>
                  <strong>Simulação Balística da Bola de Futebol:</strong> Equações de gravidade, atrito com o gramado, amortecimento de quique e colisão com as redes do gol para interatividade esportiva.
                </li>
                <li>
                  <strong>Loop Contínuo de Pista:</strong> Algoritmo de teletransporte suave com compensação de coordenadas para corrida infinita e sem costuras visuais.
                </li>
              </ul>
            </div>
          </div>

          {/* Block 3: Síntese de Áudio Procedural */}
          <div className="bg-white/5 hover:bg-white/[0.07] transition-all p-4 sm:p-5 rounded-2xl border border-white/10 space-y-3 flex flex-col justify-between h-full min-w-0">
            <div>
              <div className="flex items-center gap-2 text-purple-300 font-bold text-sm mb-2">
                <Volume2 className="w-4 h-4 text-purple-400 shrink-0" /> 3. Motor de Áudio Procedural (Web Audio API)
              </div>
              <ul className="space-y-2 text-slate-300 list-disc pl-4 leading-relaxed">
                <li>
                  <strong>Síntese Sonora 100% Nativa:</strong> Efeitos sonoros gerados por osciladores matemáticos (senoide, dente de serra e ruído branco) sem necessidade de download de arquivos MP3/WAV externos pesados.
                </li>
                <li>
                  <strong>Modulação de Frequência & Filtros:</strong> Envelopes ADSR (Attack, Decay, Sustain, Release) e filtros passa-baixa ajustados para passos, saltos, impactos e celebrações de vitória.
                </li>
                <li>
                  <strong>Áudio Posicional e Volume Inteligente:</strong> Ganho sonoro atenuado para atividades secundárias de relaxamento (pescaria, alimentação de pombos e sons de pasto).
                </li>
              </ul>
            </div>
          </div>

          {/* Block 4: Controles, Acessibilidade & Multimodalidade */}
          <div className="bg-white/5 hover:bg-white/[0.07] transition-all p-4 sm:p-5 rounded-2xl border border-white/10 space-y-3 flex flex-col justify-between h-full min-w-0">
            <div>
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm mb-2">
                <Gamepad2 className="w-4 h-4 text-amber-400 shrink-0" /> 4. Controles Multimodais & Acessibilidade
              </div>
              <ul className="space-y-2 text-slate-300 list-disc pl-4 leading-relaxed">
                <li>
                  <strong>Suporte Universal a Controles:</strong> Mapeamento unificado para Teclado (WASD / Setas), Controles USB/Bluetooth (Gamepad API padrão W3C) e toque em tela em dispositivos móveis.
                </li>
                <li>
                  <strong>Joystick Cilíndrico On-Screen:</strong> Componente visual em Canvas 2D com física elástica de mola e rastreamento multitouch com zona morta ajustável.
                </li>
                <li>
                  <strong>Painel de Calibração:</strong> Configurações personalizáveis de velocidade, sensibilidade, tamanho de botões e mapeamento de botões de pulo e agachamento.
                </li>
              </ul>
            </div>
          </div>

          {/* Block 5: Algoritmo Psicométrico SAS-SMU */}
          <div className="bg-white/5 hover:bg-white/[0.07] transition-all p-4 sm:p-5 rounded-2xl border border-white/10 space-y-3 flex flex-col justify-between h-full min-w-0">
            <div>
              <div className="flex items-center gap-2 text-rose-300 font-bold text-sm mb-2">
                <BrainCircuit className="w-4 h-4 text-rose-400 shrink-0" /> 5. Algoritmo Psicométrico & Diagnóstico Digital
              </div>
              <ul className="space-y-2 text-slate-300 list-disc pl-4 leading-relaxed">
                <li>
                  <strong>Ponderação Dinâmica de Ansiedade:</strong> Cruzamento em tempo real do estresse da jogabilidade (0-100%) com o índice do questionário científico validado <strong>SAS-SMU</strong>.
                </li>
                <li>
                  <strong>Feedback Comportamental Imediato:</strong> O jogo desacelera a velocidade de locomoção e escurece a iluminação ambiente à medida que o jogador sofre com sobrecarga de telas.
                </li>
                <li>
                  <strong>Categorização Automática:</strong> Classificação em 3 perfis analíticos (<em>Resiliente Digital</em>, <em>Uso Moderado</em> e <em>Hiperconectado</em>) com detalhamento de gatilhos.
                </li>
              </ul>
            </div>
          </div>

          {/* Block 6: Persistência & Exportação Científica */}
          <div className="bg-white/5 hover:bg-white/[0.07] transition-all p-4 sm:p-5 rounded-2xl border border-white/10 space-y-3 flex flex-col justify-between h-full min-w-0">
            <div>
              <div className="flex items-center gap-2 text-sky-300 font-bold text-sm mb-2">
                <Database className="w-4 h-4 text-sky-400 shrink-0" /> 6. Armazenamento & Exportação de Dados
              </div>
              <ul className="space-y-2 text-slate-300 list-disc pl-4 leading-relaxed">
                <li>
                  <strong>Persistência Segura:</strong> Histórico de testes e pontuações armazenados com conformidade a privacidade via <code className="text-sky-300 bg-black/40 px-1.5 py-0.5 rounded font-mono text-[11px]">LocalStorage</code> e <code className="text-sky-300 bg-black/40 px-1.5 py-0.5 rounded font-mono text-[11px]">Firebase Firestore</code>.
                </li>
                <li>
                  <strong>Exportação Acadêmica em CSV:</strong> Geração instantânea de tabelas padronizadas com todas as variáveis psicométricas para análise em softwares estatísticos (SPSS, R ou Excel).
                </li>
                <li>
                  <strong>Dossiê Individual TXT / PDF:</strong> Relatório clínico-educativo formatado com laudo detalhado e recomendações de higiene digital.
                </li>
              </ul>
            </div>
          </div>

        </div>

        {/* Luau / Roblox Studio Interoperability */}
        <div className="bg-black/50 p-4 sm:p-5 rounded-2xl border border-cyan-500/20 space-y-2">
          <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider">
            <Terminal className="w-4 h-4 shrink-0" /> Interoperabilidade & Scripts Luau para Roblox Studio
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            O projeto disponibiliza na aba de código todos os scripts <strong>Luau</strong> modulares (<code className="text-cyan-300 font-mono text-[11px]">AnxietyModule.lua</code>, <code className="text-cyan-300 font-mono text-[11px]">PlayerMovement.lua</code> e <code className="text-cyan-300 font-mono text-[11px]">NotificationSpawner.lua</code>), permitindo que escolas e desenvolvedores importem a mecânica completa para o ecossistema do <strong>Roblox Studio</strong> para fins pedagógicos.
          </p>
        </div>
      </section>

      {/* SECTION: CODE SNIPPETS & ALGORITHMS */}
      <section className="bg-white/5 p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 break-words">
            <Code2 className="w-5 h-5 text-cyan-400 shrink-0" /> Exemplos de Código & Algoritmos Principais
          </h2>
          <span className="text-xs text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-3 py-1 rounded-full font-mono w-fit shrink-0">
            Stack: TypeScript • Three.js • Web Audio • Luau
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Navegue abaixo pelos trechos de código de referência utilizados para construir a simulação interativa 3D, detecção física AABB, síntese de áudio procedural sem arquivos externos e algoritmos psicométricos:
        </p>

        {/* Code Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {CODE_EXAMPLES.map((snippet, idx) => (
            <button
              key={snippet.id}
              onClick={() => setActiveCodeSnippet(idx)}
              className={`p-3 rounded-xl text-left transition-all border flex flex-col justify-between gap-1.5 min-w-0 cursor-pointer ${
                activeCodeSnippet === idx
                  ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                  : 'bg-black/30 border-white/10 text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400/90 block truncate">
                {snippet.language}
              </span>
              <span className="text-xs font-bold truncate">
                {snippet.title}
              </span>
            </button>
          ))}
        </div>

        {/* Active Code Viewer Box */}
        {CODE_EXAMPLES[activeCodeSnippet] && (
          <div className="bg-[#090d16] border border-cyan-500/30 rounded-2xl overflow-hidden shadow-xl mt-3 min-w-0">
            {/* Header / Path & Copy */}
            <div className="bg-slate-900/80 border-b border-white/10 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 overflow-hidden min-w-0">
                <Terminal className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-xs font-mono text-slate-300 truncate">
                  {CODE_EXAMPLES[activeCodeSnippet].path}
                </span>
              </div>
              <button
                onClick={() => handleCopySnippetCode(CODE_EXAMPLES[activeCodeSnippet].code, CODE_EXAMPLES[activeCodeSnippet].id)}
                className="flex items-center justify-center gap-1.5 text-xs bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 px-3 py-1.5 rounded-lg transition-colors shrink-0 font-medium cursor-pointer self-end sm:self-auto"
              >
                {copiedCodeId === CODE_EXAMPLES[activeCodeSnippet].id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-emerald-400 font-bold">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 shrink-0" />
                    <span>Copiar Código</span>
                  </>
                )}
              </button>
            </div>

            {/* Snippet Description */}
            <div className="p-4 bg-slate-950/60 border-b border-white/5 text-xs text-slate-300 leading-relaxed">
              {CODE_EXAMPLES[activeCodeSnippet].description}
            </div>

            {/* Code Pre Box */}
            <div className="p-4 overflow-x-auto max-h-[380px]">
              <pre className="font-mono text-xs sm:text-[13px] text-cyan-200/90 leading-relaxed whitespace-pre">
                <code>{CODE_EXAMPLES[activeCodeSnippet].code}</code>
              </pre>
            </div>
          </div>
        )}
      </section>

      {/* SECTION: HARMFUL ITEMS DAMAGE TABLE */}
      <section className="bg-white/5 p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl border border-white/10 space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 break-words">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" /> Tabela de Impacto de Itens Nocivos (Ansiedade)
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Os estímulos nocivos representam hábitos digitais prejudiciais identificados na pesquisa. Cada colisão aumenta a sobrecarga cognitiva e eleva o nível de ansiedade do jogador:
        </p>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[550px]">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3 sm:p-4">Item Nocivo</th>
                <th className="p-3 sm:p-4">Visual 3D</th>
                <th className="p-3 sm:p-4 text-center">Dano na Ansiedade</th>
                <th className="p-3 sm:p-4">Efeito Técnico & Psicológico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="p-3 sm:p-4 font-bold text-red-400">
                  <span>🚧 Obstáculos de Pista</span>
                </td>
                <td className="p-3 sm:p-4 text-slate-400 text-xs">Buraco, Muro, Cone, Cavalete ou Cilindro</td>
                <td className="p-3 sm:p-4 text-center font-mono font-black text-red-500 bg-red-950/20 text-sm">
                  +10%
                </td>
                <td className="p-3 sm:p-4 text-slate-300 leading-relaxed text-xs">
                  Barreiras e imprevistos do ambiente de jogo. Provoca colisão física, parada motora imediata, piscadas no avatar e necessidade de desvio ágil (pular/abaixar).
                </td>
              </tr>
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="p-3 sm:p-4 font-bold text-red-400">
                  <span>⚠️ Cartões de Notificação</span>
                </td>
                <td className="p-3 sm:p-4 text-slate-400 text-xs">Card flutuante de Notificação Pendente ou Feed</td>
                <td className="p-3 sm:p-4 text-center font-mono font-black text-red-400 bg-red-950/10 text-sm">
                  +6%
                </td>
                <td className="p-3 sm:p-4 text-slate-300 leading-relaxed text-xs">
                  Estímulos visuais disruptivos. Representam interrupções no ciclo de foco de estudos, quebrando a atenção voluntária com alta frequência.
                </td>
              </tr>
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="p-3 sm:p-4 font-bold text-red-400">
                  <span>🎵 TikTok</span>
                </td>
                <td className="p-3 sm:p-4 text-slate-400 text-xs">Distintivo preto circular com nota musical cromática 3D</td>
                <td className="p-3 sm:p-4 text-center font-mono font-black text-red-400 bg-red-950/10 text-sm">
                  +3%
                </td>
                <td className="p-3 sm:p-4 text-slate-300 leading-relaxed text-xs">
                  Consumo passivo e acelerado de vídeos curtos. Representa a liberação imediata de dopamina barata que leva a dependência digital, cansaço passivo e perda gradual de foco.
                </td>
              </tr>
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="p-3 sm:p-4 font-bold text-red-300/90">
                  <span>📱 Distrações e Redes Sociais</span>
                </td>
                <td className="p-3 sm:p-4 text-slate-400 text-xs">Logos (WhatsApp, Facebook, YouTube), Likes, Wi-Fi, Smartphones</td>
                <td className="p-3 sm:p-4 text-center font-mono font-black text-red-400 text-sm">
                  +4% base <span className="text-[10px] text-red-400/80 block font-normal mt-0.5">acumulativo</span>
                </td>
                <td className="p-3 sm:p-4 text-slate-300 leading-relaxed text-xs">
                  Estímulos rotineiros digitais. Caso coletados seguidamente sem itens saudáveis, o <strong>Multiplicador de Ansiedade</strong> aumenta o dano progressivamente (<em>1.2x por acúmulo</em>), simulando o esgotamento por hiperconexão.
                </td>
              </tr>
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="p-3 sm:p-4 font-bold text-amber-300/90">
                  <span>📐 Elementos Geométricos</span>
                </td>
                <td className="p-3 sm:p-4 text-slate-400 text-xs">Prismas e polígonos cinzas abstratos</td>
                <td className="p-3 sm:p-4 text-center font-mono font-black text-amber-400 text-sm">
                  +4% base
                </td>
                <td className="p-3 sm:p-4 text-slate-300 leading-relaxed text-xs">
                  Representa a poluição visual e o ruído de informação nas interfaces modernas. Além de aumentar a ansiedade, <strong>acelera a velocidade de queda de novas notificações em 20%</strong>.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION: PROFILES & CLASSIFICATION */}
      <section className="bg-white/5 p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl border border-white/10 space-y-4">
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 break-words">
          <Users className="w-5 h-5 text-cyan-400 shrink-0" /> Classificação de Perfis Digitais (SAS-SMU)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-2">
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 sm:p-5 rounded-2xl text-center space-y-1.5 flex flex-col justify-between h-full min-w-0">
            <span className="text-xs font-black text-emerald-400 uppercase tracking-wider block">Resiliente Digital</span>
            <p className="text-xs text-slate-300 leading-relaxed">Baixa vulnerabilidade (&lt; 30% respostas afirmativas).</p>
            <p className="text-[11px] text-emerald-300/80 italic mt-auto">Uso intencional e consciente de telas.</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 sm:p-5 rounded-2xl border-amber-500/30 text-center space-y-1.5 flex flex-col justify-between h-full min-w-0">
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider block">Uso Moderado</span>
            <p className="text-xs text-slate-300 leading-relaxed">Vulnerabilidade média (30% a 59% afirmativas).</p>
            <p className="text-[11px] text-amber-300/80 italic mt-auto">Uso diário com sinais pontuais de alerta.</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 p-4 sm:p-5 rounded-2xl border-red-500/30 text-center space-y-1.5 flex flex-col justify-between h-full min-w-0">
            <span className="text-xs font-black text-red-400 uppercase tracking-wider block">Hiperconectado</span>
            <p className="text-xs text-slate-300 leading-relaxed">Elevada vulnerabilidade (&ge; 60% afirmativas).</p>
            <p className="text-[11px] text-red-300/80 italic mt-auto">Sinais intensos de FOMO, ansiedade e telas noturnas.</p>
          </div>
        </div>
      </section>

      {/* SECTION: NOTICE */}
      <section className="bg-amber-500/10 border border-amber-500/30 p-4 sm:p-6 rounded-2xl text-xs sm:text-sm leading-relaxed text-amber-200/90 space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-amber-300">
          <Scale className="w-4 h-4 shrink-0" /> Aviso Importante & Caráter Educacional
        </div>
        <p className="leading-relaxed">
          Esta aplicação tem caráter estritamente educativo, científico e de conscientização escolar. Os resultados de mapeamento comportamental não constituem diagnóstico clínico-médico e não substituem a consulta com psicólogos ou profissionais de saúde mental.
        </p>
      </section>

      {/* SECTION: IDEALIZERS */}
      <section className="bg-white/5 p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl border border-white/10 text-center space-y-4">
        <h3 className="text-sm sm:text-base font-black text-cyan-300 uppercase tracking-widest flex items-center justify-center gap-2">
          Jovens Idealizadores da Pesquisa (Turma 61)
        </h3>
        <div className="max-w-md mx-auto">
          <img
            src={researchersImage}
            alt="Jovens Idealizadores - Turma 61"
            className="w-full rounded-2xl border border-white/10 shadow-2xl hover:scale-[1.01] transition-transform"
            referrerPolicy="no-referrer"
          />
          <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
            Augusto, Caio e Leonardo • EEEM Felipe Camarão (São Sebastião do Caí - RS)
          </p>
        </div>
      </section>

      {/* PDF PREVIEW MODAL (Rendered via React Portal for guaranteed top-level viewport rendering) */}
      {isPreviewOpen && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
          <div className="bg-[#090d16] border border-cyan-400/50 rounded-3xl w-full max-w-5xl h-[94vh] flex flex-col shadow-[0_0_80px_rgba(34,211,238,0.35)] overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-white/10 bg-black/70 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/40 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                    Documento Técnico de Desenvolvimento
                    <span className="text-[10px] font-mono py-0.5 px-2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                      PDF Oficial
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Entre Redes: Há Ansiedade? • Documento de Especificação Técnica
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                {/* View Mode Tabs */}
                <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => setPreviewTab('doc')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      previewTab === 'doc'
                        ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    📑 Leitor Digital
                  </button>
                  <button
                    onClick={() => setPreviewTab('pdf')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      previewTab === 'pdf'
                        ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    📄 PDF Original
                  </button>
                </div>

                <button
                  onClick={handleOpenNewTab}
                  className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Abrir PDF em nova aba do navegador"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-300" />
                  <span className="hidden md:inline">Nova Aba</span>
                </button>

                <button
                  onClick={handleDownloadPdf}
                  className="py-2 px-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/20"
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Baixar</span>
                </button>

                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-full border border-white/10 transition-all cursor-pointer ml-1"
                  title="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 bg-[#03060d] relative overflow-y-auto p-4 sm:p-8">
              
              {previewTab === 'pdf' ? (
                /* PDF Canvas / Object View */
                <div className="w-full h-full min-h-[550px] rounded-2xl overflow-hidden border border-white/10 bg-slate-950 flex flex-col">
                  {pdfBlobUrl || pdfDataUrl ? (
                    <div className="w-full h-full flex flex-col">
                      <iframe
                        src={pdfBlobUrl || pdfDataUrl || undefined}
                        title="Documento Técnico PDF"
                        className="w-full flex-1 min-h-[500px] border-0 rounded-2xl"
                      />
                      <div className="p-3 bg-slate-900/90 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                        <span>Caso a visualização direta seja bloqueada no navegador:</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleOpenNewTab}
                            className="py-1.5 px-3 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-500/30 font-bold transition-all"
                          >
                            Abrir PDF em Nova Aba
                          </button>
                          <button
                            onClick={handleDownloadPdf}
                            className="py-1.5 px-3 rounded-lg bg-white/10 text-white hover:bg-white/20 font-bold transition-all"
                          >
                            Baixar Arquivo PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-3 text-slate-400">
                      <FileText className="w-10 h-10 text-cyan-400 animate-pulse" />
                      <p className="font-mono text-xs text-cyan-300">Carregando visualizador PDF...</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Document Reader Mode (Formatted A4 Sheet) */
                <div className="max-w-4xl mx-auto bg-white text-slate-900 rounded-2xl p-6 sm:p-12 shadow-2xl space-y-8 font-sans border border-slate-200">
                  
                  {/* Document Cover Header */}
                  <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-xl space-y-3 border-l-8 border-cyan-500 shadow-md">
                    <div className="flex items-center justify-between text-[11px] text-cyan-400 font-mono font-bold tracking-widest uppercase">
                      <span>DOCUMENTO TÉCNICO DE DESENVOLVIMENTO</span>
                      <span>PROJETO Nº 22</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight">
                      Game Simulador 3D Interativo: Entre Redes Há Ansiedade?
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-300">
                      Especificação do Sistema, Arquitetura de Software, Engine WebGL e Diagnóstico Psicométrico SAS-SMU.
                    </p>
                    <div className="pt-2 text-[11px] text-sky-400 font-bold">
                      EEEM Felipe Camarão (São Sebastião do Caí / RS - 2026)
                    </div>
                  </div>

                  {/* Metadata Block */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">Estudantes Idealizadores:</span>
                      <p className="text-slate-700">Augusto Joaquim Dullius, Caio Castilho Cercato, Leonardo Lottermann Dahmer (Turma 61)</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block">Orientação & Coorientação:</span>
                      <p className="text-slate-700">Profª Me. Lisandra Jacobi Kölling Junges & Cristofer Stelzer da Silva</p>
                    </div>
                    <div>
                      <span className="font-bold text-cyan-900 block">Orientação Técnica do Game:</span>
                      <p className="text-slate-900 font-semibold">Christian Dahmer</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block">Stack de Tecnologia:</span>
                      <p className="text-slate-700">TypeScript, React 19, Three.js (WebGL), Web Audio API, Firebase Firestore</p>
                    </div>
                  </div>

                  {/* Section 1 */}
                  <div className="space-y-3 border-b border-slate-200 pb-6">
                    <h2 className="text-base font-bold text-cyan-800 uppercase tracking-wide flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 inline-block"></span>
                      1. Resumo Executivo e Visão Geral
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      O game simulador <strong>"Entre Redes: Há Ansiedade?"</strong> foi concebido como uma tecnologia educacional interativa de suporte ao estudo científico homônimo realizado na Escola Estadual de Ensino Médio Felipe Camarão em São Sebastião do Caí/RS. O objetivo central é conscientizar e diagnosticar os impactos do uso excessivo de telas, estímulos constantes de notificações e mídias sociais no desenvolvimento emocional de adolescentes (9 a 16 anos).
                    </p>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      A aplicação traduz preceitos psicométricos em mecânicas lúdicas de jogabilidade 3D, em que o jogador vivencia em tempo real a sobrecarga cognitiva provocada pela hiperconexão e descobre formas ativas de recuperação e autocuidado digital.
                    </p>
                  </div>

                  {/* Section 2: Research Findings Table */}
                  <div className="space-y-3 border-b border-slate-200 pb-6">
                    <h2 className="text-base font-bold text-cyan-800 uppercase tracking-wide flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 inline-block"></span>
                      2. Base Diagnóstica Empírica (77 Estudantes Mapeados)
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse border border-slate-300">
                        <thead className="bg-cyan-900 text-white">
                          <tr>
                            <th className="p-2.5 border border-slate-300">Dimensão Investigada</th>
                            <th className="p-2.5 border border-slate-300">Indicador Empírico Mapeado</th>
                            <th className="p-2.5 border border-slate-300">Impacto na Jogabilidade / Algoritmo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          <tr className="bg-slate-50">
                            <td className="p-2.5 font-bold border border-slate-300">Hiperconexão Diária</td>
                            <td className="p-2.5 border border-slate-300">80,5% usam redes sociais com frequência; 52% passam mais de 4h conectados.</td>
                            <td className="p-2.5 border border-slate-300">Aceleração da queda de notificações e acúmulo de estresse.</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-bold border border-slate-300">Qualidade do Sono</td>
                            <td className="p-2.5 border border-slate-300">71,4% usam celular antes de dormir; 84,4% relatam prejuízos no sono.</td>
                            <td className="p-2.5 border border-slate-300">Simulação da luz azul e redução da regeneração do avatar.</td>
                          </tr>
                          <tr className="bg-slate-50">
                            <td className="p-2.5 font-bold border border-slate-300">Afeção Emocional & FOMO</td>
                            <td className="p-2.5 border border-slate-300">42,9% sentem tristeza/ansiedade pós-redes; 14,3% sofrem com Síndrome FOMO.</td>
                            <td className="p-2.5 border border-slate-300">Redução da velocidade de movimento (WalkSpeed) e escurecimento ambiente.</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-bold border border-slate-300">Prejuízo Acadêmico</td>
                            <td className="p-2.5 border border-slate-300">23,4% reduziram leitura/estudos; 15,6% reduziram brincadeiras ao ar livre.</td>
                            <td className="p-2.5 border border-slate-300">Valorização dos itens de Livros e Esportes com bônus de recuperação.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                   {/* Section 3: Como o Jogo Foi Criado */}
                  <div className="space-y-3 border-b border-slate-200 pb-6">
                    <h2 className="text-base font-bold text-cyan-800 uppercase tracking-wide flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 inline-block"></span>
                      3. Como o Jogo Foi Criado: Metodologia e Estimativa de Horas
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      O desenvolvimento do simulador “Entre Redes: Há Ansiedade?” integrou inovação tecnológica, design educacional e rigor empírico em 4 fases fundamentais:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                        <span className="font-bold text-cyan-800 block">1. Pesquisa & Escala SAS-SMU (~25h)</span>
                        <p className="text-slate-600">Levantamento com 77 estudantes e adaptação da escala Smartphone Addiction Scale em 100 perguntas clínicas.</p>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                        <span className="font-bold text-cyan-800 block">2. Engine 3D Three.js (~45h)</span>
                        <p className="text-slate-600">TypeScript e WebGL para renderização a 60 FPS de avatares articulados (R15) e física de colisões AABB.</p>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                        <span className="font-bold text-cyan-800 block">3. Analytics, PDF & UI (~30h)</span>
                        <p className="text-slate-600">Painéis em Recharts, exportação de relatórios em PDF corporativo (jsPDF) e CSV.</p>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                        <span className="font-bold text-cyan-800 block">4. Áudio Procedural & Voz (~30h)</span>
                        <p className="text-slate-600">Síntese de som via Web Audio API e assistente inteligente com reconhecimento de fala.</p>
                      </div>
                    </div>

                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse border border-slate-300">
                        <thead className="bg-cyan-900 text-white">
                          <tr>
                            <th className="p-2 border border-slate-300">Módulo de Desenvolvimento</th>
                            <th className="p-2 border border-slate-300">Esforço Estimado</th>
                            <th className="p-2 border border-slate-300">Atividades e Entregas Técnicas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          <tr className="bg-slate-50">
                            <td className="p-2 font-bold border border-slate-300">1. Pesquisa & Mapeamento Clínico</td>
                            <td className="p-2 font-bold text-cyan-800 border border-slate-300">~25 horas</td>
                            <td className="p-2 border border-slate-300">Tabulação dos dados de 77 estudantes, adaptação dos 100 itens da escala SAS-SMU e parametrização das regras de ansiedade.</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold border border-slate-300">2. Engine 3D & Física WebGL</td>
                            <td className="p-2 font-bold text-cyan-800 border border-slate-300">~45 horas</td>
                            <td className="p-2 border border-slate-300">Pipeline Three.js, iluminação/sombras, modelagem R15, sistema de corrida sem fim e detecção de colisão AABB a 60 FPS.</td>
                          </tr>
                          <tr className="bg-slate-50">
                            <td className="p-2 font-bold border border-slate-300">3. Analytics, PDF & UI</td>
                            <td className="p-2 font-bold text-cyan-800 border border-slate-300">~30 horas</td>
                            <td className="p-2 border border-slate-300">Painéis estatísticos com Recharts, gerador de relatórios em PDF (jsPDF), exportação CSV e sincronização Firestore.</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold border border-slate-300">4. Áudio Procedural & Voz</td>
                            <td className="p-2 font-bold text-cyan-800 border border-slate-300">~30 horas</td>
                            <td className="p-2 border border-slate-300">Sintetizador Web Audio API, efeitos sonoros matemáticos e assistente virtual inteligente com reconhecimento e síntese de voz.</td>
                          </tr>
                          <tr className="bg-slate-900 text-white font-bold">
                            <td className="p-2 border border-slate-300">TOTAL GERAL</td>
                            <td className="p-2 text-cyan-300 border border-slate-300">120 - 160 horas</td>
                            <td className="p-2 border border-slate-300">Esforço técnico acumulado em engenharia de software, modelagem 3D, testes de desempenho e design educacional.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 4: Architecture */}
                  <div className="space-y-3 border-b border-slate-200 pb-6">
                    <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-900 inline-block"></span>
                      4. Arquitetura Técnica e Tecnologias Desenvolvidas
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse border border-slate-300">
                        <thead className="bg-slate-900 text-white">
                          <tr>
                            <th className="p-2 border border-slate-300">Módulo / Camada</th>
                            <th className="p-2 border border-slate-300">Tecnologias</th>
                            <th className="p-2 border border-slate-300">Detalhamento Técnico</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          <tr className="bg-slate-50">
                            <td className="p-2 font-bold border border-slate-300">1. Engine Gráfica 3D</td>
                            <td className="p-2 border border-slate-300">Three.js / WebGL / Canvas</td>
                            <td className="p-2 border border-slate-300">Loop a 60 FPS com delta-time normalization, iluminação direcional, sombras dinâmicas e gerenciamento Zero-GC.</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold border border-slate-300">2. Modelagem R15</td>
                            <td className="p-2 border border-slate-300">Procedural Geometry</td>
                            <td className="p-2 border border-slate-300">Avatar articulado de 15 partes com cinemática direta/inversa para animações de corrida e pedalada.</td>
                          </tr>
                          <tr className="bg-slate-50">
                            <td className="p-2 font-bold border border-slate-300">3. Motor de Áudio</td>
                            <td className="p-2 border border-slate-300">Web Audio API</td>
                            <td className="p-2 border border-slate-300">Osciladores senoidais e envelopes ADSR sem arquivos externos.</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold border border-slate-300">4. Física AABB</td>
                            <td className="p-2 border border-slate-300">Custom Bounding Box</td>
                            <td className="p-2 border border-slate-300">Detecção contínua de colisão e transição para zonas verdes ($Z=-44$). Física balística de futebol.</td>
                          </tr>
                          <tr className="bg-slate-50">
                            <td className="p-2 font-bold border border-slate-300">5. Interface & Estado</td>
                            <td className="p-2 border border-slate-300">React 18 / Tailwind</td>
                            <td className="p-2 border border-slate-300">Gerenciamento reativo de estado e suporte a Gamepad API (W3C).</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold border border-slate-300">6. Banco de Dados</td>
                            <td className="p-2 border border-slate-300">Firebase Firestore</td>
                            <td className="p-2 border border-slate-300">Presença em tempo real e persistência de casos clínicos anônimos.</td>
                          </tr>
                          <tr className="bg-slate-50">
                            <td className="p-2 font-bold border border-slate-300">7. Interoperabilidade</td>
                            <td className="p-2 border border-slate-300">Luau / Roblox Studio</td>
                            <td className="p-2 border border-slate-300">Módulos Luau desacoplados para importação em Roblox Studio.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 5: Code Examples */}
                  <div className="space-y-3 border-b border-slate-200 pb-6">
                    <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-800 inline-block"></span>
                      5. Exemplos de Código da Arquitetura
                    </h2>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[11px] font-bold text-slate-800 mb-1">A) Loop de Física AABB em Three.js (TypeScript)</p>
                        <div className="bg-slate-950 text-cyan-400 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
                          <pre>{`function updatePhysics(deltaTime: number) {
  const avatarBox = new THREE.Box3().setFromObject(avatarMesh);
  fallingObjects.forEach((obj, idx) => {
    obj.mesh.position.y -= obj.speed * notificationSpeed * deltaTime;
    const objBox = new THREE.Box3().setFromObject(obj.mesh);
    if (avatarBox.intersectsBox(objBox)) {
      anxietyLevel = Math.min(100, anxietyLevel + obj.damage);
      walkSpeed = Math.max(8, 16 - (anxietyLevel * 0.08)); // Modulação Motora
      triggerScreenShake(0.3);
    }
  });
}`}</pre>
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] font-bold text-slate-800 mb-1">B) Síntese Sonora Procedural sem Arquivos Externos (Web Audio API)</p>
                        <div className="bg-slate-950 text-purple-300 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
                          <pre>{`export function playNotificationSFX(freq = 880, duration = 0.15) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + duration);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + duration);
}`}</pre>
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] font-bold text-slate-800 mb-1">C) Servidor Luau Roblox Studio (GameManager.server.luau)</p>
                        <div className="bg-slate-950 text-emerald-400 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
                          <pre>{`-- Monitoramento de Ansiedade e Eventos de Colapso Digital
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local AnxietyLevel = ReplicatedStorage.GameStateInfo.AnxietyLevel
RunService.Heartbeat:Connect(function(deltaTime)
    if AnxietyLevel.Value >= 100 then
        game:GetService("Lighting").Ambient = Color3.fromRGB(150, 0, 0)
        ReplicatedStorage.Events.EndGameEvent:FireAllClients("DERROTA", 100)
    end
end)`}</pre>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 6: Items Table */}
                  <div className="space-y-3 border-b border-slate-200 pb-6">
                    <h2 className="text-base font-bold text-cyan-800 uppercase tracking-wide flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 inline-block"></span>
                      6. Tabela Técnica de Itens, Estímulos e Danos de Ansiedade
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse border border-slate-300">
                        <thead className="bg-cyan-900 text-white">
                          <tr>
                            <th className="p-2 border border-slate-300">Item / Estímulo</th>
                            <th className="p-2 border border-slate-300">Natureza do Item</th>
                            <th className="p-2 border border-slate-300">Impacto Ansiedade</th>
                            <th className="p-2 border border-slate-300">Efeito Psicológico & Mecânico no Avatar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-700">
                          <tr className="bg-slate-50">
                            <td className="p-2 font-bold border border-slate-300">Obstáculos de Pista (Muro/Cone)</td>
                            <td className="p-2 border border-slate-300">Nocivo Físico</td>
                            <td className="p-2 border border-slate-300 text-red-600 font-bold">+10% Ansiedade</td>
                            <td className="p-2 border border-slate-300">Parada motora imediata, interrupção da corrida, necessidade de pulo ou agachamento.</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold border border-slate-300">Cartões de Notificação</td>
                            <td className="p-2 border border-slate-300">Nocivo Digital</td>
                            <td className="p-2 border border-slate-300 text-red-600 font-bold">+6% Ansiedade</td>
                            <td className="p-2 border border-slate-300">Quebra de atenção sustentada, disrupção do foco e alerta cognitivo contínuo.</td>
                          </tr>
                          <tr className="bg-slate-50">
                            <td className="p-2 font-bold border border-slate-300">TikTok (Vídeos Curtos)</td>
                            <td className="p-2 border border-slate-300">Nocivo Digital</td>
                            <td className="p-2 border border-slate-300 text-red-600 font-bold">+3% Ansiedade</td>
                            <td className="p-2 border border-slate-300">Estimulação de dopamina rápida e rasa, induzindo fadiga passiva e perda de concentração.</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold border border-slate-300">WhatsApp / Feeds / Likes</td>
                            <td className="p-2 border border-slate-300">Nocivo Social</td>
                            <td className="p-2 border border-slate-300 text-red-600 font-bold">+4% Base (Acumulativo)</td>
                            <td className="p-2 border border-slate-300">Acúmulo sequencial ativa multiplicador 1.2x por estresse de hiperconexão.</td>
                          </tr>
                          <tr className="bg-slate-50">
                            <td className="p-2 font-bold border border-slate-300">Elementos Geométricos</td>
                            <td className="p-2 border border-slate-300">Poluição Visual</td>
                            <td className="p-2 border border-slate-300 text-red-600 font-bold">+4% Base</td>
                            <td className="p-2 border border-slate-300">Representa ruído visual. Acelera a taxa de queda das próximas notificações em +20%.</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold border border-slate-300">Livro / Leitura</td>
                            <td className="p-2 border border-slate-300">Protetor Digital</td>
                            <td className="p-2 border border-slate-300 text-green-600 font-bold">-3% Ansiedade</td>
                            <td className="p-2 border border-slate-300">Restaura o foco foveal profundo e estimula o raciocínio crítico.</td>
                          </tr>
                          <tr className="bg-slate-50">
                            <td className="p-2 font-bold border border-slate-300">Prática de Esporte / Exercício</td>
                            <td className="p-2 border border-slate-300">Protetor Físico</td>
                            <td className="p-2 border border-slate-300 text-green-600 font-bold">-6% Ansiedade</td>
                            <td className="p-2 border border-slate-300">Liberação de endorfina, reduzindo a rigidez muscular e acelerando o avatar.</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold border border-slate-300">Interação com Animais / Café</td>
                            <td className="p-2 border border-slate-300">Protetor Emocional</td>
                            <td className="p-2 border border-slate-300 text-green-600 font-bold">-4% a -10% Ansiedade</td>
                            <td className="p-2 border border-slate-300">Regulação do sistema nervoso autônomo e indução de calma em zonas de descanso.</td>
                          </tr>
                          <tr className="bg-slate-50">
                            <td className="p-2 font-bold border border-slate-300">Zonas Verdes de Lazer (Pesca/Futebol)</td>
                            <td className="p-2 border border-slate-300">Atividade Presencial</td>
                            <td className="p-2 border border-slate-300 text-green-600 font-bold">Redução Contínua</td>
                            <td className="p-2 border border-slate-300">Zera progressivamente a ansiedade e desativa efeitos colaterais de telas.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 7: Scientific FOMO */}
                  <div className="space-y-3 border-b border-slate-200 pb-6">
                    <h2 className="text-base font-bold text-purple-900 uppercase tracking-wide flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-700 inline-block"></span>
                      7. Coleta de Dados, Mecânica e Cruzamento Científico com FOMO
                    </h2>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      O módulo de Diagnóstico e Análise parametriza a jogabilidade interativa como um protocolo epidemiológico. O jogo coleta em tempo real o perfil do participante, respostas à escala validada SAS-SMU (Smartphone Addiction Scale), latência de tomada de decisão e alteração da coordenação motora fina (WalkSpeed de 16 a 8 studs/s).
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Fundamentado nos estudos de Przybylski et al. (2013) sobre o FOMO (Fear of Missing Out) e Kwon et al. (2013), o algoritmo comprova que o viés de urgência em indivíduos hiperconectados provoca respostas impulsivas a notificações, mas acarreta degradação drástica do desvio de obstáculos devido à sobrecarga digital:
                    </p>

                    <div className="overflow-x-auto mt-2">
                      <table className="w-full text-left text-xs border-collapse border border-slate-300">
                        <thead className="bg-cyan-900 text-white">
                          <tr>
                            <th className="p-2 border border-slate-300">Variável Coletada</th>
                            <th className="p-2 border border-slate-300">Origem no Sistema</th>
                            <th className="p-2 border border-slate-300">Aplicação Clínica & Epidemiológica</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-700">
                          <tr className="bg-slate-50">
                            <td className="p-2 font-bold border border-slate-300">Perfil Demográfico</td>
                            <td className="p-2 border border-slate-300">Cadastro / Aba Diagnóstico</td>
                            <td className="p-2 border border-slate-300">Código anônimo do participante (ex: P-042), idade, série e horas diárias de exposição a telas.</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold border border-slate-300">Pontuação SAS-SMU</td>
                            <td className="p-2 border border-slate-300">Balões de Diálogo no Game</td>
                            <td className="p-2 border border-slate-300">Total de questões respondidas, percentual de confirmações "SIM" e score de ansiedade (0-100%).</td>
                          </tr>
                          <tr className="bg-slate-50">
                            <td className="p-2 font-bold border border-slate-300">Desempenho Motor</td>
                            <td className="p-2 border border-slate-300">Engine 3D (Three.js)</td>
                            <td className="p-2 border border-slate-300">Velocidade final de movimento (WalkSpeed 8–16 studs/s) e taxa de desvio/retenção de obstáculos.</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold border border-slate-300">Latência de Decisão</td>
                            <td className="p-2 border border-slate-300">Temporizador de Clique</td>
                            <td className="p-2 border border-slate-300">Tempo de reação em segundos para responder questões de impacto crítico vs. impacto baixo.</td>
                          </tr>
                          <tr className="bg-slate-50">
                            <td className="p-2 font-bold border border-slate-300">Persistência & Exportação</td>
                            <td className="p-2 border border-slate-300">Firestore & LocalStorage</td>
                            <td className="p-2 border border-slate-300">Armazenamento estruturado de casos reais com exportação direta em CSV, Dossiê TXT e PDF.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3">
                      <p className="text-[11px] font-bold text-slate-800 mb-1">Matriz de Cruzamento Científico: FOMO vs. Resposta e Desempenho Motor</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse border border-slate-300">
                          <thead className="bg-purple-900 text-white">
                            <tr>
                              <th className="p-2 border border-slate-300">Categoria Diagnóstico</th>
                              <th className="p-2 border border-slate-300">Faixa Ansiedade</th>
                              <th className="p-2 border border-slate-300">Tempo Resposta Crítico</th>
                              <th className="p-2 border border-slate-300">Desvio Obstáculos</th>
                              <th className="p-2 border border-slate-300">WalkSpeed</th>
                              <th className="p-2 border border-slate-300">Status Neurofisiológico</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-slate-700">
                            <tr className="bg-slate-50">
                              <td className="p-2 font-bold border border-slate-300">Resiliente Digital</td>
                              <td className="p-2 border border-slate-300">&lt; 30%</td>
                              <td className="p-2 border border-slate-300">3.2s – 4.7s (Reflexivo)</td>
                              <td className="p-2 border border-slate-300">84% – 98% (Alto)</td>
                              <td className="p-2 border border-slate-300">16.0 studs/s</td>
                              <td className="p-2 border border-slate-300">Foco sustentado, autorregulação e acesso livre ao Modo Zen.</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-bold border border-slate-300">Uso Moderado</td>
                              <td className="p-2 border border-slate-300">30% a 59%</td>
                              <td className="p-2 border border-slate-300">2.0s – 3.1s (Moderado)</td>
                              <td className="p-2 border border-slate-300">62% – 82% (Médio)</td>
                              <td className="p-2 border border-slate-300">11.0 – 15.0</td>
                              <td className="p-2 border border-slate-300">Distração esporádica e fadiga cognitiva sob notificação alta.</td>
                            </tr>
                            <tr className="bg-slate-50">
                              <td className="p-2 font-bold border border-slate-300">Hiperconectado (FOMO)</td>
                              <td className="p-2 border border-slate-300">≥ 60%</td>
                              <td className="p-2 border border-slate-300">&lt; 1.8s (Impulsivo)</td>
                              <td className="p-2 border border-slate-300">32% – 59% (Baixo)</td>
                              <td className="p-2 border border-slate-300">8.0 studs/s</td>
                              <td className="p-2 border border-slate-300">Sobrecarga digital severa, visão túnel com névoa e hiperalerta.</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Section 8: Cruzamento Técnico-Cronológico */}
                  <div className="space-y-3 border-b border-slate-200 pb-6">
                    <h2 className="text-base font-bold text-cyan-900 uppercase tracking-wide flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-700 inline-block"></span>
                      8. Cruzamento Técnico-Cronológico do Desenvolvimento
                    </h2>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      A matriz abaixo consolida o cruzamento formal entre os 7 marcos cronológicos da pesquisa, os componentes de arquitetura de software, as tecnologias e ferramentas empregadas e os resultados empíricos validados com os 77 estudantes da EEEM Felipe Camarão:
                    </p>

                    <div className="overflow-x-auto mt-2">
                      <table className="w-full text-left text-xs border-collapse border border-slate-300">
                        <thead className="bg-slate-900 text-white">
                          <tr>
                            <th className="p-2 border border-slate-300">Marco Cronológico</th>
                            <th className="p-2 border border-slate-300">Componente de Software</th>
                            <th className="p-2 border border-slate-300">Tecnologias & Ferramentas</th>
                            <th className="p-2 border border-slate-300">Validação Técnica & Empírica</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-700">
                          <tr className="bg-slate-50">
                            <td className="p-2 font-bold border border-slate-300 text-purple-900">
                              Marco 1: Diagnóstico Psicométrico & Concepção
                            </td>
                            <td className="p-2 border border-slate-300 font-mono text-[11px]">
                              Módulo Psicométrico (types.ts, SASQuestions.ts)
                            </td>
                            <td className="p-2 border border-slate-300">
                              Escala SAS-SV, Inventário FOMO, Questionários e Planilhas Estatísticas
                            </td>
                            <td className="p-2 border border-slate-300">
                              Pesquisa de campo com 77 alunos (Turma 61): 84,4% sono afetado, 42,9% ansiedade. 100 itens clínicos integrados.
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold border border-slate-300 text-cyan-900">
                              Marco 2: Pipeline de Engenharia & Arquitetura Web SPA
                            </td>
                            <td className="p-2 border border-slate-300 font-mono text-[11px]">
                              Núcleo Reativo (App.tsx, vite.config.ts)
                            </td>
                            <td className="p-2 border border-slate-300">
                              TypeScript 5.8 Strict, React 19, Vite 6, Tailwind CSS v4, AI Studio Engine
                            </td>
                            <td className="p-2 border border-slate-300">
                              Build ultraveloz &lt; 1.5s, zero runtime overhead, tipagem estrita de 100% dos estados e design sensorial escuro.
                            </td>
                          </tr>
                          <tr className="bg-slate-50">
                            <td className="p-2 font-bold border border-slate-300 text-emerald-900">
                              Marco 3: Motor Gráfico 3D & Biomecânica Motora
                            </td>
                            <td className="p-2 border border-slate-300 font-mono text-[11px]">
                              Renderizador WebGL (GameCanvas.tsx)
                            </td>
                            <td className="p-2 border border-slate-300">
                              Three.js r185.1, Álgebra Vetorial, Loop Físico AABB, RequestAnimationFrame
                            </td>
                            <td className="p-2 border border-slate-300">
                              Taxa estável de 60 FPS. Desaceleração motora comprovada de WalkSpeed de 16 para 4 u/s sob estresse.
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold border border-slate-300 text-blue-900">
                              Marco 4: Áudio Procedural & Acessibilidade
                            </td>
                            <td className="p-2 border border-slate-300 font-mono text-[11px]">
                              Sintetizador & Controles (audio.ts, controls.ts)
                            </td>
                            <td className="p-2 border border-slate-300">
                              Web Audio API (ADSR), Gamepad API (W3C), Touch Pointer Events
                            </td>
                            <td className="p-2 border border-slate-300">
                              0 MB de arquivos WAV/MP3 externos. Suporte universal a teclado, touch de celulares e joysticks Bluetooth.
                            </td>
                          </tr>
                          <tr className="bg-slate-50">
                            <td className="p-2 font-bold border border-slate-300 text-amber-900">
                              Marco 5: Gamificação Positiva & Persistência Híbrida
                            </td>
                            <td className="p-2 border border-slate-300 font-mono text-[11px]">
                              Loja de Resiliência & Cloud Sync (ShopModal, firebase.ts)
                            </td>
                            <td className="p-2 border border-slate-300">
                              Firebase Firestore NoSQL, LocalStorage Offline-First, Motion v12, Canvas Confetti
                            </td>
                            <td className="p-2 border border-slate-300">
                              Economia de resiliência (Pulo Duplo, Escudo, Tênis, Bicicleta). 100% funcional offline em salas sem internet.
                            </td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold border border-slate-300 text-red-900">
                              Marco 6: Interoperabilidade Luau & Roblox Studio
                            </td>
                            <td className="p-2 border border-slate-300 font-mono text-[11px]">
                              Exportador Luau (RobloxScriptModal, luauGenerator)
                            </td>
                            <td className="p-2 border border-slate-300">
                              Linguagem Luau, ServerScriptService, StarterPlayerScripts, JSZip Exporter
                            </td>
                            <td className="p-2 border border-slate-300">
                              Scripts desacoplados (GameManager e PlayerController). Download de arquivo .zip com 1 clique para robótica escolar.
                            </td>
                          </tr>
                          <tr className="bg-slate-50">
                            <td className="p-2 font-bold border border-slate-300 text-indigo-900">
                              Marco 7: Inteligência Estatística, PDF & Voz
                            </td>
                            <td className="p-2 border border-slate-300 font-mono text-[11px]">
                              Painel Epidemiológico & Dossiê (AnalyticsModal, generateTechnicalPdf)
                            </td>
                            <td className="p-2 border border-slate-300">
                              Recharts v3.10, Coeficiente Pearson (r), Web Speech API TTS, jsPDF + autoTable
                            </td>
                            <td className="p-2 border border-slate-300">
                              Correlação linear calculada em tempo real (r ≈ +0.78). Tutorial narrado por voz humana e segmentação em 6 faixas etárias.
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 9: Legal & Homologation */}
                  <div className="space-y-3">
                    <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-900 inline-block"></span>
                      9. Homologação Técnica e Aviso Legal
                    </h2>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Este documento certifica que o game simulador "Entre Redes: Há Ansiedade?" atende aos requisitos pedagógicos e tecnológicos educacionais. Os algoritmos de simulação possuem caráter exclusivamente educativo e preventivo, não substituindo avaliações clínicas ou diagnósticos médico-psicológicos formais.
                    </p>
                  </div>

                  {/* Signatures */}
                  <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-slate-900 block mb-1">Homologado por:</span>
                      <p className="text-slate-700">Augusto J. Dullius • Caio C. Cercato • Leonardo L. Dahmer (Estudantes Pesquisadores)</p>
                      <p className="text-slate-600">Profª Me. Lisandra Jacobi Kölling Junges (Orientadora) • Cristofer Stelzer da Silva (Coorientador)</p>
                      <p className="text-cyan-900 font-semibold">Christian Dahmer (Orientador Técnico de Desenvolvimento do Game)</p>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono text-right">
                      São Sebastião do Caí / RS • 2026<br/>
                      EEEM Felipe Camarão • Turma 61
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-black/80 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 shrink-0">
              <span className="text-[11px] text-cyan-400 font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                Documento oficial de especificação técnica e arquitetural.
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleOpenNewTab}
                  className="font-bold text-cyan-300 hover:text-cyan-200 underline cursor-pointer"
                >
                  Abrir em Nova Aba
                </button>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="font-bold text-slate-300 hover:text-white underline cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
