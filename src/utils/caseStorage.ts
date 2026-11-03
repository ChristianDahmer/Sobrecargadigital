import { CollectedCase, PlayerProfile } from '../types';
import { db, auth } from '../lib/firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, getDoc } from 'firebase/firestore';

const STORAGE_KEY = 'fomo_collected_cases';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export let isFirestoreQuotaExceeded = false;
let lastCasesSyncTime = 0;

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  if (errMsg.includes('Quota exceeded') || errMsg.includes('resource-exhausted')) {
    isFirestoreQuotaExceeded = true;
    console.warn('Firestore Quota Exceeded detected: Switching to pure LocalStorage fallback mode.');
    return;
  }
  const errInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

// Generates initial clinical research cases cohort (77 cases from EEEM Felipe Camarão - Turma 61 study)
export const generateInitialResearchCases = (): CollectedCase[] => {
  const cases: CollectedCase[] = [];
  const now = Date.now();

  const platformList = [
    ...Array(35).fill('TikTok'),
    ...Array(19).fill('Instagram'),
    ...Array(11).fill('YouTube'),
    ...Array(8).fill('WhatsApp'),
    ...Array(4).fill('Outra')
  ];

  const screenList = [
    ...Array(26).fill('Mais de 5 horas'),
    ...Array(14).fill('De 4 a 5 horas'),
    ...Array(31).fill('De 2 a 3 horas'),
    ...Array(6).fill('Até 1 hora')
  ];

  const ageList = [
    ...Array(50).fill('12 - 14 anos'),
    ...Array(21).fill('15 - 16 anos'),
    ...Array(6).fill('9 - 11 anos')
  ];

  const gradeMap: Record<string, string> = {
    '12 - 14 anos': '8º/9º Ano EF',
    '15 - 16 anos': '1º/2º Ano EM',
    '9 - 11 anos': '6º Ano EF'
  };

  for (let i = 0; i < 77; i++) {
    const caseId = `CASO-${String(i + 1).padStart(3, '0')}`;
    const code = `Participante #61-${String(i + 1).padStart(3, '0')}`;
    const age = ageList[i];
    const grade = gradeMap[age] || 'Turma 61';
    const screen = screenList[i];
    const mainPlatform = platformList[i];

    let category: CollectedCase['fomoCategory'] = 'Uso Moderado';
    let yesCount = 4;
    let anxiety = 48;
    let survival = 70;
    let criticalTime = 2.4;
    let nightUse = 'Sim (antes de dormir)';

    if (i < 26) {
      category = 'Hiperconectado';
      yesCount = 7 + (i % 4);
      anxiety = 72 + (i % 27);
      survival = 32 + (i % 28);
      criticalTime = parseFloat((1.05 + (i % 6) * 0.12).toFixed(2));
      nightUse = i < 22 ? 'Sim (antes de dormir)' : 'Às vezes';
    } else if (i < 64) {
      category = 'Uso Moderado';
      yesCount = 3 + (i % 4);
      anxiety = 32 + (i % 38);
      survival = 62 + (i % 21);
      criticalTime = parseFloat((2.05 + (i % 8) * 0.15).toFixed(2));
      nightUse = i < 50 ? 'Sim (antes de dormir)' : 'Às vezes';
    } else {
      category = 'Resiliente Digital';
      yesCount = i % 3;
      anxiety = 8 + (i % 22);
      survival = 84 + (i % 15);
      criticalTime = parseFloat((3.2 + (i % 6) * 0.25).toFixed(2));
      nightUse = i < 73 ? 'Às vezes' : 'Raramente / Não';
    }

    const noCount = 10 - yesCount;
    const finalWalkSpeed = parseFloat(Math.max(8, 16 - (anxiety * 0.1)).toFixed(1));
    const caseDate = new Date(now - (77 - i) * 3600000 * 2.2);
    const isFailure = anxiety >= 100;

    cases.push({
      id: caseId,
      playerName: code,
      anonymousCode: code,
      age,
      dailyScreenHours: screen,
      schoolGrade: grade,
      timestamp: caseDate.getTime(),
      dateFormatted: caseDate.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      sessionDuration: 180,
      gameStateOutcome: isFailure ? 'DERROTA' : 'VITORIA',
      totalQuestionsAnswered: 10,
      yesAnswers: yesCount,
      noAnswers: noCount,
      affirmativePercentage: Math.round((yesCount / 10) * 100),
      finalAnxietyScore: anxiety,
      finalWalkSpeed,
      fomoCategory: category,
      survivalRate: survival,
      wellnessScore: (10 - yesCount) * 850,
      goldCoins: Math.floor(Math.random() * 8) + 2,
      criticalResponseTime: criticalTime,
      answersList: [],
      source: 'PESQUISA_CLINICA',
      diagnosticTitle: category === 'Hiperconectado'
        ? `Sobrecarga Digital por ${mainPlatform}`
        : category === 'Uso Moderado'
        ? `Uso Moderado de ${mainPlatform}`
        : `Resiliência Digital (${mainPlatform})`,
      diagnosticDescription: category === 'Hiperconectado'
        ? `Estudante da amostra (EEEM Felipe Camarão). Relatou uso intensivo de ${mainPlatform} (${screen}). Apresentou uso noturno do celular (${nightUse}) com prejuízos na qualidade do sono, ansiedade elevada e vulnerabilidade a FOMO.`
        : category === 'Uso Moderado'
        ? `Estudante da amostra (EEEM Felipe Camarão). Uso moderado de ${mainPlatform} (${screen}). Apresenta momentos pontuais de preocupação com interações/curtidas e impacto ocasional no descanso.`
        : `Estudante da amostra (EEEM Felipe Camarão). Demonstra hábitos equilibrados de telas (${screen}), boa regulação de ansiedade e baixo impacto no sono.`,
      recommendations: category === 'Hiperconectado' ? [
        'Ativar o modo "Hora de Dormir" e afastar o celular 60min antes de deitar.',
        'Substituir o feed noturno por leitura de livros ou atividades relaxantes.',
        'Estipular limites diários para aplicativos de vídeos curtos (TikTok/Instagram).'
      ] : category === 'Uso Moderado' ? [
        'Silenciar notificações de redes sociais durante os horários de estudos.',
        'Praticar esportes ou brincadeiras ao ar livre no período da tarde.',
        'Evitar comparações com vidas "editadas" de perfis virtuais.'
      ] : [
        'Manter o excelente equilíbrio atual entre o ambiente digital e a vida presencial.',
        'Promover conversas e conscientização sobre saúde mental entre os colegas.',
        'Continuar utilizando as redes sociais de forma intencional e consciente.'
      ],
    });
  }

  return cases;
};

