import { SASQuestion } from '../types';

export interface SASQuestionItem {
  id: number;
  text: string;
  cat: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAIXO';
  aSim: number;
  vSim: number;
  aNao: number;
  zenNao?: boolean;
}

export const SAS_QUESTION_DATABASE: SASQuestionItem[] = [
  // --- NIVEL CRITICO (+20 Ansiedade | +0.5x Velocidade) ---
  { id: 1, text: "Sente ansiedade ou desconforto ao ficar desconectado por algumas horas?", cat: "CRITICO", aSim: 20, vSim: 0.5, aNao: 15, zenNao: true },
  { id: 2, text: "Sente o celular vibrar no bolso mesmo quando ele não tocou (vibração fantasma)?", cat: "CRITICO", aSim: 20, vSim: 0.5, aNao: 15, zenNao: true },
  { id: 3, text: "Fica angustiado ao pensar em como seria sua vida se a internet deixasse de existir?", cat: "CRITICO", aSim: 20, vSim: 0.5, aNao: 15, zenNao: true },
  { id: 4, text: "Sente um vazio interno ou tédio profundo quando fica sem bateria ou sem sinal?", cat: "CRITICO", aSim: 20, vSim: 0.5, aNao: 15, zenNao: true },
  { id: 5, text: "Acredita que perdeu momentos importantes da sua vida por estar olhando para uma tela?", cat: "CRITICO", aSim: 20, vSim: 0.5, aNao: 15, zenNao: true },
  { id: 6, text: "Sente pânico ao perceber que esqueceu o celular em casa ao sair para um compromisso?", cat: "CRITICO", aSim: 20, vSim: 0.5, aNao: 15, zenNao: true },
  { id: 7, text: "Sente pânico quando alguém te liga por chamada de voz sem avisar antes?", cat: "CRITICO", aSim: 20, vSim: 0.5, aNao: 15, zenNao: true },
  { id: 8, text: "Acorda no meio da noite e olha a tela para ver se há notificações?", cat: "CRITICO", aSim: 20, vSim: 0.5, aNao: 15, zenNao: true },
  { id: 9, text: "Sente culpa pelo tempo diário total que passa em frente à tela?", cat: "CRITICO", aSim: 20, vSim: 0.5, aNao: 15, zenNao: true },
  { id: 10, text: "Acha que as redes sociais estão deliberadamente viciando você?", cat: "CRITICO", aSim: 20, vSim: 0.5, aNao: 15, zenNao: true },

  // --- NIVEL ALTO (+15 Ansiedade | +0.4x Velocidade) ---
  { id: 11, text: "Sente urgência em responder mensagens assim que a notificação toca?", cat: "ALTO", aSim: 15, vSim: 0.4, aNao: 10, zenNao: true },
  { id: 12, text: "Perdeu a noção do tempo navegando em feeds curtos recentemente?", cat: "ALTO", aSim: 15, vSim: 0.4, aNao: 10, zenNao: true },
  { id: 13, text: "Sente que a vida das pessoas nas redes parece mais interessante que a sua?", cat: "ALTO", aSim: 15, vSim: 0.4, aNao: 10, zenNao: true },
  { id: 14, text: "Sente ansiedade quando vê o ícone de aplicativo com dezenas de mensagens não lidas?", cat: "ALTO", aSim: 15, vSim: 0.4, aNao: 10, zenNao: true },
  { id: 15, text: "Consome conteúdos em vídeo curtindo, pulando ou arrastando a tela sem assistir até o final?", cat: "ALTO", aSim: 15, vSim: 0.4, aNao: 10, zenNao: true },
  { id: 16, text: "Interrompe uma tarefa importante para responder a uma mensagem que acabou de chegar?", cat: "ALTO", aSim: 15, vSim: 0.4, aNao: 10, zenNao: true },
  { id: 17, text: "Sente inveja ao ver postagens de viagens ou conquistas de conhecidos?", cat: "ALTO", aSim: 15, vSim: 0.4, aNao: 10, zenNao: true },
  { id: 18, text: "Sente frustração ao ver fotos de festas ou viagens para as quais não foi convidado?", cat: "ALTO", aSim: 15, vSim: 0.4, aNao: 10, zenNao: true },
  { id: 19, text: "Fica angustiado ao ver a bateria do celular abaixo de 20%?", cat: "ALTO", aSim: 15, vSim: 0.4, aNao: 10, zenNao: true },
  { id: 20, text: "Procura saber se o local tem Wi-Fi gratuito assim que chega a um restaurante?", cat: "ALTO", aSim: 15, vSim: 0.4, aNao: 10, zenNao: true },
  { id: 21, text: "Usa o celular como uma forma de fugir dos seus problemas diários?", cat: "ALTO", aSim: 15, vSim: 0.4, aNao: 10, zenNao: true },
  { id: 22, text: "Sente que seu humor muda drasticamente dependendo do que lê na internet?", cat: "ALTO", aSim: 15, vSim: 0.4, aNao: 10, zenNao: true },
  { id: 23, text: "Sente necessidade de checar as redes sociais para não perder nada importante do que os outros estão fazendo?", cat: "ALTO", aSim: 15, vSim: 0.4, aNao: 10, zenNao: true },
  { id: 24, text: "Fica irritado quando a conexão com a internet fica lenta ou cai?", cat: "ALTO", aSim: 15, vSim: 0.4, aNao: 10, zenNao: true },
  { id: 25, text: "Sente dificuldades de concentração em tarefas que exigem esforço mental contínuo?", cat: "ALTO", aSim: 15, vSim: 0.4, aNao: 10, zenNao: true },
  { id: 26, text: "Dificilmente consegue ler um texto longo do início ao fim sem checar a tela?", cat: "ALTO", aSim: 15, vSim: 0.4, aNao: 10, zenNao: true },
  { id: 27, text: "Já tentou fazer um 'detox digital' e desistiu nas primeiras horas?", cat: "ALTO", aSim: 15, vSim: 0.4, aNao: 10, zenNao: true },
  { id: 28, text: "Sente ansiedade se alguém que você conhece não te segue de volta?", cat: "ALTO", aSim: 15, vSim: 0.4, aNao: 10, zenNao: true },
  { id: 29, text: "Sente a necessidade de responder e-mails de trabalho fora do seu expediente?", cat: "ALTO", aSim: 15, vSim: 0.4, aNao: 10, zenNao: true },
  { id: 30, text: "Já pegou o celular para ver as horas ou uma mensagem e acabou caindo em um feed sem nem perceber?", cat: "ALTO", aSim: 15, vSim: 0.4, aNao: 10, zenNao: true },
  { id: 31, text: "Sente que a sua autoestima depende da aprovação que recebe online?", cat: "ALTO", aSim: 15, vSim: 0.4, aNao: 10, zenNao: true },
  { id: 32, text: "Adia o momento de dormir para continuar assistindo a vídeos curtos?", cat: "ALTO", aSim: 15, vSim: 0.4, aNao: 10, zenNao: true },
  { id: 33, text: "Leva o celular para a cama antes de dormir?", cat: "ALTO", aSim: 15, vSim: 0.4, aNao: 10, zenNao: true },
  { id: 34, text: "Fica incomodado se alguém demora horas para responder sua mensagem?", cat: "ALTO", aSim: 15, vSim: 0.4, aNao: 10, zenNao: true },
  { id: 35, text: "Entra em um aplicativo de fotos/vídeos sem nenhum objetivo específico?", cat: "ALTO", aSim: 15, vSim: 0.4, aNao: 10, zenNao: true },

  // --- NIVEL MEDIO (+12 Ansiedade | +0.3x Velocidade) ---
  { id: 36, text: "Você checou o celular nos primeiros 5 minutos após acordar hoje?", cat: "MEDIO", aSim: 10, vSim: 0.3, aNao: 8, zenNao: false },
  { id: 37, text: "Você costuma usar telas e redes sociais enquanto faz as refeições?", cat: "MEDIO", aSim: 12, vSim: 0.3, aNao: 8, zenNao: false },
  { id: 38, text: "Quando assiste a um vídeo ou série, costuma usar a velocidade 1.5x ou 2.0x para terminar mais rápido?", cat: "MEDIO", aSim: 10, vSim: 0.3, aNao: 8, zenNao: false },
  { id: 39, text: "Compara sua rotina com a rotina perfeita mostrada por influenciadores?", cat: "MEDIO", aSim: 12, vSim: 0.3, aNao: 8, zenNao: false },
  { id: 40, text: "Checa o celular constantemente mesmo sem ter recebido nenhum aviso sonoro?", cat: "MEDIO", aSim: 12, vSim: 0.3, aNao: 8, zenNao: false },
  { id: 41, text: "Coloca o celular sobre a mesa enquanto almoça ou janta?", cat: "MEDIO", aSim: 10, vSim: 0.3, aNao: 8, zenNao: false },
  { id: 42, text: "Pega no celular durante uma conversa presencial com amigos ou família?", cat: "MEDIO", aSim: 12, vSim: 0.3, aNao: 8, zenNao: false },
  { id: 43, text: "Alterna entre o trabalho e as redes sociais a cada 10 ou 15 minutos?", cat: "MEDIO", aSim: 12, vSim: 0.3, aNao: 8, zenNao: false },
  { id: 44, text: "Promete usar o celular por 5 minutos e fica mais de uma hora conectado?", cat: "MEDIO", aSim: 12, vSim: 0.3, aNao: 8, zenNao: false },
  { id: 45, text: "Sente tédio quando um vídeo não chama sua atenção nos primeiros 3 segundos?", cat: "MEDIO", aSim: 10, vSim: 0.3, aNao: 8, zenNao: false },
  { id: 46, text: "Abre um aplicativo por puro reflexo, sem saber exatamente o que ia fazer nele?", cat: "MEDIO", aSim: 10, vSim: 0.3, aNao: 8, zenNao: false },
  { id: 47, text: "Sente necessidade de registrar um prato bonito antes de começar a comer?", cat: "MEDIO", aSim: 10, vSim: 0.3, aNao: 8, zenNao: false },
  { id: 48, text: "Fica desapontado se uma publicação sua não atinge certo número de curtidas?", cat: "MEDIO", aSim: 12, vSim: 0.3, aNao: 8, zenNao: false },
  { id: 49, text: "Apaga uma postagem se ela receber pouca interação nas primeiras horas?", cat: "MEDIO", aSim: 12, vSim: 0.3, aNao: 8, zenNao: false },
  { id: 50, text: "Usa o celular enquanto caminha pela rua, ignorando o trajeto?", cat: "MEDIO", aSim: 10, vSim: 0.3, aNao: 8, zenNao: false },
  { id: 51, text: "Confere o celular durante pausas em sinal de trânsito ou filas de espera?", cat: "MEDIO", aSim: 10, vSim: 0.3, aNao: 8, zenNao: false },
  { id: 52, text: "Estuda ou trabalha com dezenas de abas abertas no navegador ao mesmo tempo?", cat: "MEDIO", aSim: 12, vSim: 0.3, aNao: 8, zenNao: false },
  { id: 53, text: "Leva o dobro do tempo para terminar uma tarefa devido às distrações digitais?", cat: "MEDIO", aSim: 12, vSim: 0.3, aNao: 8, zenNao: false },
  { id: 54, text: "Sente dores no pescoço ou nos ombros por ficar olhando para baixo na tela?", cat: "MEDIO", aSim: 10, vSim: 0.3, aNao: 8, zenNao: false },
  { id: 55, text: "Sente cansaço visual ou olhos secos ao final do dia por causa do uso de telas?", cat: "MEDIO", aSim: 10, vSim: 0.3, aNao: 8, zenNao: false },
  { id: 56, text: "Atualiza o feed de notícias repetidamente para ver se há algo novo?", cat: "MEDIO", aSim: 12, vSim: 0.3, aNao: 8, zenNao: false },
  { id: 57, text: "Deixa todas as notificações de aplicativos ativadas com som e pop-up?", cat: "MEDIO", aSim: 10, vSim: 0.3, aNao: 8, zenNao: false },
  { id: 58, text: "Abre o aplicativo de mensagens apenas para 'limpar' os avisos pendentes?", cat: "MEDIO", aSim: 10, vSim: 0.3, aNao: 8, zenNao: false },
  { id: 59, text: "Pesquisa sobre tendências e memes apenas para não ficar de fora das conversas?", cat: "MEDIO", aSim: 10, vSim: 0.3, aNao: 8, zenNao: false },
  { id: 60, text: "Compara o número de seguidores das pessoas para avaliar a importância delas?", cat: "MEDIO", aSim: 12, vSim: 0.3, aNao: 8, zenNao: false },
  { id: 61, text: "Sente ansiedade quando vê que a outra pessoa está 'digitando...' por muito tempo?", cat: "MEDIO", aSim: 10, vSim: 0.3, aNao: 8, zenNao: false },
  { id: 62, text: "Usa o celular como uma 'barreira' para não conversar com estranhos em locais públicos?", cat: "MEDIO", aSim: 10, vSim: 0.3, aNao: 8, zenNao: false },
  { id: 63, text: "Sente raiva ou tédio quando um vídeo não tem legenda ou narração rápida?", cat: "MEDIO", aSim: 10, vSim: 0.3, aNao: 8, zenNao: false },
  { id: 64, text: "Troca de aplicativo imediatamente quando aparece um anúncio de 5 segundos?", cat: "MEDIO", aSim: 10, vSim: 0.3, aNao: 8, zenNao: false },
  { id: 65, text: "Fica rolando a tela sem rumo só para ver o que o algoritmo vai te mostrar a seguir?", cat: "MEDIO", aSim: 12, vSim: 0.3, aNao: 8, zenNao: false },

  // --- NIVEL BAIXO (+8 Ansiedade | +0.2x Velocidade) ---
  { id: 66, text: "Ao ouvir um áudio longo no aplicativo de mensagens, você automaticamente acelera a reprodução?", cat: "BAIXO", aSim: 8, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 67, text: "Avança o vídeo em 10 segundos quando sente que a introdução está demorada?", cat: "BAIXO", aSim: 8, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 68, text: "Usa o alarme do celular e aproveita para olhar as redes sociais assim que ele toca?", cat: "BAIXO", aSim: 8, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 69, text: "Pula trechos de músicas para ouvir direto o refrão?", cat: "BAIXO", aSim: 5, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 70, text: "Abre um vídeo longo e vai direto para os comentários para ver o resumo?", cat: "BAIXO", aSim: 8, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 71, text: "Pega o celular para ver a hora e guarda o aparelho sem ter reparado que horas eram?", cat: "BAIXO", aSim: 8, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 72, text: "Guarda o celular no bolso e retira ele menos de um minuto depois?", cat: "BAIXO", aSim: 8, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 73, text: "Assiste a séries ou filmes mexendo no celular ao mesmo tempo?", cat: "BAIXO", aSim: 8, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 74, text: "Usa o celular no banheiro?", cat: "BAIXO", aSim: 5, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 75, text: "Deixa a tela do celular virada para cima na mesa de cabeceira?", cat: "BAIXO", aSim: 5, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 76, text: "Deixa o celular com o som ativado ao lado do travesseiro enquanto dorme?", cat: "BAIXO", aSim: 8, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 77, text: "Usa telas com o brilho no máximo no escuro do quarto?", cat: "BAIXO", aSim: 8, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 78, text: "Sente impaciência com vídeos que têm mais de 2 minutos de duração?", cat: "BAIXO", aSim: 8, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 79, text: "Revisa a aba de notificações várias vezes por hora sem necessidade?", cat: "BAIXO", aSim: 8, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 80, text: "Posta fotos de momentos especiais para garantir que os outros saibam que você esteve lá?", cat: "BAIXO", aSim: 8, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 81, text: "Perde o fio da conversa presencial porque estava atento a uma notificação?", cat: "BAIXO", aSim: 8, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 82, text: "Esquece o que ia pesquisar assim que abre o navegador devido a outros anúncios?", cat: "BAIXO", aSim: 8, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 83, text: "Trabalha ou estuda ouvindo podcasts ou vídeos ao fundo para não se sentir sozinho?", cat: "BAIXO", aSim: 5, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 84, text: "Desbloqueia o celular sem perceber enquanto realiza outra atividade?", cat: "BAIXO", aSim: 8, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 85, text: "Utiliza filtros em fotos para esconder imperfeições antes de publicar?", cat: "BAIXO", aSim: 8, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 86, text: "Sente alívio passageiro ao receber uma curtida ou comentário positivo?", cat: "BAIXO", aSim: 8, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 87, text: "Ignora os alertas do sistema quando o limite diário de uso de um app é atingido?", cat: "BAIXO", aSim: 8, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 88, text: "Lê apenas o título das notícias e compartilha sem abrir a matéria completa?", cat: "BAIXO", aSim: 8, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 89, text: "Manda várias mensagens curtas seguidas em vez de enviar um texto único?", cat: "BAIXO", aSim: 5, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 90, text: "Visualiza uma mensagem, pensa na resposta e esquece de responder?", cat: "BAIXO", aSim: 8, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 91, text: "Checa a confirmação de leitura (riscos azuis) para ver se foi ignorado?", cat: "BAIXO", aSim: 8, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 92, text: "Salva dezenas de postagens ou receitas que sabe que nunca mais vai olhar?", cat: "BAIXO", aSim: 5, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 93, text: "Tira fotos da reunião familiar em vez de apenas aproveitar o momento?", cat: "BAIXO", aSim: 8, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 94, text: "Faz refeições correndo para poder voltar a olhar o celular ou computador?", cat: "BAIXO", aSim: 8, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 95, text: "Sente culpa quando passa um momento do dia sem fazer nada produtivo?", cat: "BAIXO", aSim: 8, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 96, text: "Tenta ouvir podcasts enquanto faz tarefas simples para render mais?", cat: "BAIXO", aSim: 5, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 97, text: "Fica impaciente quando um aplicativo demora mais de três segundos para carregar?", cat: "BAIXO", aSim: 8, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 98, text: "Interrompe um momento relaxante para tirar uma foto e postar no feed?", cat: "BAIXO", aSim: 8, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 99, text: "Prefere ver um resumo em vídeo de um livro do que ler a obra completa?", cat: "BAIXO", aSim: 8, vSim: 0.2, aNao: 5, zenNao: false },
  { id: 100, text: "Reconhece que este jogo refletiu de forma precisa os seus hábitos diários na internet?", cat: "BAIXO", aSim: 8, vSim: 0.2, aNao: 5, zenNao: false },
];

