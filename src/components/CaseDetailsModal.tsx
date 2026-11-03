import React from 'react';
import { CollectedCase } from '../types';
import { X, Download, User, Clock, Award, ShieldCheck, HeartPulse, Brain, CheckCircle2, FileText, Printer, Sparkles, Activity } from 'lucide-react';
import { exportSingleCaseDossierTxt } from '../utils/caseStorage';

interface CaseDetailsModalProps {
  caseItem: CollectedCase | null;
  onClose: () => void;
}

export const CaseDetailsModal: React.FC<CaseDetailsModalProps> = ({ caseItem, onClose }) => {
  if (!caseItem) return null;

  const handlePrint = () => {
    window.print();
  };

  const badgeColor =
    caseItem.fomoCategory === 'Hiperconectado'
      ? 'bg-red-500/15 text-red-400 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
      : caseItem.fomoCategory === 'Resiliente Digital'
      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
      : 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]';

  return (
    <div className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[#090d16] border-2 border-cyan-400/40 rounded-[32px] max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-[0_0_60px_rgba(34,211,238,0.25)] relative text-white space-y-6 my-auto scrollbar-thin scrollbar-thumb-white/10">
        
        {/* Header Bar */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase font-bold">
                  {caseItem.id}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                  caseItem.source === 'GAMEPLAY_REAL'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-400/40'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
                }`}>
                  {caseItem.source === 'GAMEPLAY_REAL' ? '🎮 Caso Coletado no Jogo' : '🧪 Amostra de Pesquisa'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                Ficha Diagnóstica: {caseItem.playerName}
              </h2>
              <span className="text-xs text-white/50">{caseItem.dateFormatted}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Player Profile Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-black/40 border border-white/5 p-3.5 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Jogador / Apelido</span>
            <span className="text-sm font-bold text-white mt-1 block truncate">{caseItem.playerName}</span>
          </div>

          <div className="bg-black/40 border border-white/5 p-3.5 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Faixa Etária</span>
            <span className="text-sm font-bold text-cyan-300 mt-1 block">{caseItem.age || 'Não informada'}</span>
          </div>

          <div className="bg-black/40 border border-white/5 p-3.5 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Uso Diário de Telas</span>
            <span className="text-sm font-bold text-amber-300 mt-1 block">{caseItem.dailyScreenHours || '4 a 6 horas'}</span>
          </div>

          <div className="bg-black/40 border border-white/5 p-3.5 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Escola / Turma</span>
            <span className="text-sm font-bold text-emerald-300 mt-1 block truncate">{caseItem.schoolGrade || 'Turma 61'}</span>
          </div>
        </div>

        {/* Section 2: Clinical Outcome Banner */}
        <div className={`p-5 rounded-3xl border ${badgeColor} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest block opacity-80">Classificação Clínica de FOMO</span>
            <h3 className="text-2xl font-black tracking-tight">{caseItem.fomoCategory}</h3>
            <p className="text-xs opacity-90">{caseItem.diagnosticTitle}</p>
          </div>

          <div className="flex items-center gap-4 bg-black/30 px-4 py-2.5 rounded-2xl border border-white/10 shrink-0">
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-wider block opacity-70 font-mono">Nível de Ansiedade</span>
              <span className="text-2xl font-mono font-black">{caseItem.finalAnxietyScore}%</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <HeartPulse className="w-6 h-6 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Section 3: Biomechanical Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
            <span className="text-[9px] text-white/50 uppercase font-bold tracking-wider block">Respostas SIM</span>
            <span className="text-lg font-black text-red-400 mt-1 block font-mono">
              {caseItem.yesAnswers} / {caseItem.totalQuestionsAnswered} ({caseItem.affirmativePercentage}%)
            </span>
          </div>

          <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
            <span className="text-[9px] text-white/50 uppercase font-bold tracking-wider block">WalkSpeed Final</span>
            <span className="text-lg font-black text-cyan-400 mt-1 block font-mono">{caseItem.finalWalkSpeed} u/s</span>
          </div>

          <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
            <span className="text-[9px] text-white/50 uppercase font-bold tracking-wider block">Sobrevivência</span>
            <span className="text-lg font-black text-emerald-400 mt-1 block font-mono">{caseItem.survivalRate}%</span>
          </div>

          <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
            <span className="text-[9px] text-white/50 uppercase font-bold tracking-wider block">Tempo de Reação</span>
            <span className="text-lg font-black text-yellow-300 mt-1 block font-mono">{caseItem.criticalResponseTime}s</span>
          </div>
        </div>

        {/* Section 4: Pedagogical Description & Recommendations */}
        <div className="bg-black/40 border border-white/5 p-5 rounded-3xl space-y-3 text-sm">
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-cyan-400" /> Parecer de Saúde Digital & Recomendações
          </span>
          <p className="text-xs text-slate-300 leading-relaxed">
            {caseItem.diagnosticDescription}
          </p>

          <div className="pt-2">
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider block mb-2">Orientações Indicadas:</span>
            <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
              {caseItem.recommendations && caseItem.recommendations.map((rec, i) => (
                <li key={i} className="marker:text-cyan-400">{rec}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Section 5: SAS Questions answered in session */}
        {caseItem.answersList && caseItem.answersList.length > 0 && (
          <div className="space-y-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Registro das Perguntas da Sessão ({caseItem.answersList.length}):
            </span>
            <div className="max-h-40 overflow-y-auto space-y-1.5 scrollbar-thin pr-1">
              {caseItem.answersList.map((ans, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white/5 p-2.5 rounded-xl text-xs gap-3 border border-white/5">
                  <span className="text-slate-300 leading-tight">P{idx + 1}: {ans.question}</span>
                  <span className={`font-black px-2 py-0.5 rounded text-[10px] uppercase shrink-0 ${
                    ans.answer === 'SIM'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {ans.answer}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[10px] text-white/40 font-mono">
            Protocolo: {caseItem.id} • Estudo "Entre Redes Há Ansiedade"
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => exportSingleCaseDossierTxt(caseItem)}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Baixar Laudo (.txt)
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
