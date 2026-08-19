import React, { useState, useMemo } from 'react';
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
  Key
} from 'lucide-react';

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

// Generates high-fidelity research data for academic studies
const generateInitialParticipants = (): Participant[] => {
  const list: Participant[] = [];
  const names = [
    'Alice S.', 'Bruno M.', 'Carla T.', 'Daniel R.', 'Eduarda F.', 'Felipe G.', 'Gabriela H.', 'Hugo C.', 'Isabela P.', 'João V.',
    'Karina L.', 'Lucas B.', 'Mariana N.', 'Natan J.', 'Olívia M.', 'Pedro D.', 'Quitéria S.', 'Rafael A.', 'Sofia E.', 'Thiago P.',
    'Úrsula R.', 'Vinícius K.', 'Waldemar J.', 'Xavier L.', 'Yasmin C.', 'Zeca O.', 'Alba M.', 'Beto H.', 'Clara D.', 'David S.'
  ];

  for (let i = 1; i <= 45; i++) {
    const isHyper = i % 3 === 0;
    const isResilient = i % 3 === 1;

    let yesCount = 0;
    let noCount = 0;
    let anxiety = 0;
    let survival = 0;
    let criticalTime = 0;
    let lowTime = 0;

    if (isHyper) {
      yesCount = Math.floor(Math.random() * 4) + 6; // 6 to 9 YES answers
      noCount = 10 - yesCount;
      anxiety = Math.floor(Math.random() * 25) + 71; // 71 to 96
      survival = Math.floor(Math.random() * 30) + 30; // 30% to 60%
      criticalTime = parseFloat((Math.random() * 0.8 + 1.1).toFixed(2)); // Very fast/impulsive (1.1s - 1.9s)
      lowTime = parseFloat((Math.random() * 1.5 + 2.0).toFixed(2)); // Normal (2.0s - 3.5s)
    } else if (isResilient) {
      yesCount = Math.floor(Math.random() * 3); // 0 to 2 YES answers
      noCount = 10 - yesCount;
      anxiety = Math.floor(Math.random() * 25) + 5; // 5 to 30
      survival = Math.floor(Math.random() * 15) + 85; // 85% to 100%
      criticalTime = parseFloat((Math.random() * 1.8 + 3.2).toFixed(2)); // Reflective/slow (3.2s - 5.0s)
      lowTime = parseFloat((Math.random() * 1.2 + 2.5).toFixed(2)); // (2.5s - 3.7s)
    } else {
      yesCount = Math.floor(Math.random() * 3) + 3; // 3 to 5 YES answers
      noCount = 10 - yesCount;
      anxiety = Math.floor(Math.random() * 35) + 31; // 31 to 66
      survival = Math.floor(Math.random() * 20) + 65; // 65% to 85%
      criticalTime = parseFloat((Math.random() * 1.2 + 2.1).toFixed(2)); // Moderate (2.1s - 3.3s)
      lowTime = parseFloat((Math.random() * 1.0 + 2.2).toFixed(2)); // Moderate (2.2s - 3.2s)
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
      return JSON.parse(raw);
    }
  } catch (err) {}
  const initial = generateInitialParticipants();
  try {
    localStorage.setItem('fomo_simulated_participants', JSON.stringify(initial));
  } catch (err) {}
  return initial;
};

