export interface Milestone {
  id: string;
  phase: string;
  title: string;
  period: string;
  focus: string;
  technologies: string[];
  tools: string[];
  deliverables: string[];
}

export const DEVELOPMENT_MILESTONES: Milestone[] = [
  {
    id: 'marco_1',
    phase: 'Marco 1',
    title: 'Diagnóstico Psicométrico & Concepção Pedagógica',
    period: 'Fase Inicial de Campo',
    focus: 'Investigação do impacto das notificações e telas na Turma 61 da EEEM Felipe Camarão.',
    technologies: ['Escala SAS-SV (Smartphone Addiction Scale)', 'Inventário FOMO', 'Estatística Descritiva'],
    tools: ['Questionários de Campo', 'Entrevistas Estruturadas', 'Planilhas Diagnósticas'],
    deliverables: [
      'Mapeamento empírico com 77 estudantes da EEEM Felipe Camarão',
      'Definição dos eixos do jogo: Ansiedade (0 a 100%), Sobrecarga Atencional e Resiliência',
      'Construção do banco com 100 perguntas reflexivas categorizadas'
    ]
  },
  {
    id: 'marco_2',
    phase: 'Marco 2',
    title: 'Pipeline de Engenharia & Arquitetura Web SPA',
    period: 'Arquitetura de Software',
    focus: 'Estruturação da infraestrutura de código de alto desempenho, segura e sem erros.',
    technologies: ['TypeScript 5.8', 'React 19.0', 'Vite 6.2', 'Tailwind CSS v4'],
    tools: ['VS Code / AI Studio Engine', 'Node.js v22 LTS', 'ESLint / TypeScript Compiler (tsc)'],
    deliverables: [
      'Configuração do ecossistema React 19 com compilação ultraveloz via Vite 6',
      'Definição dos tipos estritos em TypeScript para telemetria e estado de jogo',
      'Design System em Tailwind CSS v4 com paleta escura sensorial e tipografia moderna'
    ]
  },
  {
    id: 'marco_3',
    phase: 'Marco 3',
    title: 'Motor 3D, Câmera em Terceira Pessoa e Biomecânica Motora',
    period: 'Engenharia do Simulador',
    focus: 'Simulação física e gráfica da perda de controle e desaceleração por ansiedade.',
    technologies: ['Three.js r185.1 (WebGL)', 'Álgebra Vetorial (Vector3, Euler)', 'Algoritmo de Colisão AABB'],
    tools: ['Three.js Object3D Procedural Modeler', 'Render Loop RequestAnimationFrame', 'GLSL Shader Fog'],
    deliverables: [
      'Cenário 3D procedural leve executado a 60 FPS sem downloads de malhas pesadas',
      'Biomecânica de WalkSpeed: velocidade cai de 16 u/s para 4 u/s sob estresse',
      'Pós-processamento imersivo: tremor de tela (camera shake) e vinheta vermelha periférica'
    ]
  },
  {
    id: 'marco_4',
    phase: 'Marco 4',
    title: 'Áudio Procedural & Acessibilidade Universal',
    period: 'Sonoplastia e Ergonomia',
    focus: 'Síntese de som em tempo real e suporte a múltiplos esquemas de controle.',
    technologies: ['Web Audio API (W3C)', 'Gamepad API', 'Touch & Pointer Events API'],
    tools: ['OscillatorNodes & GainNodes (ADSR)', 'Touchscreen Virtual Joystick', 'Gamepad Bluetooth Mapping'],
    deliverables: [
      'Síntese sonora procedural (ondas senoidais, quadradas e ruído branco) com zero peso em megabytes',
      'Sonoplastia contrastante: bips dissonantes para notificações vs. acordes serenos para autocuidado',
      'Controles híbridos: Teclado/Mouse, Touch para celulares escolares e Joystick Bluetooth'
    ]
  },
  {
    id: 'marco_5',
    phase: 'Marco 5',
    title: 'Gamificação Positiva, Loja de Resiliência & Persistência Híbrida',
    period: 'Engenharia de Dados e Economia',
    focus: 'Incentivo a hábitos saudáveis de desconexão e armazenamento tolerante a falhas.',
    technologies: ['Firebase Firestore SDK v12.18', 'LocalStorage API (Offline-First)', 'Motion v12', 'Canvas Confetti'],
    tools: ['Firebase Console', 'Google Cloud Platform', 'NoSQL Real-time Sync'],
    deliverables: [
      'Economia de Moedas Douradas de Foco por coleta de hábitos saudáveis (livros, chá, cãozinho Luke)',
      'Loja de Habilidades de Resiliência: Pulo Duplo, Escudo Protetor, Ímã de Foco, Tênis Veloz e Bicicleta',
      'Persistência dupla: funciona 100% offline em salas de aula sem internet e sincroniza com a nuvem'
    ]
  },
  {
    id: 'marco_6',
    phase: 'Marco 6',
    title: 'Interoperabilidade Luau & Ecossistema Roblox Studio',
    period: 'Transposição Educacional',
    focus: 'Permitir que estudantes levem a lógica do simulador para a plataforma Roblox.',
    technologies: ['Linguagem Luau', 'Roblox ServerScriptService', 'StarterPlayerScripts', 'JSZip v3.10'],
    tools: ['Roblox Studio Engine', 'Syntax Highlighting Engine', 'Blob Zip Exporter'],
    deliverables: [
      'Geração modular de scripts Luau: GameManager.server.luau e PlayerController.client.luau',
      'Guia passo a passo ilustrado com diagramação da árvore de instâncias do Roblox',
      'Download do pacote completo em arquivo .zip com um clique diretamente pelo navegador'
    ]
  },
  {
    id: 'marco_7',
    phase: 'Marco 7',
    title: 'Inteligência Estatística, Dossiê em PDF & Narração Acessível',
    period: 'Consolidação Científica',
    focus: 'Evidências acadêmicas, tutorial narrado por voz e segmentação etária.',
    technologies: ['Recharts v3.10', 'Correlação de Pearson (r)', 'Web Speech API (TTS)', 'jsPDF + autoTable'],
    tools: ['Visualizador SVG', 'Síntese de Fala em Português', 'Gerador Vetorial de Documentos PDF'],
    deliverables: [
      'Cálculo em tempo real do Coeficiente de Pearson (r) e gráficos de dispersão estresse vs. telas',
      'Tutorial narrado de boas-vindas de 30 segundos com 4 fases didáticas e síntese de voz nativa',
      'Segmentação demográfica em 6 faixas etárias (crianças até 60+ anos) com criação de novas coortes',
      'Emissão de Dossiê Técnico Científico oficial em PDF e exportação de CSV para SPSS/R'
    ]
  }
];