/**
 * Utility to shuffle an array using Fisher-Yates
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Returns all 100 questions prioritized:
 * 1º CRITICO (Críticas)
 * 2º MEDIO (Médias)
 * 3º ALTO (Altas)
 * 4º BAIXO (Baixas)
 * Shuffled randomly within each category tier.
 */
export function getShuffledSASQuestions(): SASQuestion[] {
  const critico = SAS_QUESTION_DATABASE.filter((q) => q.cat === 'CRITICO');
  const medio = SAS_QUESTION_DATABASE.filter((q) => q.cat === 'MEDIO');
  const alto = SAS_QUESTION_DATABASE.filter((q) => q.cat === 'ALTO');
  const baixo = SAS_QUESTION_DATABASE.filter((q) => q.cat === 'BAIXO');

  const prioritized = [
    ...shuffleArray(critico),
    ...shuffleArray(medio),
    ...shuffleArray(alto),
    ...shuffleArray(baixo),
  ];

  return prioritized.map((item, idx) => ({
    id: item.id,
    timeTrigger: (idx + 1) * 10,
    question: item.text,
    category: item.cat,
    zenOnNao: item.zenNao ?? false,
    simEffect: { anxiety: item.aSim, speed: item.vSim },
    naoEffect: { anxiety: -item.aNao, speed: -item.vSim * 0.5 },
  }));
}

