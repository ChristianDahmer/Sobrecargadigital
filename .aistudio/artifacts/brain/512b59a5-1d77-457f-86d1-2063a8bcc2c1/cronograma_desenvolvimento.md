# 📅 Cronograma Executivo de Desenvolvimento: Tecnologias & Ferramentas
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
* **Ferramentas de Criação:**
  * Formulários diagnósticos e entrevistas presenciais com a Turma 61 (amostra de 77 estudantes da EEEM Felipe Camarão).
  * Escalas psicométricas padronizadas: adaptação da **SAS-SV** (*Smartphone Addiction Scale - Short Version*) e inventários de FOMO.
* **Tecnologias & Modelagem:**
  * Planilhas analíticas de tabulação psicométrica.
  * Formulação das variáveis centrais do jogo: *Nível de Ansiedade (0 a 100%)*, *Sobrecarga Atencional* e *Resiliência Digital*.

---

### 🏷️ MARCO 2: Pipeline de Engenharia & Arquitetura Web SPA
* **Período:** Estruturação da Base de Software
* **Objetivo:** Estabelecer a infraestrutura de código de alto desempenho, segura e sem erros de execução.
* **Ferramentas de Criação:**
  * **Visual Studio Code / AI Studio Engine:** Ambiente de desenvolvimento integrado.
  * **Node.js (v22 LTS):** Ambiente de execução JavaScript server-side e ferramentas de compilação.
* **Tecnologias Empregadas:**
  * **TypeScript 5.8:** Tipagem estática rigorosa para garantir tolerância zero a falhas em tempo de execução (`tsc --noEmit`).
  * **React 19.0:** Biblioteca declarativa para gerenciamento do ciclo de vida dos componentes e reatividade do HUD.
  * **Vite 6.2:** Ferramenta moderna de empacotamento (*bundler*) ultrarrápido com Hot Module Replacement (HMR) e suporte a ES Modules nativos.
  * **Tailwind CSS v4:** Framework utilitário de estilização responsiva, gerando layout fluido e acessível para qualquer resolução.

---

### 🏷️ MARCO 3: Motor Gráfico 3D, Câmera e Biomecânica Motora
* **Período:** Engenharia do Núcleo Lúdico (`src/components/GameCanvas.tsx`)
* **Objetivo:** Simular visualmente a sobrecarga mental através de física espacial e perda de controle motor.
* **Ferramentas de Criação:**
  * **Three.js Object3D Procedural Modeler:** Construção geométrica de avatares e itens sem dependência de malhas 3D externas (.gltf/.obj), viabilizando carregamento instantâneo em conexões escolares lentas.
* **Tecnologias Empregadas:**
  * **Three.js (r185.1) sobre WebGL:** Renderização 3D acelerada por hardware a 60 FPS com materiais `MeshStandardMaterial`, névoa atmosférica de ansiedade (`FogExp2`) e sombras suaves.
  * **Álgebra Vetorial (Vector3 & Euler):** Câmera dinâmica em terceira pessoa com interpolação suave (*lerp*).
  * **Detector de Colisão AABB (*Axis-Aligned Bounding Box*):** Algoritmo de intersecção volumétrica tridimensional de baixo custo computacional.
  * **Biomecânica da Sobrecarga (*Dynamic WalkSpeed*):**
    $$\text{Velocidade} = 16 - \left(\frac{\text{Ansiedade}}{100} \times 12\right) \quad \Rightarrow \quad [16\text{ u/s} \searrow 4\text{ u/s}]$$
    Materialização física do cansaço e paralisia gerados pela sobrecarga de informações.
  * **Pós-Processamento Sensorial:** Efeito de tremor de tela (*Camera Shake*) e vinheta periférica avermelhada no colapso mental.

---

### 🏷️ MARCO 4: Motor de Áudio Procedural & Acessibilidade Universal
* **Período:** Sonoplastia e Ergonomia de Entrada (`src/utils/audio.ts`)
* **Objetivo:** Criar imersão auditiva e suporte a múltiplos dispositivos sem demandar arquivos de áudio pesados.
* **Ferramentas de Criação:**
  * **Web Audio Synthesis Studio (Código Puro TypeScript):** Sintetizador sonoro customizado.
* **Tecnologias Empregadas:**
  * **Web Audio API (W3C Standard):** 
    * `AudioContext`, `OscillatorNode` (senoidais, triangulares e ruído branco) e `GainNode`.
    * Envelopes **ADSR** (*Attack, Decay, Sustain, Release*) programados para emitir bips estressantes nas notificações e acordes relaxantes nos hábitos de autocuidado.
  * **Gamepad API:** Suporte nativo a controles de console (PlayStation, Xbox e genéricos) via Bluetooth e USB.
  * **Pointer & Touch Events:** Joystick analógico virtual na tela para celulares e tablets escolares.

---