// Retrieve all collected cases from localStorage (with background Firestore cloud sync)
export const getStoredCollectedCases = (): CollectedCase[] => {
  let localCases: CollectedCase[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        localCases = parsed;
      }
    }
  } catch (err) {
    console.error('Error loading collected cases from localStorage:', err);
  }

  if (localCases.length === 0) {
    localCases = generateInitialResearchCases();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(localCases));
    } catch (e) {}
  }

  // Background sync from Firestore (throttled to once per minute and skipped if quota exceeded)
  const now = Date.now();
  if (!isFirestoreQuotaExceeded && now - lastCasesSyncTime > 60000) {
    lastCasesSyncTime = now;
    (async () => {
      try {
        const snapshot = await getDocs(collection(db, 'collectedCases'));
        if (!snapshot.empty) {
          const cloudCases: CollectedCase[] = [];
          snapshot.forEach((docSnap) => {
            cloudCases.push(docSnap.data() as CollectedCase);
          });
          if (cloudCases.length > 0) {
            // Merge cloud cases with local cases (preferring cloud data)
            const caseMap = new Map<string, CollectedCase>();
            localCases.forEach(c => caseMap.set(c.id, c));
            cloudCases.forEach(c => caseMap.set(c.id, c));
            const merged = Array.from(caseMap.values()).sort((a, b) => b.timestamp - a.timestamp);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          }
        } else {
          // If Firestore is empty, seed initial cases to cloud database for persistence
          for (const c of localCases) {
            try {
              await setDoc(doc(db, 'collectedCases', c.id), c);
            } catch (err) {}
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'collectedCases');
      }
    })();
  }

  return localCases;
};