export const FULL_CRONOGRAMA_MARKDOWN = `# 📅 Cronograma Executivo de Desenvolvimento: Tecnologias & Ferramentas
## Projeto Científico e Tecnológico: "Entre redes há ansiedade: Sobrecarga Digital"
**Instituição:** Escola Estadual de Ensino Médio Felipe Camarão (São Sebastião do Caí/RS)  
**Pesquisadores:** Augusto Joaquim Dullius, Caio Castilho Cercato e Leonardo Lottermann Dahmer (Turma 61)  
**Orientação:** Profª Me. Lisandra Jacobi Kölling Junges | **Coorientação:** Cristofer Stelzer da Silva  
**Orientador Técnico de Desenvolvimento do Game:** Christian Dahmer  
**Versão do Sistema:** 2.4.0 (Ambiente de Produção & Pesquisa)

---

## 📌 Visão Geral do Sistema e Arquitetura

O sistema consiste em um **Serious Game 3D e Plataforma de Diagnóstico Psicométrico** desenvolvido para quantificar e conscientizar sobre os impactos do uso excessivo de telas, do FOMO (*Fear of Missing Out*) e das notificações digitais. A plataforma integra três ecossistemas em harmonia:
1. **Simulador Web 3D em Tempo Real (WebGL / Three.js)**
2. **Plataforma Estatística e Coleta Empírica Multigeracional (Firebase Firestore + Recharts)**
3. **Módulo de Interoperabilidade e Exportação para Roblox Studio (Linguagem Luau)**

---

## 🚀 Resumo Cronológico por Marcos de Desenvolvimento

### 🏷️ MARCO 1: Diagnóstico de Campo & Concepção Pedagógica
* **Período:** Fase Inicial de Pesquisa de Campo
* **Objetivo:** Investigar a correlação empírica entre frequência de notificações em smartphones, qualidade do sono e ansiedade escolar.
* **Ferramentas de Criação:** Formulários diagnósticos e entrevistas presenciais com a Turma 61 (amostra de 77 estudantes da EEEM Felipe Camarão); escalas psicométricas padronizadas (SAS-SV e inventários de FOMO).
* **Tecnologias & Modelagem:** Planilhas analíticas de tabulação psicométrica; formulação das variáveis centrais: Ansiedade (0 a 100%), Sobrecarga Atencional e Resiliência Digital.

---

### 🏷️ MARCO 2: Pipeline de Engenharia & Arquitetura Web SPA
* **Período:** Estruturação da Base de Software
* **Objetivo:** Estabelecer a infraestrutura de código de alto desempenho, segura e sem erros de execução.
* **Ferramentas de Criação:** Visual Studio Code, AI Studio Engine, Node.js (v22 LTS).
* **Tecnologias Empregadas:** TypeScript 5.8, React 19.0, Vite 6.2, Tailwind CSS v4.

---

### 🏷️ MARCO 3: Motor Gráfico 3D, Câmera e Biomecânica Motora
* **Período:** Engenharia do Núcleo Lúdico (GameCanvas.tsx)
* **Objetivo:** Simular visualmente a sobrecarga mental através de física espacial e perda de controle motor.
* **Ferramentas de Criação:** Three.js Object3D Procedural Modeler, Render Loop RequestAnimationFrame, GLSL Shaders.
* **Tecnologias Empregadas:** Three.js r185.1 (WebGL 60 FPS), Álgebra Vetorial (Vector3 e Euler), Colisão AABB (Axis-Aligned Bounding Box), Modulação Dinâmica de WalkSpeed (16 u/s para 4 u/s), Câmera Shake e vinheta de pânico.

---

### 🏷️ MARCO 4: Motor de Áudio Procedural & Acessibilidade Universal
* **Período:** Sonoplastia e Ergonomia de Entrada (audio.ts)
* **Objetivo:** Criar imersão auditiva e suporte a múltiplos dispositivos sem demandar arquivos de áudio pesados.
* **Ferramentas de Criação:** Web Audio Synthesis Studio em TypeScript puro, Touchscreen Virtual Joystick.
* **Tecnologias Empregadas:** Web Audio API (AudioContext, OscillatorNodes, GainNodes ADSR), Gamepad API (controles Bluetooth/USB), Touch & Pointer Events API.

---

### 🏷️ MARCO 5: Persistência Híbrida, Gamificação & Economia Positiva
* **Período:** Hábitos Saudáveis e Banco de Dados (caseStorage.ts, firebase.ts)
* **Objetivo:** Recompensar escolhas saudáveis e garantir sincronização segura dos dados de pesquisa.
* **Ferramentas de Criação:** Firebase Console, Google Cloud Platform, LocalStorage Web API.
* **Tecnologias Empregadas:** Firebase Firestore Web SDK v12.18, LocalStorage API (modelo Offline-First), Motion 12, Canvas Confetti 1.9, Loja de Habilidades de Resiliência Digital.

---

### 🏷️ MARCO 6: Interoperabilidade Luau & Ecossistema Roblox Studio
* **Período:** Expansão para a Plataforma Favorita dos Jovens (luauScripts.ts, RobloxSetupGuide.tsx)
* **Objetivo:** Permitir que escolas e estudantes executem a mesma lógica no Roblox Studio.
* **Ferramentas de Criação:** Roblox Studio Engine, Syntax Highlighting, JSZip v3.10.
* **Tecnologias Empregadas:** Linguagem Luau tipada, GameManager.server.luau (ServerScriptService), PlayerController.client.luau (StarterPlayerScripts), FileSaver.

---

### 🏷️ MARCO 7: Inteligência Estatística, Dossiê em PDF & Narração Acessível
* **Período:** Consolidação Científica e Amostragem Intergeracional
* **Objetivo:** Fornecer comprovação acadêmica e autonomia total na primeira partida do jogador.
* **Ferramentas de Criação:** jsPDF, autoTable, Web Speech Synthesis.
* **Tecnologias Empregadas:** Recharts 3.10 (gráficos SVG), Coeficiente de Pearson (r), Web Speech API (voz nativa PT-BR para tutorial de 30 segundos), Gestor de 6 Coortes Demográficas por Faixas Etárias, Exportador CSV RFC 4180.

---

## 📊 Matriz de Referência Tecnológica

| Componente | Tecnologia | Ferramenta / Biblioteca | Função no Jogo |
| :--- | :--- | :--- | :--- |
| **Linguagem & Tipagem** | TypeScript 5.8 | Compilador tsc | Prevenção de bugs e integridade de tipos |
| **Interface de Usuário** | React 19 + Tailwind v4 | Lucide React + Motion | HUD dinâmico, loja, menus e modalidade touch |
| **Mundo Virtual 3D** | Three.js r185.1 | WebGL API nativa | Renderização 3D a 60 FPS, iluminação e sombras |
| **Biomecânica Física** | Algoritmo AABB | Vector3 / Math.min | Redução de WalkSpeed de 16 u/s para 4 u/s |
| **Áudio Procedural** | Web Audio API | Oscillators & Gain Nodes | Síntese de som sem arquivos pesados de áudio |
| **Narração do Tutorial** | Web Speech API | speechSynthesis (PT-BR) | Tutorial guiado por voz em 30 segundos |
| **Banco de Dados Nuvem** | NoSQL Distribuído | Firebase Firestore v12.18 | Sincronização de coletas empíricas |
| **Armazenamento Local** | Web Storage API | window.localStorage | Suporte offline total para escolas sem internet |
| **Exportação Roblox** | Linguagem Luau | Roblox Studio + JSZip | Portabilidade para a plataforma Roblox |
| **Análise Estatística** | Pearson (r) & OLS | Recharts 3.10 | Gráficos de dispersão e correlação empírica |
| **Dossiê Científico** | Vetorial Document | jsPDF 4.2 + autoTable 5.0 | Emissão do laudo técnico oficial em PDF |

---
*Documento gerado automaticamente pelo Sistema de Informações Técnicas e Científicas do Projeto "Entre Redes: Há Ansiedade?" (2026).*
`;