/**
 * Calculates psychometric sample reliability based on the number of answered questions
 */
export function getEvaluationReliability(totalQuestions: number): {
  level: string;
  margin: string;
  badgeColor: string;
  percentage: number;
  desc: string;
} {
  if (totalQuestions >= 20) {
    return {
      level: 'Padrão Ouro Acadêmico',
      margin: '±1%',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      percentage: 100,
      desc: 'Mapeamento comportamental aprofundado com máxima significância estatística (20+ perguntas avaliadas).',
    };
  }
  if (totalQuestions >= 10) {
    return {
      level: 'Alta Precisão Estatística',
      margin: '±5%',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      percentage: 85,
      desc: 'Diagnóstico consistente e validado, com excelente representatividade psicométrica (10 a 19 perguntas).',
    };
  }
  if (totalQuestions >= 5) {
    return {
      level: 'Diagnóstico Preliminar',
      margin: '±15%',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      percentage: 50,
      desc: 'Amostragem inicial moderada. Responder a 10 ou mais perguntas aumenta expressivamente a acurácia.',
    };
  }
  return {
    level: 'Amostragem Básica',
    margin: '±25%',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    percentage: 25,
    desc: 'Poucas perguntas respondidas. Quanto mais perguntas forem respondidas, mais precisa será a avaliação.',
  };
}

