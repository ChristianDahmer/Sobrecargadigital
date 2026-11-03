import { DataCollectionAudience } from '../types';

export const DEFAULT_DATA_COLLECTION_AUDIENCES: DataCollectionAudience[] = [
  {
    id: 'audiencia_criancas_9_11',
    name: 'Crianças & Anos Iniciais (9 a 11 anos)',
    ageRange: '9 - 11 anos',
    categoryLabel: 'Crianças (5º/6º Ano EF)',
    schoolGradeDefault: '6º Ano EF',
    dailyScreenHoursDefault: '2 a 4 horas',
    focusPlatforms: ['Roblox', 'YouTube Kids', 'TikTok'],
    description: 'Investigação do impacto do acesso precoce a algoritmos de recompensa instantânea e vídeos curtos. Foco em impulsividade e brincadeiras ao ar livre.',
    ethicalProtocol: 'TALE (Termo de Assentimento Livre e Esclarecido) + TCLE Parental (Resolução CNS 510/2016)',
    targetSampleSize: 50,
    color: 'emerald',
  },
  {
    id: 'audiencia_adolescentes_12_14',
    name: 'Adolescentes & Anos Finais (12 a 14 anos) • Turma 61',
    ageRange: '12 - 14 anos',
    categoryLabel: 'Adolescentes (7º ao 9º Ano EF)',
    schoolGradeDefault: 'Turma 61 (EEEM Felipe Camarão)',
    dailyScreenHoursDefault: '4 a 6 horas',
    focusPlatforms: ['TikTok', 'Instagram', 'WhatsApp', 'Discord'],
    description: 'Amostra clínica de referência do projeto científico "Entre Redes Há Ansiedade". Foco em FOMO, dependência de validação social, likes e sono fragmentado.',
    ethicalProtocol: 'Comitê de Ética em Pesquisa / Resolução CNS 510/2016 (Amostra de 77 casos catalogados)',
    targetSampleSize: 77,
    color: 'cyan',
  },
  {
    id: 'audiencia_ensino_medio_15_17',
    name: 'Jovens & Ensino Médio (15 a 17 anos)',
    ageRange: '15 - 17 anos',
    categoryLabel: 'Jovens (1º ao 3º Ano EM / Vestibulandos)',
    schoolGradeDefault: '1º ao 3º Ano EM',
    dailyScreenHoursDefault: 'Mais de 6 horas',
    focusPlatforms: ['Instagram', 'TikTok', 'WhatsApp', 'X (Twitter)'],
    description: 'Sobrecarga de estímulos, pressão por desempenho acadêmico, comparação social estética e hábito de rolar o feed durante a madrugada.',
    ethicalProtocol: 'Assentimento Ético e Consentimento dos Responsáveis (LGPD & CNS 510/2016)',
    targetSampleSize: 60,
    color: 'indigo',
  },
  {
    id: 'audiencia_jovens_adultos_18_24',
    name: 'Universitários & Jovens Adultos (18 a 24 anos)',
    ageRange: '18 - 24 anos',
    categoryLabel: 'Ensino Superior & Início Profissional',
    schoolGradeDefault: 'Graduação / Ensino Superior',
    dailyScreenHoursDefault: 'Mais de 6 horas',
    focusPlatforms: ['Instagram', 'LinkedIn', 'WhatsApp', 'YouTube'],
    description: 'Mapeamento de ansiedade de carreira, burnout universitário, multitarefa compulsiva e constante sensação de perder oportunidades profissionais.',
    ethicalProtocol: 'TCLE Direto / Protocolo Ético Acadêmico',
    targetSampleSize: 40,
    color: 'purple',
  },
  {
    id: 'audiencia_adultos_25_59',
    name: 'Adultos & Pais / Educadores (25 a 59 anos)',
    ageRange: '25 - 59 anos',
    categoryLabel: 'Adultos (Mercado de Trabalho & Família)',
    schoolGradeDefault: 'Profissional / Pós-Graduação',
    dailyScreenHoursDefault: '4 a 6 horas',
    focusPlatforms: ['WhatsApp', 'Instagram', 'YouTube', 'Notícias'],
    description: 'Fadiga informacional, hiperconectividade do trabalho remoto, estresse de mediação parental do tempo de tela dos filhos e dificuldade de desconexão.',
    ethicalProtocol: 'Protocolo Ético de Coleta com Adultos (LGPD)',
    targetSampleSize: 35,
    color: 'amber',
  },
  {
    id: 'audiencia_seniores_60',
    name: 'Terceira Idade & Cidadãos Seniores (60+ anos)',
    ageRange: '60+ anos',
    categoryLabel: 'Maturidade & Inclusão Digital',
    schoolGradeDefault: 'Comunidade / Projetos Sociais',
    dailyScreenHoursDefault: '2 a 4 horas',
    focusPlatforms: ['WhatsApp', 'Facebook', 'YouTube'],
    description: 'Ansiedade provocada por enxurrada de mensagens em grupos familiares, medo de fraudes digitais e fadiga cognitiva decorrente do excesso de telas.',
    ethicalProtocol: 'Protocolo de Inclusão Digital Segura na Terceira Idade',
    targetSampleSize: 30,
    color: 'rose',
  },
];

const AUDIENCES_STORAGE_KEY = 'fomo_target_audiences';
const ACTIVE_AUDIENCE_KEY = 'fomo_active_target_audience_id';

export const getStoredAudiences = (): DataCollectionAudience[] => {
  try {
    const raw = localStorage.getItem(AUDIENCES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with defaults to ensure all predefined exist
        const customOnes = parsed.filter(a => a.isCustom);
        const map = new Map<string, DataCollectionAudience>();
        DEFAULT_DATA_COLLECTION_AUDIENCES.forEach(a => map.set(a.id, a));
        parsed.forEach(a => map.set(a.id, a));
        return Array.from(map.values());
      }
    }
  } catch (e) {
    console.error('Error loading target audiences from storage:', e);
  }
  return DEFAULT_DATA_COLLECTION_AUDIENCES;
};

export const saveStoredAudiences = (audiences: DataCollectionAudience[]) => {
  try {
    localStorage.setItem(AUDIENCES_STORAGE_KEY, JSON.stringify(audiences));
  } catch (e) {
    console.error('Error saving target audiences to storage:', e);
  }
};

export const getStoredActiveAudienceId = (): string => {
  try {
    const id = localStorage.getItem(ACTIVE_AUDIENCE_KEY);
    if (id) return id;
  } catch (e) {}
  return 'audiencia_adolescentes_12_14';
};

export const saveStoredActiveAudienceId = (id: string) => {
  try {
    localStorage.setItem(ACTIVE_AUDIENCE_KEY, id);
  } catch (e) {}
};

export const findAudienceById = (id?: string, list?: DataCollectionAudience[]): DataCollectionAudience => {
  const audiences = list || getStoredAudiences();
  const found = audiences.find(a => a.id === id);
  return found || audiences.find(a => a.id === 'audiencia_adolescentes_12_14') || DEFAULT_DATA_COLLECTION_AUDIENCES[1];
};
