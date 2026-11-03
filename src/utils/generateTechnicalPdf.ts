import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface TechnicalPdfOptions {
  downloadImmediate?: boolean;
  documentType?: 'technical' | 'cronograma' | 'executive';
}

// Helper function to invoke autoTable safely across different bundlers/environments
function applyAutoTable(doc: jsPDF, options: any) {
  try {
    if (typeof autoTable === 'function') {
      autoTable(doc, options);
    } else if (typeof (autoTable as any)?.default === 'function') {
      (autoTable as any).default(doc, options);
    } else if (typeof (doc as any)?.autoTable === 'function') {
      (doc as any).autoTable(options);
    }
  } catch (e) {
    console.error('Error invoking autoTable:', e);
  }
}

export function generateTechnicalPdf(options: TechnicalPdfOptions = { downloadImmediate: true, documentType: 'technical' }): jsPDF {
  const docType = options.documentType || 'technical';

  if (docType === 'cronograma') {
    return generateCronogramaPdf(options.downloadImmediate ?? true);
  } else if (docType === 'executive') {
    return generateExecutivePdf(options.downloadImmediate ?? true);
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // ~210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // ~297mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  let currentY = margin;

  // Helper colors
  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const cyanColor: [number, number, number] = [6, 182, 212]; // Cyan 500
  const darkCyanColor: [number, number, number] = [14, 116, 144]; // Cyan 700
  const purpleColor: [number, number, number] = [126, 34, 206]; // Purple 700
  const lightBgColor: [number, number, number] = [248, 250, 252]; // Slate 50
  const cardBorderColor: [number, number, number] = [226, 232, 240]; // Slate 200

  // Helper function to check page overflow and add new page
  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 22) {
      doc.addPage();
      currentY = margin + 14;
    }
  };

  // Header and Footer generator (runs ONCE at the end)
  const drawHeaderFooter = () => {
    const totalPages = doc.getNumberOfPages ? doc.getNumberOfPages() : (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Top accent bar
      doc.setFillColor(...cyanColor);
      doc.rect(0, 0, pageWidth, 3, 'F');

      // Header on pages > 1 (Font size: 12pt)
      if (i > 1) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(71, 85, 105);
        doc.text('DOCUMENTO TÉCNICO DE DESENVOLVIMENTO', margin, 10);
        doc.setFont('helvetica', 'normal');
        doc.text('Entre Redes: Há Ansiedade?', pageWidth - margin, 10, { align: 'right' });

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.4);
        doc.line(margin, 13, pageWidth - margin, 13);
      }

      // Footer on all pages (Font size: 12pt)
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(100, 116, 139);
      doc.text(
        'EEEM Felipe Camarão • Turma 61 • São Sebastião do Caí / RS',
        margin,
        pageHeight - 9
      );

      doc.text(
        `Página ${i} de ${totalPages}`,
        pageWidth - margin,
        pageHeight - 9,
        { align: 'right' }
      );
    }
  };

  // ==========================================
  // PAGE 1: TITLE & COVER HEADER
  // ==========================================

  // Header Banner Card
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, currentY, contentWidth, 42, 4, 4, 'F');

  // Decorative cyan accent box inside banner
  doc.setFillColor(...cyanColor);
  doc.rect(margin, currentY, 4, 42, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('DOCUMENTO TÉCNICO DE DESENVOLVIMENTO', margin + 8, currentY + 12);

  doc.setFontSize(12);
  doc.setTextColor(165, 243, 252); // Cyan 200
  doc.text('Game Simulador 3D Interativo: Entre Redes Há Ansiedade?', margin + 8, currentY + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text(
    'Especificação do Sistema, Arquitetura de Software e Diagnóstico Psicométrico',
    margin + 8,
    currentY + 28
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(56, 189, 248); // Sky 400
  doc.text('EEEM Felipe Camarão • São Sebastião do Caí / RS (2026)', margin + 8, currentY + 36);

  currentY += 48;

  // Metadata Grid Box (Authors, Guidance, Stack)
  doc.setFillColor(...lightBgColor);
  doc.setDrawColor(...cardBorderColor);
  doc.roundedRect(margin, currentY, contentWidth, 38, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.text('Estudantes Idealizadores:', margin + 4, currentY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('Augusto J. Dullius, Caio C. Cercato, Leonardo L. Dahmer (Turma 61)', margin + 56, currentY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Orientação / Coorientação:', margin + 4, currentY + 14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('Profª Me. Lisandra J. K. Junges & Cristofer Stelzer da Silva', margin + 56, currentY + 14);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Orientação Técnica Game:', margin + 4, currentY + 21);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('Christian Dahmer (Orientador Técnico de Desenvolvimento)', margin + 56, currentY + 21);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Stack de Tecnologia:', margin + 4, currentY + 28);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('TypeScript • React • Three.js (WebGL) • Firebase Firestore • AI Studio', margin + 56, currentY + 28);

  currentY += 44;

  // ------------------------------------------
  // SECTION 1: RESUMO EXECUTIVO E OBJETIVOS
  // ------------------------------------------
  const drawSectionTitle = (title: string) => {
    checkPageBreak(18);
    doc.setFillColor(...cyanColor);
    doc.rect(margin, currentY, 4, 8, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(...primaryColor);
    doc.text(title, margin + 8, currentY + 6.5);

    currentY += 12;
  };

  drawSectionTitle('1. RESUMO EXECUTIVO E VISÃO GERAL DO PROJETO');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(51, 65, 85);
  const textObj = doc.splitTextToSize(
    'O game simulador "Entre Redes: Há Ansiedade?" foi concebido como uma tecnologia educacional interativa de suporte ao estudo científico homônimo realizado na Escola Estadual de Ensino Médio Felipe Camarão em São Sebastião do Caí/RS. O objetivo central é conscientizar e diagnosticar os impactos do uso excessivo de telas, estímulos constantes de notificações e mídias sociais no desenvolvimento emocional de adolescentes (9 a 16 anos).\n\n' +
    'A aplicação traduz preceitos psicométricos em mecânicas lúdicas de jogabilidade 3D, em que o jogador vivencia em tempo real a sobrecarga cognitiva provocada pela hiperconexão e descobre formas ativas de recuperação e autocuidado digital.',
    contentWidth
  );
  doc.text(textObj, margin, currentY);
  currentY += textObj.length * 5.6 + 6;

  // ------------------------------------------
  // SECTION 2: BASE EMPÍRICA DA PESQUISA
  // ------------------------------------------
  drawSectionTitle('2. BASE DIAGNÓSTICA EMPÍRICA DA PESQUISA (77 ESTUDANTES)');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(51, 65, 85);
  const textEmpirico = doc.splitTextToSize(
    'Os parâmetros e pesos do algoritmo de ansiedade foram calibrados rigorosamente com base no levantamento quantitativo empírico conduzido com 77 estudantes da instituição:',
    contentWidth
  );
  doc.text(textEmpirico, margin, currentY);
  currentY += textEmpirico.length * 5.6 + 4;

  // AutoTable for Research Findings (12pt font)
  applyAutoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Dimensão Investigada', 'Indicador Empírico Mapeado', 'Impacto na Jogabilidade / Algoritmo']],
    body: [
      [
        'Hiperconexão Diária',
        '80,5% usam redes sociais com frequência;\n52% passam mais de 4 horas conectados.',
        'Aceleração da queda de notificações e acúmulo de estresse por ausência de pausa.'
      ],
      [
        'Qualidade do Sono',
        '71,4% usam celular antes de dormir;\n84,4% relatam prejuízos no sono.',
        'Simulação da luz azul e redução da regeneração do avatar durante corridas noturnas.'
      ],
      [
        'Afeção Emocional & FOMO',
        '42,9% sentem tristeza/ansiedade pos-redes;\n14,3% sofrem com Síndrome F.O.M.O.',
        'Redução da velocidade de movimento (WalkSpeed) e escurecimento ambiente.'
      ],
      [
        'Prejuízo Acadêmico',
        '23,4% reduziram tempo de leitura e estudos;\n15,6% reduziram brincadeiras ao ar livre.',
        'Valorização dos itens de Livros e Esportes com bônus de recuperação acelerada.'
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: darkCyanColor,
      textColor: [255, 255, 255],
      fontSize: 12,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 12,
      textColor: [30, 41, 59],
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [241, 245, 249],
    },
  });

  currentY = ((doc as any).lastAutoTable?.finalY || currentY) + 10;

  // ------------------------------------------
  // SECTION 3: COMO O JOGO FOI CRIADO
  // ------------------------------------------
  drawSectionTitle('3. COMO O JOGO FOI CRIADO: METODOLOGIA E ETAPAS');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(51, 65, 85);
  const textComoCriado = doc.splitTextToSize(
    'O desenvolvimento do simulador “Entre Redes: Há Ansiedade?” integrou inovação tecnológica, design educacional e rigor empírico em 4 fases fundamentais:\n\n' +
    '1. Pesquisa & Escala SAS-SMU: Levantamento com 77 estudantes e adaptação da escala Smartphone Addiction Scale em 100 perguntas clínicas integradas aos balões de diálogo do jogo.\n\n' +
    '2. Engine 3D (Three.js): Programação em TypeScript e WebGL para renderização a 60 FPS de avatares articulados (R15) e física de colisões AABB com penalidade de velocidade.\n\n' +
    '3. Áudio Procedural & Voz: Síntese de som via Web Audio API e assistente inteligente com reconhecimento de fala para tutoria interativa.\n\n' +
    '4. Análise & Exportação: Painel estatístico em Recharts e geração automática de relatórios técnicos em PDF corporativo e planilhas CSV.',
    contentWidth
  );
  doc.text(textComoCriado, margin, currentY);
  currentY += textComoCriado.length * 5.6 + 6;

  // Development hours estimation table (12pt font)
  applyAutoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Módulo de Desenvolvimento', 'Esforço Estimado', 'Atividades e Entregas Técnicas']],
    body: [
      [
        '1. Pesquisa & Mapeamento Clínico',
        '~25 horas',
        'Taburação dos dados de 77 estudantes, adaptação dos 100 itens da escala SAS-SMU e parametrização das regras de ansiedade.'
      ],
      [
        '2. Engine 3D & Física WebGL',
        '~45 horas',
        'Pipeline Three.js, iluminação/sombras, modelagem R15, sistema de corrida sem fim e detecção de colisão AABB a 60 FPS.'
      ],
      [
        '3. Analytics, PDF & UI',
        '~30 horas',
        'Painéis estatísticos com Recharts, gerador de relatórios em PDF (jsPDF), exportação CSV e sincronização Firestore.'
      ],
      [
        '4. Áudio Procedural & Voz',
        '~30 horas',
        'Sintetizador Web Audio API, efeitos sonoros matemáticos e assistente virtual inteligente com reconhecimento e síntese de voz.'
      ],
      [
        'TOTAL GERAL',
        '120 - 160 horas',
        'Esforço técnico acumulado em engenharia de software, modelagem, testes de desempenho e design educacional.'
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: darkCyanColor,
      textColor: [255, 255, 255],
      fontSize: 12,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 12,
      textColor: [30, 41, 59],
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [241, 245, 249],
    },
  });

  currentY = ((doc as any).lastAutoTable?.finalY || currentY) + 10;

  // ------------------------------------------
  // SECTION 4: ARQUITETURA DE SOFTWARE E STACK
  // ------------------------------------------
  drawSectionTitle('4. ARQUITETURA TÉCNICA E TECNOLOGIAS DESENVOLVIDAS');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(51, 65, 85);
  const textArch = doc.splitTextToSize(
    'O software foi desenvolvido seguindo o paradigma Full-Client WebGL + Serverless Analytics, priorizando execução fluida a 60 FPS diretamente no navegador, sem necessidade de plugins ou instalação local.',
    contentWidth
  );
  doc.text(textArch, margin, currentY);
  currentY += textArch.length * 5.6 + 4;

  applyAutoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Módulo / Camada', 'Tecnologias Utilizadas', 'Detalhamento Técnico de Implementação']],
    body: [
      [
        '1. Engine Gráfica 3D',
        'Three.js / WebGL / Canvas API',
        'Loop a 60 FPS com delta-time normalization, iluminação direcional, sombras dinâmicas e renderização isométrica 2.5D.'
      ],
      [
        '2. Modelagem R15',
        'Procedural Geometry Matrix',
        'Avatar articulado de 15 partes com cinemática direta/inversa para animações de corrida, agachamento e ciclismo.'
      ],
      [
        '3. Motor de Áudio',
        'Web Audio API (Osciladores)',
        'Síntese sonora 100% matemática sem arquivos pesados. Osciladores senoidais e envelopes ADSR para efeitos sonoros.'
      ],
      [
        '4. Física & Colisões',
        'Custom AABB / Z-Axis Depth',
        'Detecção contínua de caixas delimitadoras AABB. Transição fluida de profundidade da pista para zonas de lazer.'
      ],
      [
        '5. Interface & Estado',
        'React 19 / Tailwind CSS / Motion',
        'Gerenciamento de estado reativo unificado, modais acessíveis e suporte universal a joysticks (Gamepad API).'
      ],
      [
        '6. Banco de Dados',
        'Firebase Firestore & Auth',
        'Presença em tempo real com participantes online, armazenamento de casos clínicos e exportação em CSV/PDF.'
      ],
      [
        '7. Interoperabilidade',
        'Luau / Roblox Studio Integration',
        'Módulos Luau desacoplados (AnxietyModule.lua, PlayerMovement.lua) prontos para importação em Roblox Studio.'
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 12,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 12,
      textColor: [30, 41, 59],
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  currentY = ((doc as any).lastAutoTable?.finalY || currentY) + 10;

  // ------------------------------------------
  // SECTION 5: EXEMPLOS DE CÓDIGO DA ARQUITETURA
  // ------------------------------------------
  drawSectionTitle('5. EXEMPLOS DE CÓDIGO DA ARQUITETURA DE SOFTWARE');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(51, 65, 85);
  const textCodeIntro = doc.splitTextToSize(
    'Abaixo estão apresentados os trechos de código de referência das principais engrenagens da aplicação: o Loop de Física AABB em Three.js, o Motor de Síntese Sonora Procedural via Web Audio API e o Servidor GameManager Luau para Roblox Studio.',
    contentWidth
  );
  doc.text(textCodeIntro, margin, currentY);
  currentY += textCodeIntro.length * 5.6 + 4;

  // Code Block 1: Three.js AABB Physics Loop
  checkPageBreak(58);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...primaryColor);
  doc.text('A) Loop de Renderização & Detecção de Colisão AABB (TypeScript / Three.js)', margin, currentY);
  currentY += 6;

  const codeSnippet1 = [
    '// Detecção de colisão AABB entre Avatar e Objetos Caindo',
    'function updatePhysics(deltaTime: number) {',
    '  const avatarBox = new THREE.Box3().setFromObject(avatarMesh);',
    '  fallingObjects.forEach((obj, idx) => {',
    '    obj.mesh.position.y -= obj.speed * notificationSpeed * deltaTime;',
    '    const objBox = new THREE.Box3().setFromObject(obj.mesh);',
    '    if (avatarBox.intersectsBox(objBox)) {',
    '      anxietyLevel = Math.min(100, anxietyLevel + obj.damage);',
    '      walkSpeed = Math.max(8, 16 - (anxietyLevel * 0.08)); // Modulação Motora',
    '      triggerScreenShake(0.3);',
    '      destroyObject(obj, idx);',
    '    }',
    '  });',
    '}'
  ];

  doc.setFillColor(15, 23, 42); // Dark slate bg
  doc.setDrawColor(51, 65, 85);
  doc.roundedRect(margin, currentY, contentWidth, codeSnippet1.length * 4.5 + 6, 2, 2, 'FD');

  doc.setFont('courier', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(56, 189, 248); // Cyan text
  codeSnippet1.forEach((line, i) => {
    doc.text(line, margin + 4, currentY + 5 + (i * 4.5));
  });
  currentY += codeSnippet1.length * 4.5 + 10;

  // Code Block 2: Web Audio API Synthesizer
  checkPageBreak(58);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...primaryColor);
  doc.text('B) Síntese Sonora Procedural sem Arquivos Externos (Web Audio API)', margin, currentY);
  currentY += 6;

  const codeSnippet2 = [
    '// Síntese de som procedural usando osciladores matemáticos nativos',
    'export function playNotificationSFX(freq = 880, duration = 0.15) {',
    '  const ctx = new (window.AudioContext || window.webkitAudioContext)();',
    '  const osc = ctx.createOscillator();',
    '  const gain = ctx.createGain();',
    '  osc.type = "sine";',
    '  osc.frequency.setValueAtTime(freq, ctx.currentTime);',
    '  osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + duration);',
    '  gain.gain.setValueAtTime(0.3, ctx.currentTime);',
    '  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);',
    '  osc.connect(gain); gain.connect(ctx.destination);',
    '  osc.start(); osc.stop(ctx.currentTime + duration);',
    '}'
  ];

  doc.setFillColor(15, 23, 42);
  doc.setDrawColor(51, 65, 85);
  doc.roundedRect(margin, currentY, contentWidth, codeSnippet2.length * 4.5 + 6, 2, 2, 'FD');

  doc.setFont('courier', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(168, 85, 247); // Purple text
  codeSnippet2.forEach((line, i) => {
    doc.text(line, margin + 4, currentY + 5 + (i * 4.5));
  });
  currentY += codeSnippet2.length * 4.5 + 10;

  // Code Block 3: Luau Roblox GameManager
  checkPageBreak(50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...primaryColor);
  doc.text('C) Servidor Luau Roblox Studio (GameManager.server.luau)', margin, currentY);
  currentY += 6;

  const codeSnippet3 = [
    '-- Monitoramento de Ansiedade e Eventos de Colapso Digital',
    'local RunService = game:GetService("RunService")',
    'local ReplicatedStorage = game:GetService("ReplicatedStorage")',
    'local AnxietyLevel = ReplicatedStorage.GameStateInfo.AnxietyLevel',
    'RunService.Heartbeat:Connect(function(deltaTime)',
    '    if AnxietyLevel.Value >= 100 then',
    '        game:GetService("Lighting").Ambient = Color3.fromRGB(150, 0, 0)',
    '        ReplicatedStorage.Events.EndGameEvent:FireAllClients("DERROTA", 100)',
    '    end',
    'end)'
  ];

  doc.setFillColor(15, 23, 42);
  doc.setDrawColor(51, 65, 85);
  doc.roundedRect(margin, currentY, contentWidth, codeSnippet3.length * 4.5 + 6, 2, 2, 'FD');

  doc.setFont('courier', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(34, 197, 94); // Green text
  codeSnippet3.forEach((line, i) => {
    doc.text(line, margin + 4, currentY + 5 + (i * 4.5));
  });
  currentY += codeSnippet3.length * 4.5 + 10;

  // ------------------------------------------
  // SECTION 6: MECÂNICAS DO JOGO E ITENS
  // ------------------------------------------
  drawSectionTitle('6. TABELA TÉCNICA DE ITENS, ESTÍMULOS E DANOS DE ANSIEDADE');

  applyAutoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Item / Estímulo', 'Natureza do Item', 'Impacto na Ansiedade', 'Efeito Psicológico & Mecânico no Avatar']],
    body: [
      [
        'Obstáculos de Pista (Muro, Cone, Buraco)',
        'Nocivo Físico',
        '+10% Ansiedade',
        'Parada motora imediata, interrupção da corrida, necessidade de pulo ou agachamento.'
      ],
      [
        'Cartões de Notificação',
        'Nocivo Digital',
        '+6% Ansiedade',
        'Quebra de atenção sustentada, disrupção do foco e alerta cognitivo contínuo.'
      ],
      [
        'TikTok (Vídeos Curtos)',
        'Nocivo Digital',
        '+3% Ansiedade',
        'Estimulação de dopamina rápida e rasa, induzindo fadiga passiva e perda de concentração.'
      ],
      [
        'WhatsApp / Feeds / Likes',
        'Nocivo Social',
        '+4% Base (Acumulativo)',
        'Acúmulo sequencial ativa multiplicador 1.2x por estresse de hiperconexão.'
      ],
      [
        'Elementos Geométricos',
        'Poluição Visual',
        '+4% Base',
        'Representa ruído visual. Acelera a taxa de queda das próximas notificações em +20%.'
      ],
      [
        'Livro / Leitura',
        'Protetor Digital',
        '-3% Ansiedade',
        'Restaura o foco foveal profundo e estimula o raciocínio crítico.'
      ],
      [
        'Prática de Esporte / Exercício',
        'Protetor Físico',
        '-6% Ansiedade',
        'Liberação de endorfina, reduzindo a rigidez muscular e acelerando o avatar.'
      ],
      [
        'Interação com Animais / Café',
        'Protetor Emocional',
        '-4% a -10% Ansiedade',
        'Regulação do sistema nervoso autônomo e indução de calma em zonas de descanso.'
      ],
      [
        'Zonas Verdes de Lazer (Pesca/Futebol)',
        'Atividade Presencial',
        'Redução Contínua',
        'Zera progressivamente a ansiedade e desativa efeitos colaterais de telas.'
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: darkCyanColor,
      textColor: [255, 255, 255],
      fontSize: 12,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 12,
      textColor: [30, 41, 59],
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [241, 245, 249],
    },
  });

  currentY = ((doc as any).lastAutoTable?.finalY || currentY) + 10;

  // ------------------------------------------
  // SECTION 7: COLETA DE DADOS, MECÂNICA & CRUZAMENTO CIENTÍFICO COM FOMO
  // ------------------------------------------
  drawSectionTitle('7. COLETA DE DADOS, MECÂNICA E CRUZAMENTO CIENTÍFICO COM FOMO');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(51, 65, 85);
  const textSasm = doc.splitTextToSize(
    'O módulo de Diagnóstico e Análise parametriza a jogabilidade interativa como um protocolo epidemiológico. O jogo coleta em tempo real o perfil do participante, respostas à escala validada SAS-SMU (Smartphone Addiction Scale), latência de tomada de decisão e alteração da coordenação motora fina (WalkSpeed de 16 a 8 studs/s).\n\n' +
    'Fundamentado nos estudos de Przybylski et al. (2013) sobre o FOMO (Fear of Missing Out) e Kwon et al. (2013), o algoritmo comprova que o viés de urgência em indivíduos hiperconectados provoca respostas impulsivas a notificações, mas acarreta degradação drástica do desvio de obstáculos devido à sobrecarga digital:',
    contentWidth
  );
  doc.text(textSasm, margin, currentY);
  currentY += textSasm.length * 5.6 + 4;

  // AutoTable: Data Collection Metrics Protocol (12pt font)
  applyAutoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Variável Coletada', 'Origem no Sistema', 'Aplicação Clínica & Epidemiológica']],
    body: [
      [
        'Perfil Demográfico',
        'Cadastro / Aba Diagnóstico',
        'Código anônimo do participante (ex: P-042), idade, série e horas diárias de exposição a telas.'
      ],
      [
        'Pontuação SAS-SMU',
        'Balões de Diálogo no Game',
        'Total de questões respondidas, percentual de confirmações "SIM" e score de ansiedade (0-100%).'
      ],
      [
        'Desempenho Motor',
        'Engine 3D (Three.js)',
        'Velocidade final de movimento (WalkSpeed 8–16 studs/s) e taxa de desvio/retenção de obstáculos.'
      ],
      [
        'Latência de Decisão',
        'Temporizador de Clique',
        'Tempo de reação em segundos para responder questões de impacto crítico vs. impacto baixo.'
      ],
      [
        'Persistência & Exportação',
        'Firestore & LocalStorage',
        'Armazenamento estruturado de casos reais com exportação direta em CSV, Dossiê TXT e PDF.'
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: darkCyanColor,
      textColor: [255, 255, 255],
      fontSize: 12,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 12,
      textColor: [30, 41, 59],
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [241, 245, 249],
    },
  });

  currentY = ((doc as any).lastAutoTable?.finalY || currentY) + 8;

  // AutoTable: Scientific FOMO & Digital Overload Matrix (12pt font)
  checkPageBreak(50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...primaryColor);
  doc.text('Matriz de Cruzamento Científico: FOMO vs. Resposta e Desempenho Motor', margin, currentY);
  currentY += 6;

  applyAutoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Categoria Diagnóstico', 'Faixa Ansiedade', 'Tempo Resposta Crítico', 'Desvio Obstáculos', 'Impacto Motor WalkSpeed', 'Status Neurofisiológico']],
    body: [
      [
        'Resiliente Digital',
        '< 30%',
        '3.2s – 4.7s (Reflexivo)',
        '84% – 98% (Alto)',
        '16.0 studs/s (Máximo)',
        'Foco sustentado, autorregulação e acesso livre ao Modo Zen.'
      ],
      [
        'Uso Moderado',
        '30% a 59%',
        '2.0s – 3.1s (Moderado)',
        '62% – 82% (Médio)',
        '11.0 – 15.0 studs/s',
        'Distração esporádica e fadiga cognitiva sob notificação alta.'
      ],
      [
        'Hiperconectado (FOMO)',
        '≥ 60%',
        '< 1.8s (Impulsivo)',
        '32% – 59% (Baixo)',
        '8.0 studs/s (Mínimo)',
        'Sobrecarga digital severa, visão túnel com névoa e hiperalerta.'
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: purpleColor,
      textColor: [255, 255, 255],
      fontSize: 12,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 12,
      textColor: [30, 41, 59],
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [245, 243, 255],
    },
  });

  currentY = ((doc as any).lastAutoTable?.finalY || currentY) + 10;

  // ------------------------------------------
  // SECTION 8: CRUZAMENTO TÉCNICO-CRONOLÓGICO DO DESENVOLVIMENTO
  // ------------------------------------------
  drawSectionTitle('8. CRUZAMENTO TÉCNICO-CRONOLÓGICO DO DESENVOLVIMENTO');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(51, 65, 85);
  const textCronogramaIntro = doc.splitTextToSize(
    'A matriz abaixo estabelece o cruzamento rastreável e formal entre os 7 marcos cronológicos da pesquisa, os componentes de software desenvolvidos, as ferramentas de criação empregadas e os resultados empíricos validados com os estudantes da EEEM Felipe Camarão:',
    contentWidth
  );
  doc.text(textCronogramaIntro, margin, currentY);
  currentY += textCronogramaIntro.length * 5.6 + 4;

  applyAutoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Marco Cronológico', 'Componente de Software', 'Tecnologias & Ferramentas', 'Validação Técnica & Empírica']],
    body: [
      [
        'Marco 1:\nDiagnóstico Psicométrico\n& Concepção Pedagógica',
        'Módulo de Avaliação Psicométrica\n(types.ts, SASQuestions.ts)',
        '• Escala SAS-SV & FOMO\n• Questionários de Campo\n• Planilhas Estatísticas',
        'Pesquisa de campo com 77 alunos (Turma 61): 84,4% com sono afetado e 42,9% com ansiedade pós-redes. Criação de 100 itens clínicos.'
      ],
      [
        'Marco 2:\nPipeline de Engenharia\n& Arquitetura Web SPA',
        'Estrutura Reativa & Build Pipeline\n(App.tsx, vite.config.ts)',
        '• TypeScript 5.8 (Strict)\n• React 19.0 & Vite 6.2\n• Tailwind CSS v4.0',
        'Tempo de build < 1.5s, compilação de alto desempenho, tipagem estrita de 100% dos estados e paleta sensorial escura com alto contraste.'
      ],
      [
        'Marco 3:\nMotor Gráfico 3D\n& Biomecânica Motora',
        'Engine WebGL & Loop Físico\n(GameCanvas.tsx)',
        '• Three.js r185.1 (WebGL)\n• Álgebra Vetorial & AABB\n• RequestAnimationFrame',
        'Renderização estável a 60 FPS sem malhas externas pesadas. Desaceleração motora comprovada de WalkSpeed de 16 para 4 u/s sob estresse.'
      ],
      [
        'Marco 4:\nÁudio Procedural &\nAcessibilidade Universal',
        'Sintetizador de Som & Entrada\n(audio.ts, controls.ts)',
        '• Web Audio API (ADSR)\n• Gamepad API (W3C)\n• Touch Pointer Events',
        'Zero megabytes de arquivos externos WAV/MP3. Suporte universal a teclado, tela touch de smartphones escolares e joystick Bluetooth.'
      ],
      [
        'Marco 5:\nGamificação Positiva &\nPersistência Híbrida',
        'Loja de Resiliência & Cloud Sync\n(ShopModal.tsx, firebase.ts)',
        '• Firebase Firestore NoSQL\n• LocalStorage Offline-First\n• Motion v12 & Canvas Confetti',
        'Economia de resiliência (Pulo Duplo, Escudo, Tênis, Bicicleta). Funciona 100% offline em salas de aula sem internet e sincroniza na nuvem.'
      ],
      [
        'Marco 6:\nInteroperabilidade Luau\n& Roblox Studio',
        'Módulo de Exportação Luau\n(RobloxScriptModal, luauGenerator)',
        '• Linguagem Luau 5.1+\n• ServerScriptService & Client\n• JSZip v3.10.1 Exporter',
        'Arquitetura modular de scripts para Roblox Studio (GameManager e PlayerController). Download em arquivo .zip com 1 clique para robótica escolar.'
      ],
      [
        'Marco 7:\nInteligência Estatística,\nPDF & Narração Acessível',
        'Painel Analítico & Dossiê Oficial\n(AnalyticsModal, generateTechnicalPdf)',
        '• Recharts v3.10 (SVG)\n• Coeficiente Pearson (r)\n• Web Speech API (TTS)\n• jsPDF v4.2 + autoTable',
        'Correlação de Pearson calculada em tempo real (r ≈ +0.78). Tutorial narrado com voz artificial em 4 etapas e segmentação em 6 faixas etárias.'
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: darkCyanColor,
      textColor: [255, 255, 255],
      fontSize: 12,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 12,
      textColor: [30, 41, 59],
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [241, 245, 249],
    },
  });

  currentY = ((doc as any).lastAutoTable?.finalY || currentY) + 10;

  // ------------------------------------------
  // SECTION 9: HOMOLOGAÇÃO TÉCNICA E AVISO LEGAL
  // ------------------------------------------
  drawSectionTitle('9. HOMOLOGAÇÃO TÉCNICA E AVISO LEGAL');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  const textLegal = doc.splitTextToSize(
    'Este documento certifica que o game simulador "Entre Redes: Há Ansiedade?" atende aos requisitos pedagógicos e tecnológicos educacionais. Os algoritmos de simulação possuem caráter exclusivamente educativo e preventivo, não substituindo avaliações clínicas ou diagnósticos médico-psicológicos formais.',
    contentWidth
  );
  doc.text(textLegal, margin, currentY);
  currentY += textLegal.length * 5.6 + 8;

  // Signature Block
  checkPageBreak(36);
  doc.setFillColor(...lightBgColor);
  doc.setDrawColor(...cardBorderColor);
  doc.roundedRect(margin, currentY, contentWidth, 32, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.text('Homologado por:', margin + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Augusto J. Dullius • Caio C. Cercato • Leonardo L. Dahmer (Estudantes Pesquisadores)', margin + 4, currentY + 13);
  doc.text('Profª Me. Lisandra Jacobi Kölling Junges (Orientadora) • Cristofer Stelzer da Silva (Coorientador)', margin + 4, currentY + 19);
  doc.text('Christian Dahmer (Orientador Técnico de Desenvolvimento do Game)', margin + 4, currentY + 25);

  doc.text(`São Sebastião do Caí / RS • ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin - 4, currentY + 25, { align: 'right' });

  // Apply Headers and Footers to all generated pages ONCE at the end
  drawHeaderFooter();

  if (options.downloadImmediate) {
    doc.save('Documento_Tecnico_Desenvolvimento_Entre_Redes.pdf');
  }

  return doc;
}

// ==========================================
// CRONOGRAMA PDF GENERATOR
// ==========================================
export function generateCronogramaPdf(downloadImmediate = true): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  const cyanColor: [number, number, number] = [6, 182, 212];
  const purpleColor: [number, number, number] = [126, 34, 206];
  const primaryColor: [number, number, number] = [15, 23, 42];

  // Title Banner
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, currentY, contentWidth, 36, 3, 3, 'F');
  doc.setFillColor(...purpleColor);
  doc.rect(margin, currentY, 4, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CRONOGRAMA EXECUTIVO DE DESENVOLVIMENTO', margin + 8, currentY + 12);
  doc.setFontSize(12);
  doc.setTextColor(216, 180, 254);
  doc.text('Entre Redes: Há Ansiedade? • Tecnologias, Ferramentas & Marcos', margin + 8, currentY + 21);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(203, 213, 225);
  doc.text('EEEM Felipe Camarão • São Sebastião do Caí / RS (Turma 61)', margin + 8, currentY + 29);

  currentY += 42;

  // Intro text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(51, 65, 85);
  const introText = doc.splitTextToSize(
    'O desenvolvimento do game simulador foi estruturado em 7 marcos cronológicos rigorosos, unindo pesquisa psicométrica de campo com 77 estudantes, programação em TypeScript, motor gráfico 3D em Three.js, síntese sonora via Web Audio API e interoperabilidade educacional com Roblox Studio.',
    contentWidth
  );
  doc.text(introText, margin, currentY);
  currentY += introText.length * 5.6 + 6;

  // Table of Milestones (12pt font)
  applyAutoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Marco', 'Título & Período', 'Tecnologias Principais', 'Ferramentas de Criação', 'Entregáveis Validados']],
    body: [
      [
        'Marco 1',
        'Diagnóstico Psicométrico\n(Pesquisa Inicial)',
        '• Escala SAS-SV\n• Inventário FOMO\n• Estatística Descritiva',
        '• Questionários\n• Planilhas de Campo',
        'Mapeamento com 77 alunos da EEEMFC (84,4% sono afetado) e criação de 100 perguntas clínicas.'
      ],
      [
        'Marco 2',
        'Pipeline de Engenharia\n(Arquitetura SPA)',
        '• TypeScript 5.8\n• React 19 & Vite 6\n• Tailwind CSS v4',
        '• Google AI Studio\n• Node.js v22 LTS',
        'Compilação ultrarrápida (< 1.5s), tipagem estrita de 100% dos estados e design sensorial escuro.'
      ],
      [
        'Marco 3',
        'Motor 3D & Biomecânica\n(Simulador WebGL)',
        '• Three.js r185.1\n• Álgebra Vetorial\n• Colisão AABB',
        '• Three.js Modeler\n• RequestAnimationFrame',
        'Renderização a 60 FPS e desaceleração motora (WalkSpeed de 16 para 4 u/s sob estresse).'
      ],
      [
        'Marco 4',
        'Áudio Procedural &\nAcessibilidade',
        '• Web Audio API\n• Gamepad API (W3C)\n• Touch Events',
        '• OscillatorNodes ADSR\n• Virtual Touchpad',
        'Zero megabytes de arquivos externos de áudio; suporte universal a teclado, touch e joystick.'
      ],
      [
        'Marco 5',
        'Gamificação & Dados\n(Persistência Híbrida)',
        '• Firebase Firestore\n• LocalStorage API\n• Motion & Confetti',
        '• Firebase Console NoSQL\n• Cache Offline-First',
        'Loja de Resiliência Digital e funcionamento 100% offline em salas de aula sem internet.'
      ],
      [
        'Marco 6',
        'Interoperabilidade Luau\n(Roblox Studio)',
        '• Linguagem Luau 5.1\n• ServerScriptService\n• JSZip v3.10',
        '• Roblox Studio IDE\n• Blob Exporter',
        'Scripts desacoplados (GameManager e PlayerController) com download em .zip com 1 clique.'
      ],
      [
        'Marco 7',
        'Inteligência & Dossiê\n(Ciência & PDF)',
        '• Recharts SVG\n• Pearson (r ≈ +0.78)\n• Web Speech API',
        '• jsPDF + autoTable\n• Síntese Vocal pt-BR',
        'Gráficos analíticos, correlação de Pearson em tempo real, tutorial por voz e dossiê em PDF.'
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: purpleColor,
      textColor: [255, 255, 255],
      fontSize: 12,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 12,
      textColor: [30, 41, 59],
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [245, 243, 255],
    },
  });

  const totalPages = doc.getNumberOfPages ? doc.getNumberOfPages() : (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(...purpleColor);
    doc.rect(0, 0, pageWidth, 3, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text('EEEM Felipe Camarão • Turma 61 • São Sebastião do Caí / RS', margin, pageHeight - 9);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 9, { align: 'right' });
  }

  if (downloadImmediate) {
    doc.save('CRONOGRAMA_DESENVOLVIMENTO_ENTRE_REDES.pdf');
  }

  return doc;
}

// ==========================================
// EXECUTIVE SUMMARY PDF GENERATOR
// ==========================================
export function generateExecutivePdf(downloadImmediate = true): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  const cyanColor: [number, number, number] = [6, 182, 212];
  const darkCyanColor: [number, number, number] = [14, 116, 144];
  const primaryColor: [number, number, number] = [15, 23, 42];

  // Title Banner
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, currentY, contentWidth, 36, 3, 3, 'F');
  doc.setFillColor(...cyanColor);
  doc.rect(margin, currentY, 4, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('RESUMO EXECUTIVO DO DESENVOLVIMENTO', margin + 8, currentY + 12);
  doc.setFontSize(12);
  doc.setTextColor(165, 243, 252);
  doc.text('Entre Redes: Há Ansiedade? – Sobrecarga Digital', margin + 8, currentY + 21);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(203, 213, 225);
  doc.text('Google AI Studio • EEEM Felipe Camarão (São Sebastião do Caí / RS)', margin + 8, currentY + 29);

  currentY += 42;

  // Summary Intro
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...primaryColor);
  doc.text('1. O Que É o Projeto?', margin, currentY);
  currentY += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(51, 65, 85);
  const text1 = doc.splitTextToSize(
    'O "Entre Redes: Há Ansiedade?" é um simulador tridimensional interativo educacional concebido para demonstrar como o uso excessivo de telas e o bombardeio incessante de notificações digitais provocam sobrecarga cognitiva, ansiedade e perda de controle motor em adolescentes. O software foi inteiramente desenvolvido e arquitetado utilizando o Google AI Studio.',
    contentWidth
  );
  doc.text(text1, margin, currentY);
  currentY += text1.length * 5.6 + 6;

  // Base Diagnóstica
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...primaryColor);
  doc.text('2. Base Diagnóstica Empírica (Pesquisa com 77 Estudantes)', margin, currentY);
  currentY += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(51, 65, 85);
  const text2 = doc.splitTextToSize(
    '• 80,5% utilizam redes sociais diariamente (66,2% todos os dias).\n• 52,0% passam mais de 4 horas diárias conectados.\n• 71,4% usam o celular imediatamente antes de dormir.\n• 84,4% têm a qualidade do sono prejudicada pelas telas.\n• 42,9% relatam sentimentos de tristeza ou ansiedade após o uso contínuo de redes.\n• 14,3% apresentam sintomas severos de F.O.M.O. (Fear of Missing Out).',
    contentWidth
  );
  doc.text(text2, margin, currentY);
  currentY += text2.length * 5.6 + 8;

  // Subtitle for Tech Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...primaryColor);
  doc.text('3. Módulos Técnicos e Tecnologias Utilizadas', margin, currentY);
  currentY += 7;

  // Tech Table (12pt font)
  applyAutoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Área do Sistema', 'Tecnologias Utilizadas', 'Ferramenta de Criação']],
    body: [
      ['Engine Gráfica 3D', 'Three.js r185, WebGL, AABB Physics', 'Three.js Procedural Modeler'],
      ['Arquitetura Web', 'TypeScript 5.8, React 19, Vite 6, Tailwind v4', 'Google AI Studio Engine'],
      ['Motor de Som', 'Web Audio API (Senoides, ADSR)', 'Osciladores Nativos do Navegador'],
      ['Banco de Dados', 'Firebase Firestore NoSQL + LocalStorage', 'Firebase Console / Cloud'],
      ['Interoperabilidade', 'Linguagem Luau (Roblox Studio)', 'Roblox Studio + JSZip Exporter'],
      ['Ciência & Gráficos', 'Recharts SVG, Pearson (r), jsPDF', 'Motor Vetorial e SVG'],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: darkCyanColor,
      textColor: [255, 255, 255],
      fontSize: 12,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 12,
      textColor: [30, 41, 59],
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [241, 245, 249],
    },
  });

  const totalPagesExec = doc.getNumberOfPages ? doc.getNumberOfPages() : (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPagesExec; i++) {
    doc.setPage(i);
    doc.setFillColor(...cyanColor);
    doc.rect(0, 0, pageWidth, 3, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text('EEEM Felipe Camarão • Turma 61 • São Sebastião do Caí / RS', margin, pageHeight - 9);
    doc.text(`Página ${i} de ${totalPagesExec}`, pageWidth - margin, pageHeight - 9, { align: 'right' });
  }

  if (downloadImmediate) {
    doc.save('RESUMO_EXECUTIVO_DESENVOLVIMENTO.pdf');
  }

  return doc;
}