/**
 * Randomly samples questions prioritizing CRITICO and MEDIO questions first,
 * assigned to game timer checkpoints.
 */
export function generateRandomSASQuestions(
  timeCheckpoints: number[] = [10, 20, 30, 40, 50]
): Record<number, SASQuestion> {
  const critico = SAS_QUESTION_DATABASE.filter((q) => q.cat === 'CRITICO');
  const medio = SAS_QUESTION_DATABASE.filter((q) => q.cat === 'MEDIO');
  const alto = SAS_QUESTION_DATABASE.filter((q) => q.cat === 'ALTO');
  const baixo = SAS_QUESTION_DATABASE.filter((q) => q.cat === 'BAIXO');

  const prioritized = [
    ...shuffleArray(critico),
    ...shuffleArray(medio),
    ...shuffleArray(alto),
    ...shuffleArray(baixo),
  ];

  const result: Record<number, SASQuestion> = {};

  timeCheckpoints.forEach((timeTrigger, index) => {
    const item = prioritized[index % prioritized.length];
    result[timeTrigger] = {
      timeTrigger,
      question: item.text,
      category: item.cat,
      zenOnNao: item.zenNao ?? false,
      simEffect: { anxiety: item.aSim, speed: item.vSim },
      naoEffect: { anxiety: -item.aNao, speed: -item.vSim * 0.5 },
    };
  });

  return result;
}