export const FULL_TECHNICAL_DOCUMENT_MARKDOWN = `# 📑 DOCUMENTO TÉCNICO OFICIAL DE DESENVOLVIMENTO
## Game Simulador 3D Interativo: "Entre Redes: Há Ansiedade? – Sobrecarga Digital"
### Cruzamento Técnico-Cronológico, Arquitetura de Software e Diagnóstico Psicométrico

**Instituição:** Escola Estadual de Ensino Médio Felipe Camarão (São Sebastião do Caí / RS)  
**Estudantes Idealizadores:** Augusto Joaquim Dullius, Caio Castilho Cercato, Leonardo Lottermann Dahmer (Turma 61)  
**Orientadora:** Profª Me. Lisandra Jacobi Kölling Junges | **Coorientador:** Cristofer Stelzer da Silva  
**Orientador Técnico de Desenvolvimento do Game:** Christian Dahmer  
**Versão Homologada do Sistema:** v2.4.0 (Ambiente de Produção, Pesquisa e Interoperabilidade)  

---

### 1. RESUMO EXECUTIVO E VISÃO GERAL DO SISTEMA
O simulador tridimensional interativo **"Entre Redes: Há Ansiedade?"** é uma tecnologia séria desenvolvida para diagnosticar e conscientizar sobre os impactos do uso excessivo de telas e notificações no desenvolvimento emocional de adolescentes e jovens.

### 2. MATRIZ DE CRUZAMENTO TÉCNICO-CRONOLÓGICO
- **Marco 1 (Diagnóstico Psicométrico):** Coleta com 77 alunos (84,4% sono afetado, 42,9% ansiedade pós-redes). Escala SAS-SV adaptada em 100 perguntas clínicas.
- **Marco 2 (Pipeline de Engenharia):** TypeScript 5.8 Strict, React 19, Vite 6, Tailwind CSS v4. Compilação em < 1.5s e zero runtime overhead.
- **Marco 3 (Motor Gráfico 3D):** Three.js r185.1 (WebGL), Loop AABB 60 FPS, desaceleração motora de WalkSpeed de 16 para 4 u/s sob estresse.
- **Marco 4 (Áudio Procedural & Acessibilidade):** Web Audio API (ADSR senoidal/ruído branco, 0 MB arquivos externos) e suporte híbrido Teclado/Touch/Gamepad.
- **Marco 5 (Gamificação & Persistência):** Loja de Resiliência, Moedas de Foco, Firebase Firestore e LocalStorage Offline-First para salas de aula sem internet.
- **Marco 6 (Interoperabilidade Luau):** Módulos Luau desacoplados para Roblox Studio (GameManager e PlayerController) empacotados em .zip com 1 clique.
- **Marco 7 (Inteligência Estatística, PDF & Voz):** Recharts SVG, Coeficiente de Pearson (r ≈ +0.78), Dossiê Oficial em PDF com jsPDF e tutorial narrado com Web Speech API em 4 fases didáticas.

### 3. FÓRMULAS E CALIBRAÇÃO DOS ALGORITMOS
- **Evolução de Ansiedade:** A(t) = clamp(A(t - dt) + (Σ Dano - Σ Alívio + TaxaTempo) * dt, 0, 100)
- **Modulação Motora (WalkSpeed):** WalkSpeed(A) = max(4.0, 16.0 - (A * 0.12))
- **Correlação de Pearson (r):** Coeficiente r calculado entre tempo de exposição e score de ansiedade SAS.
`;