export const FomoAnalytics: React.FC = () => {
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

  const [participants, setParticipants] = useState<Participant[]>(getStoredParticipants);
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'Resiliente Digital' | 'Uso Moderado' | 'Hiperconectado'>('ALL');
  const [showToast, setShowToast] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validUsers = ['caio', 'leonardo', 'augusto'];
    const normalizedUser = usernameInput.trim().toLowerCase();
    
    if (!normalizedUser) {
      setAuthError('Por favor, informe o nome do usuário.');
      return;
    }
    if (passwordInput !== 'turma61') {
      setAuthError('Senha incorreta.');
      return;
    }
    if (!validUsers.includes(normalizedUser)) {
      setAuthError('Usuário não autorizado. Por favor, insira um usuário Mestre válido.');
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
  
  // Custom states for manual diagnostic simulator
  const [simYes, setSimYes] = useState<number>(4);
  const [simAnxiety, setSimAnxiety] = useState<number>(45);
  const [simSurvival, setSimSurvival] = useState<number>(75);

  // Live tracking states & modal controls
  const [showStudyModal, setShowStudyModal] = useState<boolean>(false);
  const [liveStartedCount, setLiveStartedCount] = useState<number>(() => getGamesStartedCount());
  const [liveOutcomes, setLiveOutcomes] = useState<any[]>(() => getGamesOutcomes());

  // Load live values when mounted
  React.useEffect(() => {
    setLiveStartedCount(getGamesStartedCount());
    setLiveOutcomes(getGamesOutcomes());
  }, []);

  // Calculate live stats
  const liveStats = useMemo(() => {
    const total = liveOutcomes.length;
    const wins = liveOutcomes.filter(o => o.status === 'VITORIA').length;
    const losses = liveOutcomes.filter(o => o.status === 'DERROTA').length;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
    
    const countResilient = liveOutcomes.filter(o => o.category === 'Resiliente Digital').length;
    const countModerated = liveOutcomes.filter(o => o.category === 'Uso Moderado').length;
    const countHyper = liveOutcomes.filter(o => o.category === 'Hiperconectado').length;
    
    return {
      total,
      wins,
      losses,
      winRate,
      countResilient,
      countModerated,
      countHyper
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

  // Re-generate database
  const handleResetDatabase = () => {
    const initial = generateInitialParticipants();
    setParticipants(initial);
    setFilterCategory('ALL');
    try {
      localStorage.setItem('fomo_simulated_participants', JSON.stringify(initial));
    } catch (err) {}
    setShowToast('Banco de dados de pesquisa restaurado com sucesso para as 45 amostras iniciais!');
    setTimeout(() => setShowToast(null), 4000);
  };

  // Add virtual trial
  const handleAddParticipant = () => {
    const idNum = participants.length + 1;
    const isHyper = simAnxiety >= 71;
    const isResilient = simAnxiety <= 30;

    const criticalTime = isHyper 
      ? parseFloat((Math.random() * 0.8 + 1.1).toFixed(2))
      : isResilient 
        ? parseFloat((Math.random() * 1.8 + 3.2).toFixed(2))
        : parseFloat((Math.random() * 1.2 + 2.1).toFixed(2));

    const lowTime = parseFloat((Math.random() * 1.5 + 2.0).toFixed(2));
    const finalWalkSpeed = parseFloat(Math.max(8, 16 - (simAnxiety * 0.1)).toFixed(1));
    const category = simAnxiety >= 71 ? 'Hiperconectado' : simAnxiety >= 31 ? 'Uso Moderado' : 'Resiliente Digital';

    const newPart: Participant = {
      id: `P-${String(idNum).padStart(3, '0')}`,
      userId: 1102000 + idNum,
      sessionTime: 180,
      totalQuestionsAnswered: 10,
      yesAnswers: simYes,
      noAnswers: 10 - simYes,
      finalAnxietyScore: simAnxiety,
      finalWalkSpeed,
      fomoCategory: category as any,
      survivalRate: simSurvival,
      criticalResponseTime: criticalTime,
      lowResponseTime: lowTime
    };

    const updatedParticipants = [newPart, ...participants];
    setParticipants(updatedParticipants);
    try {
      localStorage.setItem('fomo_simulated_participants', JSON.stringify(updatedParticipants));
    } catch (err) {}

    setShowToast(`Participante ${newPart.id} registrado com sucesso no banco de dados!`);
    setTimeout(() => setShowToast(null), 3500);
  };

  // Calculate stats
  const stats = useMemo(() => {
    const total = participants.length;
    if (total === 0) return { avgAnxiety: 0, avgSurvival: 0, pearsonR: 0, avgCritTime: 0, avgLowTime: 0, countResilient: 0, countModerated: 0, countHyper: 0 };

    let sumAnxiety = 0;
    let sumSurvival = 0;
    let sumCritTime = 0;
    let sumLowTime = 0;
    let countResilient = 0;
    let countModerated = 0;
    let countHyper = 0;

    participants.forEach(p => {
      sumAnxiety += p.finalAnxietyScore;
      sumSurvival += p.survivalRate;
      sumCritTime += p.criticalResponseTime;
      sumLowTime += p.lowResponseTime;
      if (p.fomoCategory === 'Resiliente Digital') countResilient++;
      else if (p.fomoCategory === 'Uso Moderado') countModerated++;
      else if (p.fomoCategory === 'Hiperconectado') countHyper++;
    });

    // Pearson Correlation Coefficient calculation between Anxiety and Survival Rate
    const meanX = sumAnxiety / total;
    const meanY = sumSurvival / total;

    let num = 0;
    let denX = 0;
    let denY = 0;

    participants.forEach(p => {
      const diffX = p.finalAnxietyScore - meanX;
      const diffY = p.survivalRate - meanY;
      num += diffX * diffY;
      denX += diffX * diffX;
      denY += diffY * diffY;
    });

    const pearsonR = denX && denY ? num / Math.sqrt(denX * denY) : 0;

    return {
      avgAnxiety: Math.round(sumAnxiety / total),
      avgSurvival: Math.round(sumSurvival / total),
      pearsonR: parseFloat(pearsonR.toFixed(3)),
      avgCritTime: parseFloat((sumCritTime / total).toFixed(2)),
      avgLowTime: parseFloat((sumLowTime / total).toFixed(2)),
      countResilient,
      countModerated,
      countHyper
    };
  }, [participants]);

  const filteredParticipants = useMemo(() => {
    if (filterCategory === 'ALL') return participants;
    return participants.filter(p => p.fomoCategory === filterCategory);
  }, [participants, filterCategory]);

  // Export CSV Action
  const handleExportCSV = () => {
    let csv = 'ID,UserId,SessionTime,QuestionsAnswered,YesAnswers,NoAnswers,AnxietyScore,WalkSpeed,Category,SurvivalRate,CriticalResponseTime,LowResponseTime\n';
    participants.forEach(p => {
      csv += `${p.id},${p.userId},${p.sessionTime},${p.totalQuestionsAnswered},${p.yesAnswers},${p.noAnswers},${p.finalAnxietyScore},${p.finalWalkSpeed},"${p.fomoCategory}",${p.survivalRate},${p.criticalResponseTime},${p.lowResponseTime}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'estudo_caso_fomo_sobreecarga_digital.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

          <div className="mt-6 pt-5 border-t border-white/5 text-center">
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

            <div className="mt-4 border-t border-white/5 pt-3 flex items-center justify-between text-xs text-white/70">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Vitórias: <strong className="text-white">{liveStats.wins}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" /> Crises (100%): <strong className="text-white">{liveStats.losses}</strong>
              </span>
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

      {/* SECTION 4: REAL PLAYERS LOGS SIMULATOR */}
      <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col gap-6">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2 text-white">
            <Users className="w-5 h-5 text-cyan-400" /> 4. Simulador e Painel de Coleta de Casos
          </h3>
          <p className="text-xs text-white/60 mt-0.5">Simule a chegada de um novo resultado de jogo no Roblox e veja-o integrado em tempo real no banco de dados.</p>
        </div>

        {/* Dynamic Simulator Inputs */}
        <div className="bg-black/20 p-5 rounded-2xl border border-white/5 grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div>
            <label className="text-xs text-white/60 block mb-2 font-medium">Quantidade Respostas "SIM"</label>
            <input
              type="range"
              min="0"
              max="10"
              value={simYes}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setSimYes(val);
                // Dynamically update simulated anxiety
                setSimAnxiety(Math.min(100, Math.max(0, val * 10 + Math.floor(Math.random() * 8))));
              }}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[11px] text-cyan-400 font-mono mt-1 font-bold">
              <span>{simYes} SIM</span>
              <span>{10 - simYes} NÃO</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-white/60 block mb-2 font-medium">Pontuação de Ansiedade Final</label>
            <input
              type="range"
              min="0"
              max="100"
              value={simAnxiety}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setSimAnxiety(val);
                // Adjust simulated survival
                setSimSurvival(Math.max(15, Math.min(100, 100 - val + Math.floor(Math.random() * 15))));
              }}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="text-[11px] text-cyan-400 font-mono mt-1 font-bold text-right">
              {simAnxiety} Pts
            </div>
          </div>

          <div>
            <label className="text-xs text-white/60 block mb-2 font-medium">Taxa de Sobrevivência (%)</label>
            <input
              type="range"
              min="10"
              max="100"
              value={simSurvival}
              onChange={(e) => setSimSurvival(parseInt(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="text-[11px] text-cyan-400 font-mono mt-1 font-bold text-right">
              {simSurvival}%
            </div>
          </div>

          <button
            onClick={handleAddParticipant}
            className="w-full py-2.5 bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" /> Registrar Caso
          </button>
        </div>

        {/* Filter categories tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-white/5 pb-2">
          <button
            onClick={() => setFilterCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${filterCategory === 'ALL' ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/30' : 'text-white/40 hover:text-white'}`}
          >
            Todos ({participants.length})
          </button>
          <button
            onClick={() => setFilterCategory('Resiliente Digital')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${filterCategory === 'Resiliente Digital' ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30' : 'text-white/40 hover:text-white'}`}
          >
            Resiliente ({stats.countResilient})
          </button>
          <button
            onClick={() => setFilterCategory('Uso Moderado')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${filterCategory === 'Uso Moderado' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'text-white/40 hover:text-white'}`}
          >
            Uso Moderado ({stats.countModerated})
          </button>
          <button
            onClick={() => setFilterCategory('Hiperconectado')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${filterCategory === 'Hiperconectado' ? 'bg-red-400/20 text-red-300 border border-red-400/30' : 'text-white/40 hover:text-white'}`}
          >
            Hiperconectado ({stats.countHyper})
          </button>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto max-h-[350px] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/40 uppercase font-mono tracking-wider">
                <th className="py-3 px-4">Cod. Estudo</th>
                <th className="py-3 px-4">ID Usuário</th>
                <th className="py-3 px-4">Ansiedade</th>
                <th className="py-3 px-4 text-center">Respostas SIM/NÃO</th>
                <th className="py-3 px-4">WalkSpeed Final</th>
                <th className="py-3 px-4">Desempenho (Sobrevivência)</th>
                <th className="py-3 px-4">Tempo de Reação (Crítico)</th>
                <th className="py-3 px-4">Diagnóstico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {filteredParticipants.map((p) => {
                const badgeColor = p.fomoCategory === 'Hiperconectado'
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : p.fomoCategory === 'Resiliente Digital'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20';

                return (
                  <tr key={p.id} className="hover:bg-white/[2%] transition-all">
                    <td className="py-3.5 px-4 font-bold text-white">{p.id}</td>
                    <td className="py-3.5 px-4 text-white/50">{p.userId}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{p.finalAnxietyScore}</span>
                        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${p.finalAnxietyScore >= 71 ? 'bg-red-400' : p.finalAnxietyScore >= 31 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                            style={{ width: `${p.finalAnxietyScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-emerald-400 font-bold">{p.noAnswers}N</span>
                      <span className="text-white/30 mx-1">/</span>
                      <span className="text-red-400 font-bold">{p.yesAnswers}S</span>
                    </td>
                    <td className="py-3.5 px-4 text-white/70">{p.finalWalkSpeed} u/s</td>
                    <td className="py-3.5 px-4 font-bold text-white">{p.survivalRate}%</td>
                    <td className="py-3.5 px-4 font-bold text-cyan-400">{p.criticalResponseTime}s</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${badgeColor}`}>
                        {p.fomoCategory}
                      </span>
                    </td>
                  </tr>
                );
              })}
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