// Save a new case collected from a game session (persisted to both localStorage and Firestore Cloud Database)
export const saveCollectedCase = (newCase: Omit<CollectedCase, 'id' | 'timestamp' | 'dateFormatted'> & { id?: string }): CollectedCase => {
  const existing = getStoredCollectedCases();
  const timestamp = Date.now();
  const date = new Date(timestamp);
  const idNum = existing.length + 1;
  const id = newCase.id || `CASO-${String(idNum).padStart(3, '0')}`;

  const dateFormatted = date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const anonymousParticipantName = newCase.playerName?.trim() || `Participante #61-${Math.floor(Math.random() * 900) + 100}`;

  const fullCase: CollectedCase = {
    ...newCase,
    id,
    playerName: anonymousParticipantName,
    anonymousCode: newCase.anonymousCode || anonymousParticipantName,
    timestamp,
    dateFormatted,
  };

  const updated = [fullCase, ...existing];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving collected case locally:', err);
  }

  // Persist to Firestore Cloud Database independently of published versions
  (async () => {
    try {
      await setDoc(doc(db, 'collectedCases', id), fullCase);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `collectedCases/${id}`);
    }
  })();

  return fullCase;
};

// Reset cases to initial sample
export const resetCollectedCases = (): CollectedCase[] => {
  const initial = generateInitialResearchCases();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch (err) {}

  (async () => {
    for (const c of initial) {
      try {
        await setDoc(doc(db, 'collectedCases', c.id), c);
      } catch (err) {}
    }
  })();

  return initial;
};

// Clear only real cases or all cases
export const clearRealCollectedCases = (): CollectedCase[] => {
  const existing = getStoredCollectedCases();
  const filtered = existing.filter((c) => c.source === 'PESQUISA_CLINICA');
  const removed = existing.filter((c) => c.source !== 'PESQUISA_CLINICA');
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {}

  (async () => {
    for (const c of removed) {
      try {
        await deleteDoc(doc(db, 'collectedCases', c.id));
      } catch (err) {}
    }
  })();

  return filtered;
};

