import React, { useState, useEffect } from 'react';
import { PlayerProfile, DataCollectionAudience } from '../types';
import {
  ShieldCheck,
  Smartphone,
  Clock,
  School,
  Check,
  X,
  Sparkles,
  RefreshCw,
  Lock,
  Target,
  Users
} from 'lucide-react';
import { playButtonClickSFX } from '../utils/audio';

interface PlayerInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProfile: PlayerProfile;
  onSaveProfile?: (profile: PlayerProfile) => void;
  onSave?: (profile: PlayerProfile) => void;
  onStartWithProfile?: (profile: PlayerProfile) => void;
  isBeforeGameStart?: boolean;
  soundEnabled?: boolean;
  audiences?: DataCollectionAudience[];
  activeAudienceId?: string;
  onChangeActiveAudience?: (audienceId: string) => void;
  onOpenAudienceManager?: () => void;
}

const generateRandomAnonymousCode = () => {
  const randomNum = Math.floor(Math.random() * 900) + 100;
  return `Participante #61-${randomNum}`;
};

export const PlayerInfoModal: React.FC<PlayerInfoModalProps> = ({
  isOpen,
  onClose,
  initialProfile,
  onSaveProfile,
  onSave,
  onStartWithProfile,
  isBeforeGameStart = false,
  soundEnabled = true,
  audiences = [],
  activeAudienceId,
  onChangeActiveAudience,
  onOpenAudienceManager,
}) => {
  const handleSaveInternal = (profile: PlayerProfile) => {
    if (onSaveProfile) onSaveProfile(profile);
    if (onSave) onSave(profile);
  };
  const [selectedAudienceId, setSelectedAudienceId] = useState<string>(
    initialProfile.audienceId || activeAudienceId || 'audiencia_adolescentes_12_14'
  );
  const [anonymousCode, setAnonymousCode] = useState<string>(
    initialProfile.anonymousCode || initialProfile.name || generateRandomAnonymousCode()
  );
  const [alias, setAlias] = useState<string>('');
  const [age, setAge] = useState<string>(initialProfile.age || '12 - 14 anos');
  const [dailyScreenHours, setDailyScreenHours] = useState<string>(initialProfile.dailyScreenHours || '4 a 6 horas');
  const [schoolGrade, setSchoolGrade] = useState<string>(initialProfile.schoolGrade || 'Turma 61');

  // Sync if initial profile or active audience changes
  useEffect(() => {
    if (activeAudienceId) {
      setSelectedAudienceId(activeAudienceId);
      const aud = audiences.find((a) => a.id === activeAudienceId);
      if (aud) {
        setAge(aud.ageRange);
        setSchoolGrade(aud.schoolGradeDefault);
        setDailyScreenHours(aud.dailyScreenHoursDefault);
      }
    }
  }, [activeAudienceId, audiences]);

  if (!isOpen) return null;

  const currentAudience = audiences.find((a) => a.id === selectedAudienceId);

  const handleAudienceChange = (audId: string) => {
    playButtonClickSFX(soundEnabled);
    setSelectedAudienceId(audId);
    if (onChangeActiveAudience) {
      onChangeActiveAudience(audId);
    }
    const aud = audiences.find((a) => a.id === audId);
    if (aud) {
      setAge(aud.ageRange);
      setSchoolGrade(aud.schoolGradeDefault);
      setDailyScreenHours(aud.dailyScreenHoursDefault);
    }
  };

  const handleRandomizeCode = () => {
    playButtonClickSFX(soundEnabled);
    const newCode = generateRandomAnonymousCode();
    setAnonymousCode(newCode);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playButtonClickSFX(soundEnabled);
    const finalIdentifier = alias.trim() ? `${anonymousCode} (${alias.trim()})` : anonymousCode;
    const finalProfile: PlayerProfile = {
      anonymousCode: anonymousCode.trim() || generateRandomAnonymousCode(),
      name: finalIdentifier,
      age,
      dailyScreenHours,
      schoolGrade: schoolGrade.trim() || 'Turma 61',
      audienceId: selectedAudienceId,
      audienceName: currentAudience?.name,
    };

    handleSaveInternal(finalProfile);

    if (isBeforeGameStart && onStartWithProfile) {
      onStartWithProfile(finalProfile);
    } else {
      onClose();
    }
  };

  const handleQuickAnonymous = () => {
    playButtonClickSFX(soundEnabled);
    const quickCode = generateRandomAnonymousCode();
    const finalProfile: PlayerProfile = {
      anonymousCode: quickCode,
      name: quickCode,
      age: currentAudience?.ageRange || '12 - 14 anos',
      dailyScreenHours: currentAudience?.dailyScreenHoursDefault || '4 a 6 horas',
      schoolGrade: currentAudience?.schoolGradeDefault || 'Turma 61',
      audienceId: selectedAudienceId,
      audienceName: currentAudience?.name,
    };

    handleSaveInternal(finalProfile);
    if (isBeforeGameStart && onStartWithProfile) {
      onStartWithProfile(finalProfile);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[#090d16] border-2 border-cyan-400/40 rounded-[32px] max-w-lg w-full p-6 sm:p-8 shadow-[0_0_60px_rgba(34,211,238,0.25)] relative text-white space-y-5 my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 border-b border-white/10 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase block font-bold">
                Protocolo Ético de Pesquisa
              </span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono px-1.5 py-0.2 rounded font-bold border border-emerald-500/30">
                100% Anônimo
              </span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight uppercase">
              Coleta Anônima de Dados
            </h2>
          </div>
        </div>

        {/* Anonymity & Ethics Assurance Banner */}
        <div className="bg-cyan-500/10 border border-cyan-400/30 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-slate-200">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-cyan-300">Garantia de Anonimato Total (LGPD / Resolução CNS 510/2016)</p>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Nenhum dado pessoal identificável (nome real, e-mail ou telefone) é solicitado ou armazenado. Todos os registros utilizam identificadores pseudonimizados para finalidade estatística e psicopedagógica.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Audience / Faixa Etária Selector */}
          {audiences.length > 0 && (
            <div className="space-y-2 bg-white/[0.03] p-3.5 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-cyan-400" /> Público de Coleta (Faixa Etária):
                </label>
                {onOpenAudienceManager && (
                  <button
                    type="button"
                    onClick={() => {
                      playButtonClickSFX(soundEnabled);
                      onOpenAudienceManager();
                    }}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold underline flex items-center gap-1 cursor-pointer"
                  >
                    Gerenciar Públicos
                  </button>
                )}
              </div>

              <select
                value={selectedAudienceId}
                onChange={(e) => handleAudienceChange(e.target.value)}
                className="w-full bg-[#050508] border border-cyan-400/40 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-400 font-semibold cursor-pointer"
              >
                {audiences.map((aud) => (
                  <option key={aud.id} value={aud.id}>
                    {aud.ageRange} • {aud.name}
                  </option>
                ))}
              </select>

              {currentAudience && (
                <p className="text-[10px] text-slate-400 leading-tight">
                  <strong className="text-slate-300">Coorte:</strong> {currentAudience.categoryLabel} | Foco:{' '}
                  {currentAudience.focusPlatforms.join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Identificador / Código Anônimo */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" /> Código Anônimo do Participante:
              </label>
              <button
                type="button"
                onClick={handleRandomizeCode}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 cursor-pointer transition-colors"
                title="Gerar outro código aleatório"
              >
                <RefreshCw className="w-3 h-3" /> Gerar Novo Código
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={anonymousCode}
                onChange={(e) => setAnonymousCode(e.target.value)}
                placeholder="Ex: Participante #61-104"
                className="w-full bg-[#050508] border border-cyan-400/40 rounded-xl py-2.5 px-4 text-sm text-cyan-300 font-mono font-bold placeholder-white/30 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition-all"
              />
            </div>
          </div>

          {/* Pseudônimo / Codinome Opcional */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-slate-400" /> Pseudônimo ou Codinome no Avatar (Opcional):
            </label>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Ex: Alfa-01, CyberGamer, Resiliente (Não utilize seu nome real)"
              className="w-full bg-[#050508] border border-white/15 rounded-xl py-2 px-3.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 transition-all font-medium"
            />
          </div>

          {/* Grid: Idade e Horas de Tela */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Faixa Etária */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Faixa Etária (Estatística):
              </label>
              <select
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full bg-[#050508] border border-white/15 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-cyan-400 transition-all cursor-pointer font-medium"
              >
                <option value="9 - 11 anos">9 - 11 anos (Crianças / 6º Ano EF)</option>
                <option value="12 - 14 anos">12 - 14 anos (Adolescentes / Anos Finais EF)</option>
                <option value="15 - 17 anos">15 - 17 anos (Jovens / Ensino Médio)</option>
                <option value="18 - 24 anos">18 - 24 anos (Universitários / Jovens Adultos)</option>
                <option value="25 - 59 anos">25 - 59 anos (Adultos / Educadores)</option>
                <option value="60+ anos">60+ anos (Terceira Idade / Inclusão Digital)</option>
              </select>
            </div>

            {/* Tempo Diário de Tela */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" /> Tempo Diário de Tela:
              </label>
              <select
                value={dailyScreenHours}
                onChange={(e) => setDailyScreenHours(e.target.value)}
                className="w-full bg-[#050508] border border-white/15 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-cyan-400 transition-all cursor-pointer font-medium"
              >
                <option value="Até 1 hora">Até 1 hora / dia</option>
                <option value="De 2 a 3 horas">De 2 a 3 horas / dia</option>
                <option value="4 a 6 horas">4 a 6 horas / dia</option>
                <option value="Mais de 6 horas">Mais de 6 horas / dia</option>
              </select>
            </div>
          </div>

          {/* Escola / Turma */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <School className="w-3.5 h-3.5 text-cyan-400" /> Segmento Escolar / Turma (Agrupamento):
            </label>
            <input
              type="text"
              value={schoolGrade}
              onChange={(e) => setSchoolGrade(e.target.value)}
              placeholder="Ex: Turma 61, 1º Ano EM, Ensino Fundamental..."
              className="w-full bg-[#050508] border border-white/15 rounded-xl py-2.5 px-4 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="submit"
              className="w-full sm:flex-1 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs tracking-widest uppercase rounded-xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              {isBeforeGameStart ? 'Iniciar Coleta Anônima' : 'Salvar Código Anônimo'}
            </button>

            {isBeforeGameStart && (
              <button
                type="button"
                onClick={handleQuickAnonymous}
                className="w-full sm:w-auto px-4 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer"
              >
                Início Direto 100% Anônimo
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
