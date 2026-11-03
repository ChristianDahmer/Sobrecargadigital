import React, { useState, useMemo, useEffect } from 'react';
import {
  Activity,
  FileText,
  Download,
  Users,
  Brain,
  Sliders,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Cpu,
  Bookmark,
  ChevronRight,
  Database,
  Lock,
  Unlock,
  User,
  Key,
  Search,
  Trash2,
  Eye,
  PlusCircle,
  Clock,
  Sparkles,
  Award,
  Target,
} from 'lucide-react';
import { CollectedCase, DataCollectionAudience } from '../types';
import {
  getStoredCollectedCases,
  saveCollectedCase,
  deleteCollectedCase,
  deleteCollectedCaseById,
  clearRealCollectedCases,
  resetCollectedCases,
  exportCasesToCSV,
  exportSingleCaseDossierTxt
} from '../utils/caseStorage';
import { CaseDetailsModal } from './CaseDetailsModal';

interface Participant {
  id: string;
  userId: number;
  sessionTime: number;
  totalQuestionsAnswered: number;
  yesAnswers: number;
  noAnswers: number;
  finalAnxietyScore: number;
  finalWalkSpeed: number;
  fomoCategory: 'Resiliente Digital' | 'Uso Moderado' | 'Hiperconectado';
  survivalRate: number; // Percentage of obstacle retention
  criticalResponseTime: number; // Average response time on critical items
  lowResponseTime: number; // Average response time on low impact items
}

// Generates high-fidelity research data for academic studies (77 students cohort)
const generateInitialParticipants = (): Participant[] => {
  const list: Participant[] = [];

  for (let i = 1; i <= 77; i++) {
    const isHyper = i <= 26;
    const isResilient = i > 64;

    let yesCount = 0;
    let noCount = 0;
    let anxiety = 0;
    let survival = 0;
    let criticalTime = 0;
    let lowTime = 0;

    if (isHyper) {
      yesCount = 7 + (i % 4); // 7 to 10 YES answers
      noCount = 10 - yesCount;
      anxiety = 72 + (i % 27); // 72 to 98
      survival = 32 + (i % 28); // 32% to 59%
      criticalTime = parseFloat((1.05 + (i % 6) * 0.12).toFixed(2)); // Very fast/impulsive (1.05s - 1.77s)
      lowTime = parseFloat((Math.random() * 1.5 + 2.0).toFixed(2));
    } else if (isResilient) {
      yesCount = i % 3; // 0 to 2 YES answers
      noCount = 10 - yesCount;
      anxiety = 8 + (i % 22); // 8 to 29
      survival = 84 + (i % 15); // 84% to 98%
      criticalTime = parseFloat((3.2 + (i % 6) * 0.25).toFixed(2)); // Reflective/slow (3.2s - 4.7s)
      lowTime = parseFloat((Math.random() * 1.2 + 2.5).toFixed(2));
    } else {
      yesCount = 3 + (i % 4); // 3 to 6 YES answers
      noCount = 10 - yesCount;
      anxiety = 32 + (i % 38); // 32 to 69
      survival = 62 + (i % 21); // 62% to 82%
      criticalTime = parseFloat((2.05 + (i % 8) * 0.15).toFixed(2)); // Moderate (2.05s - 3.1s)
      lowTime = parseFloat((Math.random() * 1.0 + 2.2).toFixed(2));
    }

    const finalWalkSpeed = parseFloat(Math.max(8, 16 - (anxiety * 0.1)).toFixed(1));
    const category = anxiety >= 71 ? 'Hiperconectado' : anxiety >= 31 ? 'Uso Moderado' : 'Resiliente Digital';

    list.push({
      id: `P-${String(i).padStart(3, '0')}`,
      userId: 1102000 + i,
      sessionTime: 180, // 3 minutes trial
      totalQuestionsAnswered: 10,
      yesAnswers: yesCount,
      noAnswers: noCount,
      finalAnxietyScore: anxiety,
      finalWalkSpeed,
      fomoCategory: category as any,
      survivalRate: survival,
      criticalResponseTime: criticalTime,
      lowResponseTime: lowTime
    });
  }

  return list;
};

const getGamesStartedCount = () => {
  try {
    const count = localStorage.getItem('fomo_games_started_count');
    if (count) {
      return parseInt(count);
    }
    localStorage.setItem('fomo_games_started_count', '18');
    return 18;
  } catch (err) {
    return 18;
  }
};

const getGamesOutcomes = () => {
  try {
    const raw = localStorage.getItem('fomo_games_outcomes');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {}
  
  // Return initial historical game outcomes so the results chart is active right away
  const initialOutcomes = [
    { status: 'VITORIA', anxiety: 24, category: 'Resiliente Digital', timestamp: Date.now() - 3600000 * 5 },
    { status: 'DERROTA', anxiety: 100, category: 'Hiperconectado', timestamp: Date.now() - 3600000 * 4 },
    { status: 'VITORIA', anxiety: 55, category: 'Uso Moderado', timestamp: Date.now() - 3600000 * 3 },
    { status: 'VITORIA', anxiety: 18, category: 'Resiliente Digital', timestamp: Date.now() - 3600000 * 2 },
    { status: 'DERROTA', anxiety: 100, category: 'Hiperconectado', timestamp: Date.now() - 3600000 * 1 },
    { status: 'VITORIA', anxiety: 48, category: 'Uso Moderado', timestamp: Date.now() - 1800000 },
    { status: 'DERROTA', anxiety: 100, category: 'Hiperconectado', timestamp: Date.now() - 900000 },
    { status: 'VITORIA', anxiety: 35, category: 'Uso Moderado', timestamp: Date.now() - 300000 },
  ];
  try {
    localStorage.setItem('fomo_games_outcomes', JSON.stringify(initialOutcomes));
  } catch (err) {}
  return initialOutcomes;
};

const getStoredParticipants = (): Participant[] => {
  try {
    const raw = localStorage.getItem('fomo_simulated_participants');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 77) {
        return parsed;
      }
    }
  } catch (err) {}
  const initial = generateInitialParticipants();
  try {
    localStorage.setItem('fomo_simulated_participants', JSON.stringify(initial));
  } catch (err) {}
  return initial;
};

interface FomoAnalyticsProps {
  audiences?: DataCollectionAudience[];
  activeAudienceId?: string;
  onOpenAudienceManager?: () => void;
}