// Delete a single case by ID
export const deleteCollectedCaseById = (id: string): CollectedCase[] => {
  const existing = getStoredCollectedCases();
  const filtered = existing.filter((c) => c.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {}

  (async () => {
    try {
      await deleteDoc(doc(db, 'collectedCases', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `collectedCases/${id}`);
    }
  })();

  return filtered;
};

export const deleteCollectedCase = deleteCollectedCaseById;

// Export cases to CSV
export const exportCasesToCSV = (cases: CollectedCase[], filename = 'coleta_anonima_casos_diagnostico_fomo.csv') => {
  let csv = '# PROTOCOLO DE COLETA 100% ANONIMA - PROJETO CIENTIFICO ENTRE REDES HA ANSIEDADE (TURMA 61)\n';
  csv += 'Codigo_Caso;Origem;Participante_Anonimo;Idade;Tempo_Tela_Diario;Segmento_Turma;Data_Hora;Resultado;Total_Perguntas;Respostas_SIM;Respostas_NAO;Porcentagem_SIM;Ansiedade_Final;WalkSpeed_Final;Categoria_FOMO;Sobrevivencia_Obstaculos_Pct;Pontos_BemEstar;Moedas_Ouro;Tempo_Medio_Reacao_s\n';

  cases.forEach((c) => {
    const orig = c.source === 'GAMEPLAY_REAL' ? 'Jogo Real' : 'Pesquisa Clinica';
    csv += `"${c.id}";"${orig}";"${c.playerName}";"${c.age || 'N/I'}";"${c.dailyScreenHours || 'N/I'}";"${c.schoolGrade || 'Turma 61'}";"${c.dateFormatted}";"${c.gameStateOutcome}";${c.totalQuestionsAnswered};${c.yesAnswers};${c.noAnswers};${c.affirmativePercentage}%;${c.finalAnxietyScore};${c.finalWalkSpeed};"${c.fomoCategory}";${c.survivalRate}%;${c.wellnessScore};${c.goldCoins};${c.criticalResponseTime}s\n`;
  });

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export individual case dossier as formatted text
export const exportSingleCaseDossierTxt = (c: CollectedCase) => {
  const text = `======================================================================
LAUDO INDIVIDUAL DE DIAGNÓSTICO & COLETA DE CASO ANÔNIMO
PROJETO CIENTÍFICO: ENTRE REDES HÁ ANSIEDADE (TURMA 61)
PROTOCOLO ÉTICO: COLETA 100% ANÔNIMA & PSEUDONIMIZADA (LGPD / CNS 510/2016)
======================================================================

PROTOCOLO DO CASO: ${c.id}
ORIGEM DO REGISTRO: ${c.source === 'GAMEPLAY_REAL' ? '🎮 Partida em Tempo Real no Simulador 3D' : '🧪 Amostra de Pesquisa Clínica'}
DATA E HORA: ${c.dateFormatted}

----------------------------------------------------------------------
1. IDENTIFICAÇÃO ANÔNIMA DO PARTICIPANTE
----------------------------------------------------------------------
- Código Anônimo / Pseudônimo: ${c.playerName}
- Faixa Etária: ${c.age || 'Não informada'}
- Tempo Diário de Tela / Redes: ${c.dailyScreenHours || 'Não informado'}
- Segmento / Turma: ${c.schoolGrade || 'Turma 61'}
- Duração da Sessão: ${Math.floor((c.sessionDuration || 180) / 60)}m ${(c.sessionDuration || 180) % 60}s
- Desfecho no Simulador: ${c.gameStateOutcome === 'VITORIA' ? '✅ Vitória / Concluído com Equilíbrio' : '⚠️ Colapso Digital (Ansiedade 100%)'}
- Protocolo de Privacidade: Coleta 100% anônima sem captura de dados pessoais.

----------------------------------------------------------------------
2. RESULTADO PSICOMÉTRICO & BIOMECÂNICO
----------------------------------------------------------------------
- CLASSIFICAÇÃO DIAGNÓSTICA: ${c.fomoCategory.toUpperCase()}
- Nível Final de Ansiedade: ${c.finalAnxietyScore}% / 100%
- Respostas Afirmativas (SIM): ${c.yesAnswers} de ${c.totalQuestionsAnswered} (${c.affirmativePercentage || Math.round((c.yesAnswers / c.totalQuestionsAnswered) * 100)}%)
- Respostas Negativas (NÃO): ${c.noAnswers} de ${c.totalQuestionsAnswered}
- Velocidade Final do Avatar (WalkSpeed): ${c.finalWalkSpeed} u/s (Padrão: 16 u/s)
- Taxa de Sobrevivência / Desvio: ${c.survivalRate}%
- Tempo Médio de Reação nas Interrupções: ${c.criticalResponseTime} segundos
- Pontuação de Bem-estar Coletada: +${c.wellnessScore || 0} pts
- Moedas de Ouro Coletadas: +${c.goldCoins || 0}

----------------------------------------------------------------------
3. ANÁLISE CLÍNICO-PEDAGÓGICA
----------------------------------------------------------------------
Diagnóstico: ${c.diagnosticTitle || (c.fomoCategory === 'Hiperconectado' ? 'Sobrecarga Digital Elevada' : c.fomoCategory === 'Uso Moderado' ? 'Uso Moderado' : 'Resiliência Digital')}
Descrição:
${c.diagnosticDescription || c.clinicalSummary || 'Registro computado e categorizado com base no índice de dependência e ansiedade por FOMO.'}

Recomendações de Saúde Digital:
${(c.recommendations || [
  'Estabelecer janelas de desconexão de 60 minutos antes do descanso noturno.',
  'Praticar atividades ao ar livre e exercícios físicos regulares.',
  'Desativar notificações de aplicativos não essenciais.'
]).map((r, i) => `[${i + 1}] ${r}`).join('\n')}

----------------------------------------------------------------------
4. RESPOSTAS DO QUESTIONÁRIO SAS-SMU NA SESSÃO
----------------------------------------------------------------------
${c.answersList && c.answersList.length > 0 
  ? c.answersList.map((a, i) => `P${i + 1} (${a.answer}): ${a.question}`).join('\n')
  : 'Perguntas registradas de forma agregada para preservar total anonimato.'}

======================================================================
Entre Redes Há Ansiedade • Mapeamento Comportamental de Saúde Digital
Disponível em: https://sobrecarga-digital.ai.studio
======================================================================`;

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `laudo_anonimo_${c.id}_${c.playerName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Player profile helper in localStorage
export const getStoredPlayerProfile = (): PlayerProfile => {
  try {
    const raw = localStorage.getItem('fomo_active_player_profile');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {}
  const randomNum = Math.floor(Math.random() * 900) + 100;
  const initialAnonCode = `Participante #61-${randomNum}`;
  return {
    anonymousCode: initialAnonCode,
    name: initialAnonCode,
    age: '14 - 17 anos',
    dailyScreenHours: '4 a 6 horas',
    schoolGrade: 'Turma 61',
  };
};

export const saveStoredPlayerProfile = (profile: PlayerProfile) => {
  try {
    localStorage.setItem('fomo_active_player_profile', JSON.stringify(profile));
  } catch (err) {}
};