### 🏷️ MARCO 5: Persistência Híbrida, Gamificação & Economia Positiva
* **Período:** Hábitos Saudáveis e Banco de Dados (`src/utils/caseStorage.ts`, `src/lib/firebase.ts`)
* **Objetivo:** Recompensar escolhas saudáveis e garantir sincronização segura dos dados de pesquisa.
* **Ferramentas de Criação:**
  * **Firebase Console:** Painel de controle de nuvem e segurança de banco de dados NoSQL.
* **Tecnologias Empregadas:**
  * **Firebase Firestore Web SDK (v12.18):** Banco de dados em nuvem com sincronização em tempo real para armazenamento de sessões diagnósticas e usuários online.
  * **LocalStorage API:** Persistência local no navegador no modelo *Offline-First* (permite uso integral sem acesso à internet).
  * **Motion 12 & Canvas Confetti 1.9:** Feedback visual de conquistas, partículas e micro-interações na Loja de Resiliência Digital (Pulo Duplo, Escudo Protetor, Ímã de Foco, Tênis Veloz, Casaco Anti-Ruído e Bicicleta).

---

### 🏷️ MARCO 6: Interoperabilidade Luau & Ecossistema Roblox Studio
* **Período:** Expansão para a Plataforma Favorita dos Jovens (`src/luauScripts.ts`, `RobloxSetupGuide.tsx`)
* **Objetivo:** Permitir que escolas e estudantes executem a mesma lógica no Roblox Studio.
* **Ferramentas de Criação:**
  * **Roblox Studio Engine:** Validação e execução dos scripts cliente-servidor.
* **Tecnologias Empregadas:**
  * **Linguagem Luau:** Linguagem tipada e compilada da Roblox Corp.
  * **Arquitetura Roblox:** 
    * `GameManager.server.luau` em `ServerScriptService`.
    * `PlayerController.client.luau` em `StarterPlayerScripts`.
  * **JSZip 3.10 & File-Saver 2.0:** Geração em tempo de execução de arquivos compactados `.zip` para download imediato de todo o pacote Luau no navegador.

---

### 🏷️ MARCO 7: Inteligência Estatística, Dossiê em PDF & Narração Acessível
* **Período:** Consolidação Científica e Amostragem Intergeracional
* **Objetivo:** Fornecer comprovação acadêmica e autonomia total na primeira partida do jogador.
* **Ferramentas de Criação:**
  * **jsPDF & autoTable:** Motor de impressão vetorial PDF.
* **Tecnologias Empregadas:**
  * **Recharts 3.10:** Gráficos interativos em SVG de dispersão estatística e linha de tempo de estresse.
  * **Algoritmo de Correlação de Pearson ($r$):** Cálculo matemático em tempo real do grau de correlação entre tempo de tela e ansiedade.
  * **Web Speech API (`window.speechSynthesis`):** Tutorial narrado por voz nativa em português de 30 segundos, dividindo as instruções em 4 fases progressivas e card comparativo (*Notificações vs. Bem-Estar*).
  * **Motor de Segmentação Demográfica:** 6 faixas etárias estruturadas (9–11, 12–14 Turma 61, 15–17, 18–24, 25–59, 60+ anos) com criação de coortes personalizadas e filtros analíticos cruzados.
  * **Formatador CSV (RFC 4180):** Exportação direta para softwares de pós-graduação e pesquisa (SPSS, RStudio, PSPP).

---

## 📊 Matriz de Referência Tecnológica

| Componente | Tecnologia | Ferramenta / Biblioteca | Função no Jogo |
| :--- | :--- | :--- | :--- |
| **Linguagem & Tipagem** | TypeScript 5.8 | Compilador `tsc` | Prevenção de bugs e integridade de tipos |
| **Interface de Usuário** | React 19 + Tailwind v4 | Lucide React + Motion | HUD dinâmico, loja, menus e modalidade touch |
| **Mundo Virtual 3D** | Three.js r185.1 | WebGL API nativa | Renderização 3D a 60 FPS, iluminação e sombras |
| **Biomecânica Física** | Algoritmo AABB | Vector3 / Math.min | Redução de WalkSpeed de 16 u/s para 4 u/s |
| **Áudio Procedural** | Web Audio API | Oscillators & Gain Nodes | Síntese de som sem arquivos pesados de áudio |
| **Narração do Tutorial** | Web Speech API | `speechSynthesis` (PT-BR) | Tutorial guiado por voz em 30 segundos |
| **Banco de Dados Nuvem** | NoSQL Distribuído | Firebase Firestore v12.18 | Sincronização de coletas empíricas |
| **Armazenamento Local** | Web Storage API | `window.localStorage` | Suporte offline total para escolas sem internet |
| **Exportação Roblox** | Linguagem Luau | Roblox Studio + JSZip | Portabilidade para a plataforma Roblox |
| **Análise Estatística** | Pearson ($r$) & OLS | Recharts 3.10 | Gráficos de dispersão e correlação empírica |
| **Dossiê Científico** | Vetorial Document | jsPDF 4.2 + autoTable 5.0 | Emissão do laudo técnico oficial em PDF |

---
*Documento gerado automaticamente pelo Sistema de Informações Técnicas e Científicas do Projeto "Entre Redes: Há Ansiedade?" (2026).*