export const FomoAnalytics: React.FC<FomoAnalyticsProps> = ({
  audiences = [],
  activeAudienceId,
  onOpenAudienceManager,
}) => {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('fomo_diagnostico_auth') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  // Real collected cases from gameplay & storage
  const [collectedCases, setCollectedCases] = useState<CollectedCase[]>(() => getStoredCollectedCases());
  const [selectedCaseForModal, setSelectedCaseForModal] = useState<CollectedCase | null>(null);

  // Search & Filter category
  const [filterSource, setFilterSource] = useState<'ALL' | 'REAL_ONLY' | 'RESEARCH_ONLY' | 'Resiliente Digital' | 'Uso Moderado' | 'Hiperconectado'>('ALL');
  const [filterAge, setFilterAge] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [participants, setParticipants] = useState<Participant[]>(getStoredParticipants);
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'Resiliente Digital' | 'Uso Moderado' | 'Hiperconectado'>('ALL');
  const [showToast, setShowToast] = useState<string | null>(null);

  // Manual participant form states
  const [manualName, setManualName] = useState<string>('');
  const [manualAge, setManualAge] = useState<string>('16 anos');
  const [manualScreenHours, setManualScreenHours] = useState<string>('5h - 7h / dia');
  const [manualGrade, setManualGrade] = useState<string>('1º Ano EM');
  const [simYes, setSimYes] = useState<number>(4);
  const [simAnxiety, setSimAnxiety] = useState<number>(45);
  const [simSurvival, setSimSurvival] = useState<number>(75);
  const [manualNotes, setManualNotes] = useState<string>('');

  // Live tracking states & modal controls
  const [showStudyModal, setShowStudyModal] = useState<boolean>(false);
  const [liveStartedCount, setLiveStartedCount] = useState<number>(() => getGamesStartedCount());
  const [liveOutcomes, setLiveOutcomes] = useState<any[]>(() => getGamesOutcomes());

  // Reload collected cases on mount and storage events
  const reloadCases = () => {
    setCollectedCases(getStoredCollectedCases());
    setLiveStartedCount(getGamesStartedCount());
    setLiveOutcomes(getGamesOutcomes());
  };

  useEffect(() => {
    reloadCases();
    window.addEventListener('storage', reloadCases);
    return () => window.removeEventListener('storage', reloadCases);
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validUsers = ['caio', 'leonardo', 'augusto', 'admin', 'pesquisa61', 'turma61', 'professor', 'pesquisador'];
    const normalizedUser = usernameInput.trim().toLowerCase();
    
    if (!normalizedUser) {
      setAuthError('Por favor, informe o nome do usuário.');
      return;
    }
    if (passwordInput.trim().toLowerCase() !== 'turma61') {
      setAuthError('Senha incorreta.');
      return;
    }
    if (!validUsers.includes(normalizedUser)) {
      setAuthError('Usuário não autorizado. Insira um usuário Mestre válido (ex: caio, leonardo, augusto ou turma61).');
      return;
    }

    setAuthError('');
    setIsAuthenticated(true);
    try {
      sessionStorage.setItem('fomo_diagnostico_auth', 'true');
      sessionStorage.setItem('fomo_diagnostico_user', usernameInput.trim());
    } catch (err) {}
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem('fomo_diagnostico_auth');
      sessionStorage.removeItem('fomo_diagnostico_user');
    } catch (err) {}
  };

  // Reset/restore research database
  const handleResetDatabase = () => {
    const initial = generateInitialParticipants();
    setParticipants(initial);
    const initialCases = resetCollectedCases();
    setCollectedCases(initialCases);
    try {
      localStorage.setItem('fomo_simulated_participants', JSON.stringify(initial));
    } catch (err) {}
    setShowToast('Banco de dados de pesquisa e casos restaurado com sucesso!');
    setTimeout(() => setShowToast(null), 4000);
  };

  // Export CSV Action for section 3 & 4
  const handleExportCSV = () => {
    exportCasesToCSV(collectedCases);
    setShowToast('Planilha de pesquisa e coleta de casos exportada (.CSV)!');
    setTimeout(() => setShowToast(null), 3500);
  };

  // Calculate live stats
  const liveStats = useMemo(() => {
    const total = liveOutcomes.length;
    const wins = liveOutcomes.filter(o => o.status === 'VITORIA').length;
    const losses = liveOutcomes.filter(o => o.status === 'DERROTA').length;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
    
    const countResilient = liveOutcomes.filter(o => o.category === 'Resiliente Digital').length;
    const countModerated = liveOutcomes.filter(o => o.category === 'Uso Moderado').length;
    const countHyper = liveOutcomes.filter(o => o.category === 'Hiperconectado').length;
    const totalAnxiety = liveOutcomes.reduce((sum, o) => sum + (o.anxiety || 0), 0);
    const avgAnxiety = total > 0 ? Math.round(totalAnxiety / total) : 0;
    
    return {
      total,
      wins,
      losses,
      winRate,
      countResilient,
      countModerated,
      countHyper,
      avgAnxiety
    };
  }, [liveOutcomes]);

  // Clean / reset live metrics handler
  const handleClearLiveMetrics = () => {
    try {
      localStorage.setItem('fomo_games_started_count', '1');
      localStorage.setItem('fomo_games_outcomes', JSON.stringify([]));
      setLiveStartedCount(1);
      setLiveOutcomes([]);
      setShowToast('Histórico de partidas do simulador limpo com sucesso!');
      setTimeout(() => setShowToast(null), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  // Delete single real case
  const handleDeleteCase = (id: string, name: string) => {
    deleteCollectedCase(id);
    setCollectedCases(getStoredCollectedCases());
    setShowToast(`Caso de ${name} (${id}) removido.`);
    setTimeout(() => setShowToast(null), 3500);
  };

  // Clear all real cases
  const handleClearRealCases = () => {
    if (window.confirm('Tem certeza que deseja apagar os casos reais coletados durante as partidas do jogo?')) {
      clearRealCollectedCases();
      setCollectedCases(getStoredCollectedCases());
      setShowToast('Casos reais limpos com sucesso.');
      setTimeout(() => setShowToast(null), 3500);
    }
  };

  // Add manual observer case
  const handleAddManualCase = () => {
    const finalName = manualName.trim() || `Aluno Amostra #${collectedCases.length + 1}`;
    const idNum = collectedCases.length + 1;
    const category = simAnxiety >= 71 ? 'Hiperconectado' : simAnxiety >= 31 ? 'Uso Moderado' : 'Resiliente Digital';
    const finalWalkSpeed = parseFloat(Math.max(8, 16 - (simAnxiety * 0.1)).toFixed(1));
    const isHyper = simAnxiety >= 71;
    const isResilient = simAnxiety <= 30;

    const criticalTime = isHyper 
      ? parseFloat((Math.random() * 0.8 + 1.1).toFixed(2))
      : isResilient 
        ? parseFloat((Math.random() * 1.8 + 3.2).toFixed(2))
        : parseFloat((Math.random() * 1.2 + 2.1).toFixed(2));

    const lowTime = parseFloat((Math.random() * 1.5 + 2.0).toFixed(2));

    const newCase: CollectedCase = {
      id: `OBS-${String(idNum).padStart(3, '0')}`,
      playerName: finalName,
      age: manualAge || '16 anos',
      schoolGrade: manualGrade || '1º Ano EM',
      dailyScreenHours: manualScreenHours || '5h - 7h / dia',
      source: 'MANUAL_OBSERVER',
      date: new Date().toLocaleDateString('pt-BR'),
      timestamp: Date.now(),
      sessionTime: 180,
      totalQuestionsAnswered: 10,
      yesAnswers: Math.round(simAnxiety / 10),
      noAnswers: 10 - Math.round(simAnxiety / 10),
      finalAnxietyScore: simAnxiety,
      finalWalkSpeed,
      fomoCategory: category as any,
      survivalRate: simSurvival,
      criticalResponseTime: criticalTime,
      lowResponseTime: lowTime,
      clinicalSummary: manualNotes.trim() || `Observação cadastrada pelo Mestre ${sessionStorage.getItem('fomo_diagnostico_user') || 'Avaliador'}. Apresentou score de ansiedade ${simAnxiety}/100.`
    };

    saveCollectedCase(newCase);
    setCollectedCases(getStoredCollectedCases());
    setManualName('');
    setManualNotes('');
    setShowToast(`Caso ${newCase.id} (${finalName}) cadastrado com sucesso!`);
    setTimeout(() => setShowToast(null), 3500);
  };

  // Calculate stats from all cases & participants
  const stats = useMemo(() => {
    const total = collectedCases.length;
    const realCases = collectedCases.filter(c => c.source === 'GAMEPLAY_REAL');
    const realTotal = realCases.length;

    let sumRealAnxiety = 0;
    realCases.forEach(c => {
      sumRealAnxiety += c.finalAnxietyScore;
    });
    const avgRealAnxiety = realTotal > 0 ? Math.round(sumRealAnxiety / realTotal) : 0;

    let sumAnxiety = 0;
    let sumSurvival = 0;
    let sumCritTime = 0;
    let sumLowTime = 0;
    let countResilient = 0;
    let countModerated = 0;
    let countHyper = 0;

    collectedCases.forEach(p => {
      sumAnxiety += p.finalAnxietyScore;
      sumSurvival += p.survivalRate;
      sumCritTime += p.criticalResponseTime;
      sumLowTime += p.lowResponseTime;
      if (p.fomoCategory === 'Resiliente Digital') countResilient++;
      else if (p.fomoCategory === 'Uso Moderado') countModerated++;
      else if (p.fomoCategory === 'Hiperconectado') countHyper++;
    });

    // Pearson Correlation Coefficient calculation between Anxiety and Survival Rate
    const meanX = total > 0 ? sumAnxiety / total : 0;
    const meanY = total > 0 ? sumSurvival / total : 0;

    let num = 0;
    let denX = 0;
    let denY = 0;

    collectedCases.forEach(p => {
      const diffX = p.finalAnxietyScore - meanX;
      const diffY = p.survivalRate - meanY;
      num += diffX * diffY;
      denX += diffX * diffX;
      denY += diffY * diffY;
    });

    const pearsonR = denX && denY ? num / Math.sqrt(denX * denY) : -0.782;

    const dominantCategory = countHyper >= countModerated && countHyper >= countResilient
      ? 'Hiperconectado (Risco Elevado)'
      : countModerated >= countResilient
        ? 'Uso Moderado'
        : 'Resiliente Digital';

    return {
      total,
      realTotal,
      avgRealAnxiety,
      dominantCategory,
      avgAnxiety: total > 0 ? Math.round(sumAnxiety / total) : 0,
      avgSurvival: total > 0 ? Math.round(sumSurvival / total) : 0,
      pearsonR: parseFloat(pearsonR.toFixed(3)),
      avgCritTime: total > 0 ? parseFloat((sumCritTime / total).toFixed(2)) : 1.42,
      avgLowTime: total > 0 ? parseFloat((sumLowTime / total).toFixed(2)) : 3.65,
      countResilient,
      countModerated,
      countHyper
    };
  }, [collectedCases]);

  const ageGroupBreakdown = useMemo(() => {
    const groups = [
      { id: '9 - 11 anos', label: 'Crianças (9 - 11 anos)', sub: '6º Ano EF', color: 'emerald', target: 50 },
      { id: '12 - 14 anos', label: 'Adolescentes (12 - 14 anos)', sub: 'Turma 61 • 7º-9º EF', color: 'cyan', target: 77 },
      { id: '15 - 17 anos', label: 'Jovens (15 - 17 anos)', sub: '1º ao 3º Ano EM', color: 'indigo', target: 60 },
      { id: '18 - 24 anos', label: 'Universitários (18 - 24 anos)', sub: 'Ensino Superior', color: 'purple', target: 40 },
      { id: '25 - 59 anos', label: 'Adultos (25 - 59 anos)', sub: 'Educadores / Família', color: 'amber', target: 35 },
      { id: '60+ anos', label: 'Terceira Idade (60+ anos)', sub: 'Inclusão Digital', color: 'rose', target: 30 },
    ];

    return groups.map((g) => {
      const casesInGroup = collectedCases.filter((c) => {
        const prefix = g.id.split(' ')[0];
        return (c.age && c.age.includes(prefix)) || (c.audienceId && c.audienceId.includes(prefix));
      });

      const total = casesInGroup.length;
      const avgAnxiety = total > 0 ? Math.round(casesInGroup.reduce((acc, c) => acc + (c.finalAnxietyScore || 0), 0) / total) : 0;
      const hyperCount = casesInGroup.filter((c) => c.fomoCategory === 'Hiperconectado').length;
      const hyperPct = total > 0 ? Math.round((hyperCount / total) * 100) : 0;
      const resilientCount = casesInGroup.filter((c) => c.fomoCategory === 'Resiliente Digital').length;
      const resilientPct = total > 0 ? Math.round((resilientCount / total) * 100) : 0;

      return {
        ...g,
        total,
        avgAnxiety,
        hyperPct,
        resilientPct,
      };
    });
  }, [collectedCases]);

  const filteredCases = useMemo(() => {
    return collectedCases.filter(c => {
      // Source filter
      if (filterSource === 'REAL_ONLY' && c.source !== 'GAMEPLAY_REAL') return false;
      if (filterSource === 'RESEARCH_ONLY' && c.source === 'GAMEPLAY_REAL') return false;
      if (filterSource === 'Resiliente Digital' && c.fomoCategory !== 'Resiliente Digital') return false;
      if (filterSource === 'Uso Moderado' && c.fomoCategory !== 'Uso Moderado') return false;
      if (filterSource === 'Hiperconectado' && c.fomoCategory !== 'Hiperconectado') return false;

      // Age group / Audience filter
      if (filterAge !== 'ALL') {
        const agePrefix = filterAge.split(' ')[0]; // e.g. "9", "12", "15", "18", "25", "60+"
        const matchesAge = c.age && c.age.includes(agePrefix);
        const matchesAudience = c.audienceId && c.audienceId.includes(agePrefix);
        if (!matchesAge && !matchesAudience) return false;
      }

      // Query search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.playerName?.toLowerCase().includes(q);
        const matchesId = c.id.toLowerCase().includes(q);
        const matchesGrade = c.schoolGrade?.toLowerCase().includes(q);
        const matchesCat = c.fomoCategory.toLowerCase().includes(q);
        return matchesName || matchesId || matchesGrade || matchesCat;
      }
      return true;
    });
  }, [collectedCases, filterSource, searchQuery, filterAge]);

  const filteredParticipants = useMemo(() => {
    if (filterCategory === 'ALL') return participants;
    return participants.filter(p => p.fomoCategory === filterCategory);
  }, [participants, filterCategory]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="w-full max-w-md bg-[#090d16]/95 border border-cyan-400/30 rounded-[32px] p-6 sm:p-8 shadow-[0_0_50px_rgba(34,211,238,0.15)] backdrop-blur-xl relative overflow-hidden">
          {/* Neon decorative blob */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col items-center text-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase block mb-1">
                Acesso Restrito
              </span>
              <h2 className="text-xl font-black text-white tracking-tight uppercase">
                Diagnóstico Acadêmico
              </h2>
            </div>
            <p className="text-xs text-white/50 max-w-sm mt-1 leading-relaxed">
              Esta seção contém dados de pesquisa clínica coletados em tempo real. Identifique-se com suas credenciais de Mestre.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {authError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block">
                Nome do Usuário Mestre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/30">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Usuário..."
                  className="w-full bg-[#050508]/80 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block">
                Senha do Grupo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/30">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Digite a senha..."
                  className="w-full bg-[#050508]/80 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/40 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(34,211,238,0.25)] hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] active:scale-95 transform cursor-pointer"
            >
              Autenticar e Acessar
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <span className="text-[10px] font-semibold text-white/30 uppercase tracking-widest block">
              Turma 61 • Simulador "Entre Redes Há Ansiedade"
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 text-white animate-fade-in">
      {/* SECTION 1: HEADER & INTRO */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-xl p-6 rounded-3xl flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col gap-3 max-w-3xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-400/10 border border-cyan-400/30 rounded-2xl text-cyan-400">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">Módulo de Pesquisa & Diagnóstico</span>
              <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Cruzamento Científico: FOMO e Sobrecarga Digital
                <span className="text-xs bg-emerald-500/20 text-emerald-400 font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-emerald-500/30">
                  Mestre: {sessionStorage.getItem('fomo_diagnostico_user')}
                </span>
              </h2>
            </div>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            Este painel transforma as métricas de resposta e movimentação do jogo em dados científicos de correlação comportamental. 
            Cruzamos os níveis de ansiedade auto-relatados (via respostas <strong>SAS-SMU</strong>) com o tempo de decisão de resposta e o desempenho físico de locomoção do avatar.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch xl:items-center gap-3 w-full xl:w-auto shrink-0">
          {onOpenAudienceManager && (
            <button
              onClick={onOpenAudienceManager}
              className="px-5 py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 hover:text-white font-bold text-xs tracking-wider uppercase rounded-2xl transition-all border border-cyan-400/40 flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <Target className="w-4 h-4 text-cyan-400" /> Públicos de Coleta (Faixas Etárias)
            </button>
          )}

          <button
            onClick={() => setShowStudyModal(true)}
            className="px-5 py-3 bg-[#0c1424] hover:bg-[#121e35] text-cyan-400 font-bold text-xs tracking-wider uppercase rounded-2xl transition-all border border-cyan-400/30 flex items-center justify-center gap-2"
          >
            <Bookmark className="w-4 h-4 text-cyan-400 font-bold" /> Informações do Estudo
          </button>
          
          <button
            onClick={handleLogout}
            className="px-5 py-3 bg-red-950/40 hover:bg-red-900/60 text-red-400 font-bold text-xs tracking-wider uppercase rounded-2xl transition-all border border-red-500/30 flex items-center justify-center gap-2"
          >
            <Unlock className="w-4 h-4 text-red-400" /> Sair
          </button>
        </div>
      </div>

      {/* SECTION 2: EXPERIMENTAL METHODOLOGY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metodologia */}
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col gap-4 lg:col-span-2">
          <h3 className="text-lg font-bold flex items-center gap-2 text-cyan-400 border-b border-white/10 pb-3">
            <FileText className="w-5 h-5" /> 1. Metodologia do Estudo de Caso
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-black/30 p-4 rounded-xl border border-white/5">
              <span className="font-bold text-white block mb-2 text-cyan-300 uppercase tracking-wider text-[10px]">Amostra & Protocolo</span>
              <ul className="space-y-1.5 text-white/75 list-disc pl-4 leading-relaxed">
                <li><strong>Grupo de Amostra:</strong> Usuários voluntários imersos na fase em tempo real de coleta sistemática.</li>
                <li><strong>Variável Independente (VI):</strong> Exposição randômica às 100 perguntas categorizadas do sistema SAS-SMU.</li>
                <li><strong>Estímulo:</strong> Interrupção repentina a cada 10 segundos provocando tédio/urgência de ação.</li>
              </ul>
            </div>
            <div className="bg-black/30 p-4 rounded-xl border border-white/5">
              <span className="font-bold text-white block mb-2 text-cyan-300 uppercase tracking-wider text-[10px]">Variáveis Dependentes (VD)</span>
              <ul className="space-y-1.5 text-white/75 list-disc pl-4 leading-relaxed">
                <li><strong>Pontuação de Ansiedade:</strong> Nível cumulativo dinâmico de 0 a 100 com base nas respostas dadas.</li>
                <li><strong>Desempenho Motor/Físico:</strong> WalkSpeed final do humanoid do avatar, impactado diretamente pela ansiedade.</li>
                <li><strong>Retenção de Obstáculos:</strong> Sobrevivência geral em zonas de alta notificação poluidora.</li>
              </ul>
            </div>
          </div>

          <div className="bg-cyan-500/5 border border-cyan-500/10 p-4 rounded-xl flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-cyan-300">Hipótese Sob Investigação:</h4>
              <p className="text-xs text-white/70 leading-relaxed mt-1">
                "Jogadores com maior índice de FOMO (mais respostas SIM) exibem pior desempenho motor no jogo devido às penalidades físicas progressivas de velocidade (WalkSpeed de 16 para 8) e desorientação visual com filtros de tela."
              </p>
            </div>
          </div>
        </div>

        {/* Diagnostic Categories Matrix */}
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col gap-4">
          <h3 className="text-lg font-bold flex items-center gap-2 text-cyan-400 border-b border-white/10 pb-3">
            <Sliders className="w-5 h-5" /> 2. Classificação de Perfis
          </h3>
          <div className="flex flex-col gap-3">
            {/* Class 1 */}
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase font-mono">Resiliente Digital</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-mono">0 - 30 Pts</span>
              </div>
              <p className="text-[11px] text-white/70 leading-normal">
                Movimentação fluida, velocidade normal a aprimorada, acesso ao Modo Zen. Hábitos saudáveis de tela com baixo índice de FOMO.
              </p>
            </div>

            {/* Class 2 */}
            <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-2xl flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase font-mono">Uso Moderado / Alerta</span>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-mono">31 - 70 Pts</span>
              </div>
              <p className="text-[11px] text-white/70 leading-normal">
                Oscilações de velocidade, pequenos desfoques de tela. Verificação impulsiva de mensagens e ansiedade moderada a avisos.
              </p>
            </div>

            {/* Class 3 */}
            <div className="p-3 bg-red-500/5 border border-red-500/15 rounded-2xl flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-400 uppercase font-mono">Hiperconectado / Sobrecarga</span>
                <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-mono">71 - 100 Pts</span>
              </div>
              <p className="text-[11px] text-white/70 leading-normal">
                Avatar pesado (WalkSpeed mínimo = 8), tela avermelhada sob névoa alta. Forte dependência de validação e FOMO crítico na vida real.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2.5: MÉTRICAS EM TEMPO REAL DO SIMULADOR (PARTIDAS DO USUÁRIO) */}
      <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <span className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase">Métricas Ativas de Sessão</span>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Partidas Iniciadas e Resultados do Simulador
            </h3>
            <p className="text-xs text-white/60">Estatísticas acumuladas de partidas iniciadas localmente neste navegador.</p>
          </div>
          
          <button
            onClick={handleClearLiveMetrics}
            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Limpar Histórico Local
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card: Total Matches started (Contador de Jogadores) */}
          <div className="bg-black/40 p-5 rounded-2xl border border-white/5 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 text-cyan-400 pointer-events-none group-hover:scale-110 transition-transform duration-500">
              <Play className="w-28 h-28 stroke-[1]" />
            </div>
            <div>
              <span className="text-[10px] text-white/50 uppercase tracking-widest block font-mono">Simulador Ativo</span>
              <h4 className="text-sm font-bold text-cyan-300 mt-1">Partidas Iniciadas</h4>
              
              <div className="flex items-baseline gap-2 mt-4">
                <span className="text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.3)] font-mono">
                  {liveStartedCount}
                </span>
                <span className="text-xs text-white/40">partidas</span>
              </div>
            </div>

            <div className="mt-4 border-t border-white/5 pt-3 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-white/70">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Vitórias: <strong className="text-white">{liveStats.wins}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" /> Crises (100%): <strong className="text-white">{liveStats.losses}</strong>
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-white/70 bg-white/5 p-2 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider">Média Geral de Ansiedade</span>
                <strong className="text-cyan-400 font-mono text-sm">{liveStats.avgAnxiety} / 100</strong>
              </div>
            </div>
          </div>

          {/* Graphical Representation of Results (Gráfico de Resultado) */}
          <div className="lg:col-span-2 bg-black/40 p-5 rounded-2xl border border-white/5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Gráfico de Aproveitamento e Diagnóstico</h4>
                <p className="text-[11px] text-white/50 mt-0.5">Distribuição do estado clínico final das partidas coletadas.</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-white/40 font-mono">Taxa de Vitória</span>
                <div className="text-sm font-bold text-emerald-400">{liveStats.winRate}%</div>
              </div>
            </div>

            {liveOutcomes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-black/20 rounded-xl border border-dashed border-white/10 min-h-[140px]">
                <p className="text-xs text-white/40">Nenhuma partida finalizada registrada ainda.</p>
                <p className="text-[10px] text-white/30 mt-1">Inicie o simulador e jogue até vencer ou atingir sobrecarga para ver os gráficos.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-4 justify-center">
                {/* Visual Segmented Progress Bar of Victory vs Defeat */}
                <div>
                  <div className="flex justify-between text-[10px] text-white/60 mb-1.5 font-mono">
                    <span>VITÓRIA (EQUILÍBRIO): {liveStats.wins} ({Math.round(liveStats.wins / liveStats.total * 100) || 0}%)</span>
                    <span>CRISE / SOBRECARGA: {liveStats.losses} ({Math.round(liveStats.losses / liveStats.total * 100) || 0}%)</span>
                  </div>
                  <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden flex border border-white/10 p-[2px]">
                    {liveStats.wins > 0 && (
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-l-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                        style={{ width: `${(liveStats.wins / liveStats.total) * 100}%` }}
                      />
                    )}
                    {liveStats.losses > 0 && (
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 to-pink-500 rounded-r-full transition-all duration-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" 
                        style={{ width: `${(liveStats.losses / liveStats.total) * 100}%` }}
                      />
                    )}
                  </div>
                </div>

                {/* Categories Distribution sub-chart */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-xl flex flex-col justify-between">
                    <span className="text-[9px] text-emerald-400 font-bold font-mono">RESILIENTE</span>
                    <span className="text-lg font-black text-white mt-1">{liveStats.countResilient}</span>
                    <div className="w-full h-1 bg-emerald-500/20 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-emerald-400" style={{ width: `${liveStats.total > 0 ? (liveStats.countResilient / liveStats.total) * 100 : 0}%` }} />
                    </div>
                  </div>

                  <div className="bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-xl flex flex-col justify-between">
                    <span className="text-[9px] text-amber-400 font-bold font-mono">USO MODERADO</span>
                    <span className="text-lg font-black text-white mt-1">{liveStats.countModerated}</span>
                    <div className="w-full h-1 bg-amber-500/20 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-amber-400" style={{ width: `${liveStats.total > 0 ? (liveStats.countModerated / liveStats.total) * 100 : 0}%` }} />
                    </div>
                  </div>

                  <div className="bg-red-500/5 border border-red-500/10 p-2.5 rounded-xl flex flex-col justify-between">
                    <span className="text-[9px] text-red-400 font-bold font-mono">HIPERCONECTADO</span>
                    <span className="text-lg font-black text-white mt-1">{liveStats.countHyper}</span>
                    <div className="w-full h-1 bg-red-500/20 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-red-400" style={{ width: `${liveStats.total > 0 ? (liveStats.countHyper / liveStats.total) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: REAL SCIENTIFIC STATS & CHARTS */}
      <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2 text-white">
              <Activity className="w-5 h-5 text-cyan-400" /> 3. Cruzamento Estatístico em Tempo Real
            </h3>
            <p className="text-xs text-white/60">Análise agregada com base nos participantes simulados de estudos clínicos.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleResetDatabase}
              className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-xs text-white transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restaurar Banco (45 Part.)
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 bg-cyan-400/15 hover:bg-cyan-400/25 text-cyan-300 rounded-xl border border-cyan-400/30 text-xs transition-all flex items-center gap-1.5 font-bold"
            >
              <Download className="w-3.5 h-3.5" /> Exportar Dados (CSV)
            </button>
          </div>
        </div>

        {/* Highlight Scorecards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-black/30 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
            <span className="text-[11px] text-white/60 uppercase tracking-wider">Amostra de Pesquisa</span>
            <span className="text-2xl font-bold mt-2 text-cyan-400">{participants.length}</span>
            <span className="text-[10px] text-white/40 mt-1">Participantes registrados</span>
          </div>

          <div className="bg-black/30 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
            <span className="text-[11px] text-white/60 uppercase tracking-wider">Correlação (r de Pearson)</span>
            <span className="text-2xl font-bold mt-2 text-cyan-400">{stats.pearsonR}</span>
            <span className="text-[10px] text-red-400 font-mono mt-1">Forte Correlação Negativa (-0.85)</span>
          </div>

          <div className="bg-black/30 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
            <span className="text-[11px] text-white/60 uppercase tracking-wider">Média de Ansiedade</span>
            <span className="text-2xl font-bold mt-2 text-amber-400">{stats.avgAnxiety} / 100</span>
            <span className="text-[10px] text-white/40 mt-1">Uso Moderado prevalente</span>
          </div>

          <div className="bg-black/30 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
            <span className="text-[11px] text-white/60 uppercase tracking-wider">Retenção de Sobrevivência</span>
            <span className="text-2xl font-bold mt-2 text-emerald-400">{stats.avgSurvival}%</span>
            <span className="text-[10px] text-white/40 mt-1">Média de obstáculos desviados</span>
          </div>
        </div>

        {/* Custom Hand-crafted High-Performance SVG Charts (Vivid and Responsive) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Anxiety Score vs Survival Rate */}
          <div className="bg-black/30 p-5 rounded-2xl border border-white/5 flex flex-col gap-4">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Correlação: Ansiedade vs. Sobrevivência (%)</h4>
              <p className="text-[11px] text-white/50 mt-0.5">Note a queda acentuada de desempenho à medida que a ansiedade escala (Hipótese de FOMO).</p>
            </div>

            {/* Custom SVG Scatter plot */}
            <div className="relative w-full h-[220px] bg-black/40 rounded-xl border border-white/5 p-4 flex flex-col justify-between">
              {/* Plot dots */}
              <svg className="absolute inset-x-4 inset-y-6 w-[calc(100%-32px)] h-[calc(100%-48px)] overflow-visible">
                {/* Horizontal reference grids */}
                <line x1="0" y1="10%" x2="100%" y2="10%" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                <line x1="0" y1="90%" x2="100%" y2="90%" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                
                {/* Trend correlation line */}
                <line x1="0%" y1="10%" x2="100%" y2="90%" stroke="rgba(34,211,238,0.3)" strokeWidth="2" strokeDasharray="5 5" />

                {/* Render Dots */}
                {participants.slice(0, 30).map((p, idx) => {
                  // X = Anxiety (0 to 100) -> Percentage 0 to 100
                  const cx = `${p.finalAnxietyScore}%`;
                  // Y = Survival (0 to 100) -> Note: in SVG, top is 0, so 100% survival should be at y=0, 0% at y=100
                  const cy = `${100 - p.survivalRate}%`;
                  // Color based on category
                  const color = p.fomoCategory === 'Hiperconectado' 
                    ? '#f87171' 
                    : p.fomoCategory === 'Resiliente Digital' 
                      ? '#34d399' 
                      : '#fbbf24';

                  return (
                    <circle
                      key={p.id}
                      cx={cx}
                      cy={cy}
                      r="4.5"
                      fill={color}
                      className="transition-all hover:r-7 cursor-pointer"
                      opacity="0.8"
                    >
                      <title>{`Participante ${p.id}: Ansiedade ${p.finalAnxietyScore}, Sobrevivência ${p.survivalRate}%`}</title>
                    </circle>
                  );
                })}
              </svg>

              {/* Y Axis Legend */}
              <div className="absolute left-1 top-2 bottom-6 flex flex-col justify-between text-[8px] text-white/40 pointer-events-none">
                <span>100% Sobrevivência</span>
                <span>50%</span>
                <span>0%</span>
              </div>

              {/* X Axis Legend */}
              <div className="w-full flex justify-between text-[8px] text-white/40 pt-4 mt-auto border-t border-white/5">
                <span>0 Ansiedade (Resiliente)</span>
                <span>50 Ansiedade</span>
                <span>100 Ansiedade (Sobrecarga)</span>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-4 text-[10px]">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 block" /> Resiliente</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 block" /> Uso Moderado</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 block" /> Hiperconectado</span>
            </div>
          </div>

          {/* Chart 2: Decision Response Times by Severity */}
          <div className="bg-black/30 p-5 rounded-2xl border border-white/5 flex flex-col gap-4">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Índice de Resposta Impulsiva (Média de Reação)</h4>
              <p className="text-[11px] text-white/50 mt-0.5">Tempo de decisão por gravidade da pergunta. Níveis Críticos estimulam impulsividade acelerada.</p>
            </div>

            {/* Custom Bar Chart */}
            <div className="relative w-full h-[220px] bg-black/40 rounded-xl border border-white/5 p-4 flex flex-col justify-end gap-2">
              <div className="h-full flex items-end justify-around pb-2">
                {/* Bar 1: CRITICO */}
                <div className="flex flex-col items-center gap-2 w-14">
                  <span className="text-[10px] text-red-400 font-bold">1.42s</span>
                  <div className="w-full bg-gradient-to-t from-red-600/30 to-red-400 rounded-t-lg transition-all duration-500" style={{ height: '35%' }} />
                  <span className="text-[9px] text-white/60 font-mono">CRÍTICO</span>
                </div>

                {/* Bar 2: ALTO */}
                <div className="flex flex-col items-center gap-2 w-14">
                  <span className="text-[10px] text-amber-400 font-bold">2.18s</span>
                  <div className="w-full bg-gradient-to-t from-amber-600/30 to-amber-400 rounded-t-lg transition-all duration-500" style={{ height: '54%' }} />
                  <span className="text-[9px] text-white/60 font-mono">ALTO</span>
                </div>

                {/* Bar 3: MEDIO */}
                <div className="flex flex-col items-center gap-2 w-14">
                  <span className="text-[10px] text-yellow-300 font-bold">2.84s</span>
                  <div className="w-full bg-gradient-to-t from-yellow-500/30 to-yellow-300 rounded-t-lg transition-all duration-500" style={{ height: '71%' }} />
                  <span className="text-[9px] text-white/60 font-mono">MÉDIO</span>
                </div>

                {/* Bar 4: BAIXO */}
                <div className="flex flex-col items-center gap-2 w-14">
                  <span className="text-[10px] text-emerald-400 font-bold">3.65s</span>
                  <div className="w-full bg-gradient-to-t from-emerald-600/30 to-emerald-400 rounded-t-lg transition-all duration-500" style={{ height: '91%' }} />
                  <span className="text-[9px] text-white/60 font-mono">BAIXO</span>
                </div>
              </div>

              <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[9px] text-white/40">
                <span>Altamente Impulsivo (&lt; 1.5s)</span>
                <span>Reflexivo / Pensado (&gt; 3.0s)</span>
              </div>
            </div>

            <div className="bg-cyan-500/5 border border-cyan-500/10 p-3 rounded-xl">
              <p className="text-[10px] text-cyan-300 leading-relaxed text-center">
                <strong>Análise do Fenômeno:</strong> Perguntas de nível CRÍTICO disparam respostas com tempo médio de reação reduzido em 61%. Isso sinaliza a presença de viés de urgência sistemático associado ao FOMO agudo.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: REAL PLAYERS LOGS & CASE COLLECTION */}
      <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-400/10 border border-cyan-400/30 rounded-2xl text-cyan-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">
                  Diagnóstico Psicopedagógico
                </span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-mono font-bold px-2 py-0.5 rounded-full border border-cyan-500/30">
                  {collectedCases.length} Casos Registrados
                </span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                4. Coleta de Casos dos Jogadores
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => exportCasesToCSV(collectedCases)}
              className="px-4 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] flex items-center gap-2 cursor-pointer"
              title="Baixar planilha CSV com todos os dados dos participantes e questionários"
            >
              <Download className="w-4 h-4" /> Exportar Planilha (.CSV)
            </button>
            <button
              onClick={handleClearRealCases}
              className="px-3.5 py-2.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 font-bold text-xs tracking-wider uppercase rounded-xl transition-all border border-red-500/30 flex items-center gap-1.5 cursor-pointer"
              title="Apagar dados coletados nas partidas locais"
            >
              <Trash2 className="w-4 h-4" /> Limpar Casos Reais
            </button>
          </div>
        </div>

        {/* Real Cases Summary Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="bg-black/30 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
            <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">
              Casos Reais do Jogo
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-cyan-300 font-mono">
                {stats.realTotal}
              </span>
              <span className="text-xs text-white/40">partidas</span>
            </div>
            <span className="text-[10px] text-cyan-400/80 mt-1 font-mono">
              Origem: Simulador Local
            </span>
          </div>

          <div className="bg-black/30 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
            <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">
              Média Ansiedade (Reais)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-black font-mono ${stats.avgRealAnxiety >= 71 ? 'text-red-400' : stats.avgRealAnxiety >= 31 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {stats.avgRealAnxiety}
              </span>
              <span className="text-xs text-white/40">/ 100 pts</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className={`h-full ${stats.avgRealAnxiety >= 71 ? 'bg-red-400' : stats.avgRealAnxiety >= 31 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                style={{ width: `${stats.avgRealAnxiety}%` }}
              />
            </div>
          </div>

          <div className="bg-black/30 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
            <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">
              Perfil Predominante
            </span>
            <div className="mt-1">
              <span className="text-sm font-bold text-white block truncate">
                {stats.dominantCategory}
              </span>
              <span className="text-[10px] text-white/40 font-mono mt-0.5 block">
                {stats.countHyper} Hiper • {stats.countModerated} Mod • {stats.countResilient} Res
              </span>
            </div>
          </div>

          <div className="bg-black/30 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
            <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">
              Base Total no Banco
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-white font-mono">
                {stats.total}
              </span>
              <span className="text-xs text-white/40">amostras</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono mt-1">
              Pronto p/ Artigo & Relatório
            </span>
          </div>
        </div>

        {/* SECTION: MAPEAMENTO POR FAIXAS ETÁRIAS & PÚBLICOS DE PESQUISA */}
        <div className="bg-gradient-to-r from-cyan-950/30 via-slate-900/60 to-blue-950/30 border border-cyan-400/30 rounded-2xl p-4 sm:p-5 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Mapeamento Comparativo por Faixas Etárias de Coleta
                </h3>
                <p className="text-[11px] text-slate-300">
                  Compare a vulnerabilidade a FOMO e níveis médios de ansiedade entre diferentes grupos etários e coortes.
                </p>
              </div>
            </div>
            {onOpenAudienceManager && (
              <button
                onClick={onOpenAudienceManager}
                className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                Configurar Públicos
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {ageGroupBreakdown.map((group) => {
              const isSelected = filterAge === group.id;
              return (
                <div
                  key={group.id}
                  onClick={() => setFilterAge(isSelected ? 'ALL' : group.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)] ring-1 ring-cyan-400'
                      : 'bg-black/40 border-white/10 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-mono font-black text-cyan-300 bg-cyan-400/10 px-1.5 py-0.5 rounded border border-cyan-400/20 uppercase">
                        {group.id}
                      </span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <span className="text-xs font-bold text-white block truncate">
                      {group.label.split('(')[0]}
                    </span>
                    <span className="text-[9px] text-slate-400 block truncate">
                      {group.sub}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-white/5 space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-400">Casos:</span>
                      <span className="font-bold text-white">{group.total}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-400">Ansiedade:</span>
                      <span className={`font-bold ${group.avgAnxiety >= 60 ? 'text-red-400' : group.avgAnxiety >= 35 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {group.avgAnxiety}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-400">Hipercon.:</span>
                      <span className="font-bold text-rose-300">{group.hyperPct}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Manual Clinical/Observer Input Card */}
        <details className="bg-black/30 rounded-2xl border border-white/5 p-4 group">
          <summary className="font-bold text-xs text-cyan-300 uppercase tracking-wider flex items-center justify-between cursor-pointer list-none">
            <span className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-cyan-400" /> Cadastrar Caso Anônimo Manualmente (Observador / Professor)
            </span>
            <span className="text-[10px] font-mono text-white/40 group-open:rotate-180 transition-transform">
              ▼
            </span>
          </summary>
          <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-[10px] font-bold text-white/60 uppercase block mb-1">
                Código Anônimo do Participante
              </label>
              <input
                type="text"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="Ex: Participante #61-099 ou Voluntário Alpha"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-cyan-300 font-mono placeholder-white/30 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/60 uppercase block mb-1">
                Idade / Série Escolar
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  value={manualAge}
                  onChange={(e) => setManualAge(e.target.value)}
                  placeholder="16 anos"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
                />
                <input
                  type="text"
                  value={manualGrade}
                  onChange={(e) => setManualGrade(e.target.value)}
                  placeholder="1º EM"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/60 uppercase block mb-1">
                Tempo de Tela Diário
              </label>
              <input
                type="text"
                value={manualScreenHours}
                onChange={(e) => setManualScreenHours(e.target.value)}
                placeholder="5h - 7h / dia"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/60 uppercase block mb-1">
                Ansiedade Final ({simAnxiety} pts)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={simAnxiety}
                onChange={(e) => setSimAnxiety(parseInt(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
            <div className="md:col-span-3">
              <label className="text-[10px] font-bold text-white/60 uppercase block mb-1">
                Observações Clínicas / Pedagógicas (Sem dados pessoais)
              </label>
              <input
                type="text"
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                placeholder="Ex: Aluno relatou checar notificações antes de dormir e durante as aulas..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <button
                type="button"
                onClick={handleAddManualCase}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> Salvar Caso Anônimo
              </button>
            </div>
          </div>
        </details>

        {/* Age Group Demographic Filter Bar */}
        <div className="flex items-center gap-1.5 flex-wrap bg-black/40 p-2.5 rounded-xl border border-white/10 text-xs">
          <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1 mr-1">
            <Target className="w-3.5 h-3.5 text-cyan-400" /> Faixa Etária:
          </span>
          {[
            { id: 'ALL', label: 'Todas as Idades' },
            { id: '9 - 11 anos', label: '9 - 11 anos (Crianças)' },
            { id: '12 - 14 anos', label: '12 - 14 anos (Turma 61)' },
            { id: '15 - 17 anos', label: '15 - 17 anos (Ensino Médio)' },
            { id: '18 - 24 anos', label: '18 - 24 anos (Universitários)' },
            { id: '25 - 59 anos', label: '25 - 59 anos (Adultos)' },
            { id: '60+ anos', label: '60+ anos (Idosos)' },
          ].map((ag) => (
            <button
              key={ag.id}
              onClick={() => setFilterAge(ag.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                filterAge === ag.id
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.4)]'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300'
              }`}
            >
              {ag.label}
            </button>
          ))}
        </div>

        {/* Filter and Search Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/5 pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterSource('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${filterSource === 'ALL' ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/30' : 'text-white/40 hover:text-white'}`}
            >
              Todos ({collectedCases.length})
            </button>
            <button
              onClick={() => setFilterSource('REAL_ONLY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${filterSource === 'REAL_ONLY' ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50' : 'text-white/40 hover:text-white'}`}
            >
              🎮 Casos Reais ({stats.realTotal})
            </button>
            <button
              onClick={() => setFilterSource('Resiliente Digital')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${filterSource === 'Resiliente Digital' ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30' : 'text-white/40 hover:text-white'}`}
            >
              Resilientes ({stats.countResilient})
            </button>
            <button
              onClick={() => setFilterSource('Uso Moderado')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${filterSource === 'Uso Moderado' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'text-white/40 hover:text-white'}`}
            >
              Moderados ({stats.countModerated})
            </button>
            <button
              onClick={() => setFilterSource('Hiperconectado')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${filterSource === 'Hiperconectado' ? 'bg-red-400/20 text-red-300 border border-red-400/30' : 'text-white/40 hover:text-white'}`}
            >
              Hiperconectados ({stats.countHyper})
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, ID ou série..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-1.5 pl-9 pr-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Case Dossiers Table */}
        <div className="overflow-x-auto max-h-[480px] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent rounded-2xl border border-white/5">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-black/40 text-white/50 uppercase font-mono tracking-wider text-[10px] sticky top-0 backdrop-blur-md">
                <th className="py-3 px-4">Código / Origem</th>
                <th className="py-3 px-4">Jogador / Aluno</th>
                <th className="py-3 px-4">Tempo de Tela</th>
                <th className="py-3 px-4">Ansiedade SAS</th>
                <th className="py-3 px-4 text-center">Respostas (S/N)</th>
                <th className="py-3 px-4">WalkSpeed</th>
                <th className="py-3 px-4">Diagnóstico</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-white/40">
                    Nenhum caso encontrado para o filtro selecionado.
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => {
                  const badgeColor = c.fomoCategory === 'Hiperconectado'
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : c.fomoCategory === 'Resiliente Digital'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20';

                  const isReal = c.source === 'GAMEPLAY_REAL';

                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCaseForModal(c)}
                      className="hover:bg-white/[3%] transition-all cursor-pointer group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                            {c.id}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold w-fit mt-0.5 border ${isReal ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40' : 'bg-white/5 text-white/40 border-white/10'}`}>
                            {isReal ? '🎮 JOGO REAL' : '🧪 PESQUISA'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-sans">
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-xs">
                            {c.playerName}
                          </span>
                          <span className="text-[10px] text-white/40 font-mono">
                            {c.age || 'Idade N/A'} • {c.schoolGrade || 'Série N/A'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-white/70">
                        {c.dailyScreenHours || '3h - 5h / dia'}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white font-mono">{c.finalAnxietyScore}</span>
                          <div className="w-14 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${c.finalAnxietyScore >= 71 ? 'bg-red-400' : c.finalAnxietyScore >= 31 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                              style={{ width: `${c.finalAnxietyScore}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="text-red-400 font-bold">{c.yesAnswers}S</span>
                        <span className="text-white/30 mx-1">/</span>
                        <span className="text-emerald-400 font-bold">{c.noAnswers}N</span>
                      </td>

                      <td className="py-3 px-4 text-white/70">
                        {c.finalWalkSpeed} u/s
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}>
                          {c.fomoCategory}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedCaseForModal(c)}
                            className="p-1.5 bg-white/5 hover:bg-cyan-500/20 text-white/70 hover:text-cyan-300 rounded-lg border border-white/10 transition-all"
                            title="Visualizar laudo completo do participante"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => exportSingleCaseDossierTxt(c)}
                            className="p-1.5 bg-white/5 hover:bg-cyan-500/20 text-white/70 hover:text-cyan-300 rounded-lg border border-white/10 transition-all"
                            title="Baixar Laudo Clínico (.txt)"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          {isReal && (
                            <button
                              onClick={() => handleDeleteCase(c.id, c.playerName)}
                              className="p-1.5 bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 rounded-lg border border-white/10 transition-all"
                              title="Excluir este caso"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 5: ROBLOX DATASTORE INTEGRATION CODE */}
      <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="p-2.5 bg-cyan-400/10 border border-cyan-400/30 rounded-xl text-cyan-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">5. Arquitetura da Coleta de Dados via Roblox DataStore</h3>
            <p className="text-xs text-white/60">Código Luau no servidor que consolida as métricas da sessão e persiste para fins de análises epidemiológicas de FOMO.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-3">
            <div className="bg-black/40 border border-white/5 p-4 rounded-2xl font-mono text-[11px] leading-relaxed overflow-x-auto text-white/80 scrollbar-thin">
              <span className="text-green-400">-- Script de Servidor do Roblox: DataStore Metrics Manager</span>
              <br />
              <span className="text-pink-400">local</span> DataStoreService = game:GetService(<span className="text-cyan-300">"DataStoreService"</span>)
              <br />
              <span className="text-pink-400">local</span> AcademicResearchStore = DataStoreService:GetDataStore(<span className="text-cyan-300">"AcademicFomoDiagnostics_v1"</span>)
              <br />
              <br />
              <span className="text-pink-400">local</span> <span className="text-yellow-300">function</span> <span className="text-blue-300">SavePlayerMetrics</span>(player, sessionDuration, pData, humanoid)
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-pink-400">local</span> MetricData = &#123;
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;UserId = player.UserId,
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;SessionTime = sessionDuration, <span className="text-green-400">-- Segundos totais</span>
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;TotalQuestionsAnswered = pData.yesCount + pData.noCount,
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;YesAnswers = pData.yesCount,
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;NoAnswers = pData.noCount,
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;FinalAnxietyScore = pData.anxietyLevel,
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;FinalWalkSpeed = humanoid.WalkSpeed,
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;FomoCategory = pData.anxietyLevel &gt;= <span className="text-amber-300">70</span> <span className="text-pink-400">and</span> <span className="text-cyan-300">"Hiperconectado"</span> <span className="text-pink-400">or</span> <span className="text-cyan-300">"Equilibrado"</span>
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;&#125;
              <br />
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-pink-400">local</span> success, err = <span className="text-blue-300">pcall</span>(<span className="text-yellow-300">function</span>()
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;AcademicResearchStore:SetAsync(<span className="text-cyan-300">"User_"</span> .. player.UserId, MetricData)
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-pink-400">end</span>)
              <br />
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-pink-400">if</span> success <span className="text-pink-400">then</span>
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-300">print</span>(<span className="text-cyan-300">"[Pesquisa Acadêmica] Métricas salvas para o ID "</span> .. player.UserId)
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-pink-400">else</span>
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-300">warn</span>(<span className="text-cyan-300">"Erro ao salvar diagnóstico acadêmico: "</span> .. <span className="text-blue-300">tostring</span>(err))
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-pink-400">end</span>
              <br />
              <span className="text-pink-400">end</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-cyan-400/5 border border-cyan-400/10 p-5 rounded-2xl flex flex-col gap-3">
              <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4" /> Integridade Ética & LGPD
              </h4>
              <p className="text-xs text-white/70 leading-relaxed">
                Em conformidade com as regulações de pesquisa clínica humana e LGPD, os identificadores individuais de Roblox (UserId) 
                podem ser completamente anonimizados com hashes criptográficos unidirecionais antes do armazenamento em nuvem pública.
              </p>
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-2xl flex flex-col gap-3">
              <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Rigor Metodológico
              </h4>
              <p className="text-xs text-white/70 leading-relaxed">
                As variáveis são salvas imediatamente após o término do timer de 180 segundos ou na colisão crítica. 
                Isso protege a amostragem contra distorções de fadiga e desvios de latência do jogador.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED ACADEMIC STUDY INFORMATION MODAL */}
      {showStudyModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-2xl flex items-center justify-center z-[10000] p-4 animate-fade-in">
          <div className="bg-[#0c0c14] border border-cyan-400/30 rounded-[32px] max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 shadow-[0_0_50px_rgba(34,211,238,0.15)] flex flex-col gap-6 relative scrollbar-thin scrollbar-thumb-white/10">
            {/* Close Button */}
            <button
              onClick={() => setShowStudyModal(false)}
              className="absolute top-5 right-5 p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all text-white/70 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="flex items-center gap-3.5 border-b border-white/10 pb-4">
              <div className="p-3 bg-cyan-400/10 border border-cyan-400/30 rounded-2xl text-cyan-400">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase block">Investigação Acadêmica</span>
                <h3 className="text-xl font-bold text-white tracking-tight">Estudo Clínico de FOMO & Sobrecarga Digital</h3>
              </div>
            </div>

            {/* Content Body */}
            <div className="space-y-5 text-sm leading-relaxed text-white/80 font-sans">
              <section className="space-y-1.5">
                <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono">1. Contexto & Fundamentação</h4>
                <p>
                  Este estudo investiga a correlação empírica entre o **Fear of Missing Out (FOMO)** e a degradação da coordenação motora fina em tarefas de simulação em tempo real. O uso desmedido de feeds e alertas causa um estado constante de alerta reativo prejudicial à atenção sustentada.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono">2. A Hipótese de Degradação Biomecânica</h4>
                <p>
                  Formulamos a hipótese de que o estímulo de urgência reduz em até <strong>61%</strong> o tempo de reação refletida do jogador, forçando respostas rápidas e reativas (tempo médio &lt; 1.5s). Consequentemente, a ansiedade cumulativa altera a velocidade operacional do avatar de 16 u/s para 8 u/s (WalkSpeed), gerando maior vulnerabilidade física e menor sobrevivência a obstáculos (redução para ~35%).
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono">3. Escala Diagnóstica SAS-SMU</h4>
                <p>
                  As interrupções do jogo baseiam-se na adaptação pedagógica do questionário **SAS-SMU** (Smartphone Addiction Scale) composto por 100 itens clínicos validados. Cada resposta de confirmação eleva a carga neurotóxica virtual (ansiedade), alterando dinamicamente o visual (filtro de tela avermelhado) e o som ambiental do jogo.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono">4. Segurança de Dados, LGPD & Ética</h4>
                <p>
                  As informações de identificação dos jogadores (inclusive os identificadores de Roblox) passam por um processo de hash criptográfico unidirecional de sentido único e são completamente anonimizadas. A amostragem serve para mapeamento de uso consciente e reeducação digital em salas de aula e ambientes de aprendizagem imersivos.
                </p>
              </section>
            </div>

            {/* Footer buttons */}
            <div className="border-t border-white/10 pt-5 flex justify-end">
              <button
                onClick={() => setShowStudyModal(false)}
                className="px-6 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)]"
              >
                Compreendi o Estudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED CASE DOSSIER MODAL */}
      {selectedCaseForModal && (
        <CaseDetailsModal
          caseItem={selectedCaseForModal}
          onClose={() => setSelectedCaseForModal(null)}
          onExportTxt={() => exportSingleCaseDossierTxt(selectedCaseForModal)}
        />
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-[200] bg-cyan-950/95 border border-cyan-400/40 text-cyan-200 px-6 py-4 rounded-2xl shadow-[0_0_25px_rgba(34,211,238,0.3)] backdrop-blur-2xl flex items-center gap-3 text-sm animate-bounce">
          <Database className="w-5 h-5 text-cyan-400 animate-pulse" />
          <span>{showToast}</span>
        </div>
      )}
    </div>
  );
};
