import React, { useState } from 'react';
import { DataCollectionAudience, CollectedCase } from '../types';
import {
  Users,
  Plus,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  Target,
  BarChart3,
  Calendar,
  Layers,
  Smartphone,
  School,
  Clock,
  Trash2,
  CheckCircle2,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { playButtonClickSFX, playCoinCollectSFX } from '../utils/audio';

interface AudienceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  audiences: DataCollectionAudience[];
  activeAudienceId: string;
  onSelectActiveAudience: (audienceId: string) => void;
  onAddCustomAudience: (audience: DataCollectionAudience) => void;
  onDeleteCustomAudience?: (audienceId: string) => void;
  collectedCases?: CollectedCase[];
  soundEnabled?: boolean;
}

export const AudienceManagerModal: React.FC<AudienceManagerModalProps> = ({
  isOpen,
  onClose,
  audiences,
  activeAudienceId,
  onSelectActiveAudience,
  onAddCustomAudience,
  onDeleteCustomAudience,
  collectedCases = [],
  soundEnabled = true,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAgeRange, setNewAgeRange] = useState('15 - 17 anos');
  const [newCategoryLabel, setNewCategoryLabel] = useState('Jovens (Ensino Médio)');
  const [newSchoolGrade, setNewSchoolGrade] = useState('');
  const [newScreenHours, setNewScreenHours] = useState('4 a 6 horas');
  const [newPlatforms, setNewPlatforms] = useState('TikTok, Instagram, WhatsApp');
  const [newDescription, setNewDescription] = useState('');
  const [newSampleSize, setNewSampleSize] = useState(50);
  const [newEthicalProtocol, setNewEthicalProtocol] = useState('Termo de Consentimento & Assentimento (LGPD)');

  if (!isOpen) return null;

  // Calculate stats for each age group/audience
  const getCaseCountForAudience = (audience: DataCollectionAudience) => {
    return collectedCases.filter((c) => {
      if (c.audienceId && c.audienceId === audience.id) return true;
      if (c.age && c.age.includes(audience.ageRange.split(' ')[0])) return true;
      return false;
    }).length;
  };

  const handleSelect = (id: string) => {
    playButtonClickSFX(soundEnabled);
    onSelectActiveAudience(id);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    playCoinCollectSFX(soundEnabled);

    const customAudience: DataCollectionAudience = {
      id: `custom_audience_${Date.now()}`,
      name: newTitle.trim(),
      ageRange: newAgeRange,
      categoryLabel: newCategoryLabel.trim() || 'Público Personalizado',
      schoolGradeDefault: newSchoolGrade.trim() || 'Turma Personalizada',
      dailyScreenHoursDefault: newScreenHours,
      focusPlatforms: newPlatforms.split(',').map((p) => p.trim()).filter(Boolean),
      description: newDescription.trim() || 'Coleta personalizada para fins de pesquisa em saúde digital.',
      ethicalProtocol: newEthicalProtocol.trim() || 'Resolução CNS 510/2016 e LGPD',
      targetSampleSize: Number(newSampleSize) || 50,
      isCustom: true,
      color: 'indigo',
    };

    onAddCustomAudience(customAudience);
    onSelectActiveAudience(customAudience.id);
    setIsCreating(false);

    // Reset form
    setNewTitle('');
    setNewSchoolGrade('');
    setNewDescription('');
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-[#090d16] border-2 border-cyan-400/40 rounded-[32px] max-w-4xl w-full p-5 sm:p-7 shadow-[0_0_60px_rgba(34,211,238,0.25)] relative text-white space-y-6 my-auto max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase font-bold">
                  Painel de Pesquisa Psicoeducacional
                </span>
                <span className="text-[9px] bg-cyan-400/10 text-cyan-300 font-mono px-2 py-0.5 rounded-full border border-cyan-400/30 font-bold">
                  Faixas Etárias & Coortes
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                Públicos-Alvo de Coleta de Dados
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              playButtonClickSFX(soundEnabled);
              setIsCreating(!isCreating);
            }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              isCreating
                ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.4)]'
            }`}
          >
            {isCreating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isCreating ? 'Cancelar' : 'Novo Público de Coleta'}
          </button>
        </div>

        {/* Ethical Framework Notice */}
        <div className="bg-cyan-950/40 border border-cyan-400/30 rounded-2xl p-3.5 text-xs text-slate-200 flex items-start gap-3 shrink-0">
          <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-cyan-300 block">
              Configuração Metodológica por Faixa Etária (LGPD & CNS 510/2016)
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Defina o público que utilizará o jogo para calibrar automaticamente o segmento escolar, expectativas de tempo de tela e parâmetros comparativos de FOMO. Todos os registros permanecem 100% anônimos e etiquetados com a coorte selecionada.
            </p>
          </div>
        </div>

        {/* Create Custom Audience Form */}
        {isCreating && (
          <form
            onSubmit={handleCreateSubmit}
            className="bg-[#0e1424] border border-cyan-400/50 rounded-2xl p-4 sm:p-5 space-y-4 shrink-0 animate-fade-in"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black uppercase text-cyan-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" /> Cadastrar Novo Público de Coleta
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Personalização para Escolas/Pesquisas</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase">
                  Nome do Público / Turma:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Escola Estadual - 3º Ano EM A"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 rounded-xl py-2 px-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase">
                  Faixa Etária Alvo:
                </label>
                <select
                  value={newAgeRange}
                  onChange={(e) => {
                    setNewAgeRange(e.target.value);
                    if (e.target.value.includes('9 - 11')) setNewCategoryLabel('Crianças (5º/6º Ano EF)');
                    else if (e.target.value.includes('12 - 14')) setNewCategoryLabel('Adolescentes (7º ao 9º Ano EF)');
                    else if (e.target.value.includes('15 - 17')) setNewCategoryLabel('Jovens (1º ao 3º Ano EM)');
                    else if (e.target.value.includes('18 - 24')) setNewCategoryLabel('Universitários & Jovens Adultos');
                    else if (e.target.value.includes('25 - 59')) setNewCategoryLabel('Adultos & Educadores');
                    else setNewCategoryLabel('Terceira Idade (60+ anos)');
                  }}
                  className="w-full bg-black/60 border border-white/15 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="9 - 11 anos">9 - 11 anos (Crianças / Anos Iniciais EF)</option>
                  <option value="12 - 14 anos">12 - 14 anos (Adolescentes / Anos Finais EF)</option>
                  <option value="15 - 17 anos">15 - 17 anos (Jovens / Ensino Médio)</option>
                  <option value="18 - 24 anos">18 - 24 anos (Universitários / Jovens Adultos)</option>
                  <option value="25 - 59 anos">25 - 59 anos (Adultos / Educadores / Pais)</option>
                  <option value="60+ anos">60+ anos (Terceira Idade / Inclusão Digital)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase">
                  Segmento / Grau Escolar Padrão:
                </label>
                <input
                  type="text"
                  placeholder="Ex: 2º Ano B, Graduação em Psicologia..."
                  value={newSchoolGrade}
                  onChange={(e) => setNewSchoolGrade(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 rounded-xl py-2 px-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase">
                  Meta Amostral (Número de Participantes):
                </label>
                <input
                  type="number"
                  min="5"
                  max="500"
                  value={newSampleSize}
                  onChange={(e) => setNewSampleSize(Number(e.target.value))}
                  className="w-full bg-black/60 border border-white/15 rounded-xl py-2 px-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase">
                Plataformas de Redes Mais Usadas (separadas por vírgula):
              </label>
              <input
                type="text"
                placeholder="Ex: TikTok, Instagram, WhatsApp, Discord"
                value={newPlatforms}
                onChange={(e) => setNewPlatforms(e.target.value)}
                className="w-full bg-black/60 border border-white/15 rounded-xl py-2 px-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase">
                Objetivo Metodológico / Descrição:
              </label>
              <textarea
                rows={2}
                placeholder="Descreva o objetivo desta coleta para a coorte selecionada..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full bg-black/60 border border-white/15 rounded-xl py-2 px-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-lg cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Cadastrar Público
              </button>
            </div>
          </form>
        )}

        {/* Audiences Grid (Scrollable) */}
        <div className="overflow-y-auto pr-1 space-y-3.5 flex-1 min-h-[220px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {audiences.map((aud) => {
              const isActive = aud.id === activeAudienceId;
              const caseCount = getCaseCountForAudience(aud);
              const targetSize = aud.targetSampleSize || 50;
              const progressPct = Math.min(100, Math.round((caseCount / targetSize) * 100));

              return (
                <div
                  key={aud.id}
                  className={`relative p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 ${
                    isActive
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.3)] ring-1 ring-cyan-400/50'
                      : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
                  }`}
                >
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full uppercase bg-cyan-400/15 text-cyan-300 border border-cyan-400/30">
                        {aud.ageRange}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {aud.categoryLabel}
                      </span>
                    </div>

                    {isActive && (
                      <span className="flex items-center gap-1 text-[10px] font-mono font-black uppercase text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> ATIVO
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-black text-white flex items-center justify-between">
                      <span>{aud.name}</span>
                      {aud.isCustom && onDeleteCustomAudience && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playButtonClickSFX(soundEnabled);
                            onDeleteCustomAudience(aud.id);
                          }}
                          className="text-white/30 hover:text-red-400 p-1 rounded-lg transition-colors cursor-pointer"
                          title="Remover público personalizado"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
                      {aud.description}
                    </p>
                  </div>

                  {/* Demographic & Platforms Meta */}
                  <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <School className="w-3 h-3 text-cyan-400" />
                      {aud.schoolGradeDefault}
                    </span>
                    <span className="flex items-center gap-1">
                      <Smartphone className="w-3 h-3 text-pink-400" />
                      {aud.focusPlatforms.slice(0, 3).join(', ')}
                    </span>
                  </div>

                  {/* Sample Progress */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400">Casos Coletados na Coorte:</span>
                      <span className="font-bold text-white">
                        {caseCount} / {targetSize} ({progressPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden border border-white/10">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          progressPct >= 100
                            ? 'bg-emerald-400'
                            : isActive
                            ? 'bg-gradient-to-r from-cyan-400 to-blue-500'
                            : 'bg-slate-400'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Select / Active Action */}
                  <div className="pt-1">
                    {isActive ? (
                      <div className="w-full py-2 bg-cyan-400/15 border border-cyan-400/40 rounded-xl text-center text-xs font-black text-cyan-300 uppercase tracking-wider flex items-center justify-center gap-2">
                        <Check className="w-3.5 h-3.5" /> Público Ativo no Simulador
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSelect(aud.id)}
                        className="w-full py-2 bg-white/5 hover:bg-cyan-500/20 hover:border-cyan-400/40 border border-white/10 rounded-xl text-center text-xs font-bold text-white/80 hover:text-white uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Target className="w-3.5 h-3.5 text-cyan-400" />
                        Definir como Público Ativo
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Público selecionado define automaticamente etiquetas de caso e estatísticas analíticas.</span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg cursor-pointer"
          >
            Concluir & Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};
