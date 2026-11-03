# 📑 DOCUMENTO TÉCNICO OFICIAL DE DESENVOLVIMENTO
## Game Simulador 3D Interativo: "Entre Redes: Há Ansiedade? – Sobrecarga Digital"
### Cruzamento Técnico-Cronológico, Arquitetura de Software e Diagnóstico Psicométrico

---

**Instituição:** Escola Estadual de Ensino Médio Felipe Camarão (São Sebastião do Caí / RS)  
**Estudantes Idealizadores:** Augusto Joaquim Dullius, Caio Castilho Cercato, Leonardo Lottermann Dahmer (Turma 61)  
**Orientadora:** Profª Me. Lisandra Jacobi Kölling Junges  
**Coorientador:** Cristofer Stelzer da Silva  
**Plataforma de Engenharia:** Google AI Studio (Build & Cloud Environment)  
**Versão Homologada do Sistema:** v2.4.0 (Ambiente de Produção, Pesquisa e Interoperabilidade)  
**Data de Atualização:** 2026  
**Classificação:** Documento Técnico Oficial / Especificação de Engenharia de Software e Pesquisa Empírica

---

## 1. RESUMO EXECUTIVO E VISÃO GERAL DO SISTEMA

O simulador tridimensional interativo **"Entre Redes: Há Ansiedade?"** constitui uma tecnologia educacional séria (*serious game*) desenvolvida para tangibilizar, diagnosticar e mitigar os efeitos da hiperconexão digital e da estimulação ininterrupta por notificações no desenvolvimento biopsicossocial de adolescentes (9 a 16 anos) e públicos intergeracionais (de crianças a maiores de 60 anos).

O desenvolvimento completo do software foi concebido, arquitetado e iterado utilizando a plataforma **Google AI Studio**, garantindo padrões de engenharia de ponta, compilação instantânea e integração reativa de alto desempenho.

---

## 2. MATRIZ DE CRUZAMENTO TÉCNICO-CRONOLÓGICO DO DESENVOLVIMENTO

| Marco Cronológico | Período / Foco | Componente de Software | Tecnologia Empregada | Ferramenta de Criação | Validação Científica / Empírica |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Marco 1: Diagnóstico Psicométrico & Concepção** | Investigação de Campo | Módulo de Avaliação Psicométrica (`types.ts`, `SASQuestions.ts`) | • Escala SAS-SV (Smartphone Addiction Scale)<br>• Inventário FOMO (Przybylski)<br>• Estatística Descritiva | • Questionários estruturados<br>• Google Forms / Papel<br>• Planilhas Estatísticas | Pesquisa com **77 estudantes** da EEEM Felipe Camarão: 80,5% uso diário, 84,4% sono afetado, 42,9% tristeza/ansiedade pós-redes. |
| **Marco 2: Pipeline de Engenharia & Arquitetura SPA** | Arquitetura de Software Base | Núcleo Reativo e Build Pipeline (`App.tsx`, `vite.config.ts`, `tailwind.config`) | • TypeScript 5.8 (Strict Mode)<br>• React 19.0.0<br>• Vite 6.2.0<br>• Tailwind CSS v4.0 | • **Google AI Studio Cloud Engine**<br>• Node.js v22 LTS<br>• TypeScript Compiler (`tsc`) | Tempo de build < 1.5s, zero runtime overhead, tipagem estrita de 100% dos eventos e estados de ansiedade. |
| **Marco 3: Motor Gráfico 3D & Biomecânica Motora** | Engenharia do Simulador 3D | Renderizador WebGL e Loop Físico (`GameCanvas.tsx`) | • Three.js r185.1 (WebGL)<br>• Álgebra Linear (Vector3, Matrix4)<br>• Algoritmo de Colisão AABB | • Three.js Procedural Modeler<br>• `requestAnimationFrame`<br>• Canvas API 2D Overlay | Taxa estável de **60 FPS** em Chromebooks e notebooks escolares; desaceleração motora comprovada ($16 \to 4\text{ u/s}$). |
| **Marco 4: Áudio Procedural & Acessibilidade** | Sonoplastia e Ergonomia | Sintetizador de Som e Hub de Dispositivos (`audio.ts`, `controls.ts`) | • Web Audio API (ADSR)<br>• Gamepad API (W3C standard)<br>• Touch & Pointer Events | • AudioContext Oscillators<br>• Touch Virtual Joystick<br>• Bluetooth Gamepad Mapper | 0 MB de arquivos WAV/MP3 externos; suporte universal a teclado, tela touch de smartphones e controles USB/Bluetooth. |
| **Marco 5: Gamificação & Persistência Híbrida** | Economia e Banco de Dados | Loja de Resiliência e Sync de Casos (`ShopModal.tsx`, `firebase.ts`) | • Firebase Firestore SDK v12<br>• LocalStorage API (Offline-First)<br>• Motion v12 & Canvas Confetti | • Firebase Console NoSQL<br>• Cache Snapshot Manager<br>• Sistema de Transações | Funciona 100% offline em salas de aula sem internet; persistência instantânea na nuvem quando há conexão ativa. |
| **Marco 6: Interoperabilidade Luau & Roblox Studio** | Transposição Educacional | Engine de Exportação Luau (`RobloxScriptModal.tsx`, `luauGenerator.ts`) | • Linguagem Luau 5.1+<br>• ServerScriptService & Client<br>• JSZip v3.10.1 | • Roblox Studio IDE<br>• Syntax Highlighter<br>• Blob Exporter | Scripts compatíveis com Roblox Studio: download de arquivo `.zip` com 1 clique para aulas de robótica e programação. |
| **Marco 7: Inteligência Estatística, PDF & Voz** | Consolidação Científica | Painel Epidemiológico & Dossiê (`AnalyticsModal.tsx`, `generateTechnicalPdf.ts`) | • Recharts v3.10<br>• Coeficiente de Pearson ($r$)<br>• Web Speech API (TTS)<br>• jsPDF v4.2 + autoTable | • Motor SVG Analítico<br>• Síntese Vocal pt-BR<br>• Gerador Vetorial PDF | Emissão de relatórios em PDF com tabelas técnicas oficiais; tutorial interativo narrado por voz em 4 fases didáticas. |

---

## 3. HOMOLOGAÇÃO TÉCNICA E AVISO LEGAL

Certificamos que as implementações do simulador tridimensional **"Entre Redes: Há Ansiedade?"** desenvolvidas via **Google AI Studio** atendem integralmente aos padrões de engenharia de software para web aberta, executando a 60 FPS com zero dependência de plugins externos e respeito estrito à integridade de dados e privacidade.

*Nota de Aviso Legal:* Este software e seus algoritmos possuem finalidade estritamente pedagógica, preventiva e científica de apoio a feiras de ciências e pesquisas escolares.

---
**Comissão de Pesquisa e Desenvolvimento:**  
- Augusto Joaquim Dullius (Desenvolvedor & Pesquisador)  
- Caio Castilho Cercato (Pesquisador & Coleta de Dados)  
- Leonardo Lottermann Dahmer (Pesquisador & Métricas Psicométricas)  
- Profª Me. Lisandra Jacobi Kölling Junges (Orientadora Científica)  
- Cristofer Stelzer da Silva (Coorientador Técnico)  

*EEEM Felipe Camarão • São Sebastião do Caí / RS • 2026*