export const FULL_EXECUTIVE_SUMMARY_MARKDOWN = `# 📊 RESUMO EXECUTIVO DO DESENVOLVIMENTO
## Game Simulador 3D "Entre Redes: Há Ansiedade? – Sobrecarga Digital"
### Síntese de Tecnologias, Ferramentas, Cronograma e Descobertas Científicas

**Escola Estadual de Ensino Médio Felipe Camarão** • São Sebastião do Caí / RS  
**Estudantes Pesquisadores:** Augusto J. Dullius, Caio C. Cercato e Leonardo L. Dahmer (Turma 61)  
**Orientação:** Profª Me. Lisandra Jacobi Kölling Junges | **Coorientação:** Cristofer Stelzer da Silva  
**Orientador Técnico de Desenvolvimento do Game:** Christian Dahmer  
**Versão:** 2.4.0 (WebGL / Three.js / Firebase / Luau)

---

### 1. O Que É o Projeto?
O "Entre Redes: Há Ansiedade?" é um simulador tridimensional interativo educacional concebido para demonstrar como o uso excessivo de telas e o bombardeio incessante de notificações digitais provocam sobrecarga cognitiva, ansiedade e perda de controle motor em adolescentes e jovens.

### 2. Base Diagnóstica Empírica (Pesquisa de Campo)
- **80,5%** utilizam redes sociais diariamente;
- **52,0%** passam mais de 4 horas diárias conectados;
- **71,4%** usam celular imediatamente antes de dormir;
- **84,4%** têm a qualidade do sono prejudicada pelas telas;
- **42,9%** relatam sentimentos de tristeza, vazio ou ansiedade após o uso contínuo de redes;
- **14,3%** apresentam sintomas severos de F.O.M.O. (Fear of Missing Out).

### 3. As Tecnologias e Ferramentas Empregadas
- **Motor 3D:** Three.js r185.1 (WebGL) procedural a 60 FPS;
- **Interface & Código:** React 19, TypeScript 5.8, Vite 6, Tailwind CSS v4;
- **Áudio:** Web Audio API com síntese matemática ADSR (zero megabytes de arquivos externos);
- **Física:** Colisão AABB e modulação de WalkSpeed (16 para 4 u/s);
- **Dados:** Firebase Firestore NoSQL + LocalStorage Offline-First;
- **Roblox:** Exportação Luau com download de .zip com 1 clique;
- **Ciência:** Gráficos Recharts, Pearson r, relatórios em PDF com jsPDF e voz com Web Speech API.

### 4. Conclusão de Impacto
O simulador comprova cientificamente e de forma imersiva que a tecnologia, com rigor ético e pedagógico, é um poderoso instrumento para a saúde mental e autorregulação digital juvenil.
`;

