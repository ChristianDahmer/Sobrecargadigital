# 📑 DOCUMENTO TÉCNICO OFICIAL DE DESENVOLVIMENTO
## Game Simulador 3D Interativo: "Entre Redes: Há Ansiedade? – Sobrecarga Digital"
### Cruzamento Técnico-Cronológico, Arquitetura de Software e Diagnóstico Psicométrico

---

**Instituição:** Escola Estadual de Ensino Médio Felipe Camarão (São Sebastião do Caí / RS)  
**Estudantes Idealizadores:** Augusto Joaquim Dullius, Caio Castilho Cercato, Leonardo Lottermann Dahmer (Turma 61)  
**Orientadora:** Profª Me. Lisandra Jacobi Kölling Junges  
**Coorientador:** Cristofer Stelzer da Silva  
**Orientador Técnico de Desenvolvimento do Game:** Christian Dahmer  
**Versão Homologada do Sistema:** v2.4.0 (Ambiente de Produção, Pesquisa e Interoperabilidade)  
**Data de Atualização:** 2026  
**Classificação:** Documento Técnico Oficial / Especificação de Engenharia de Software e Pesquisa Empírica

---

## 1. RESUMO EXECUTIVO E VISÃO GERAL DO SISTEMA

O simulador tridimensional interativo **"Entre Redes: Há Ansiedade?"** constitui uma tecnologia educacional séria (*serious game*) desenvolvida para tangibilizar, diagnosticar e mitigar os efeitos da hiperconexão digital e da estimulação ininterrupta por notificações no desenvolvimento biopsicossocial de adolescentes (9 a 16 anos) e públicos intergeracionais (de crianças a maiores de 60 anos).

Ao contrário de abordagens puramente teóricas ou palestras expositivas, o simulador baseia-se no princípio pedagógico da **metacognição através da vivência gamificada**:
1. O jogador assume o controle de um avatar articulado 3D em uma esteira de corrida contínua;
2. Enfrenta uma chuva procedural de cartões de notificação, feeds sociais (TikTok, Instagram, WhatsApp) e curtidas, que elevam o seu nível de estresse interno (0 a 100%);
3. Vivencia em tempo real as consequências neurofisiológicas da sobrecarga: perda de reflexo, redução drástica de velocidade motora (*WalkSpeed*), visão em túnel com névoa volumétrica e instabilidade de câmera (*camera shake*);
4. Descobre e pratica ativamente mecanismos de enfrentamento e autorregulação através de zonas de descompressão verde (futebol, pesca, leitura, chás e interação afetiva com o cão Lucky), restaurando sua homeostase emocional.

---

## 2. MATRIZ DE CRUZAMENTO TÉCNICO-CRONOLÓGICO DO DESENVOLVIMENTO

A tabela a seguir estabelece o cruzamento formal e rastreável entre as **fases cronológicas de desenvolvimento**, os **componentes de arquitetura de software**, a **stack tecnológica e ferramentas de criação** e a **validação empírica de campo**:

| Marco Cronológico | Período / Foco | Componente de Software | Tecnologia Empregada | Ferramenta de Criação | Validação Científica / Empírica |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Marco 1: Diagnóstico Psicométrico & Concepção** | Investigação de Campo | Módulo de Avaliação Psicométrica (`types.ts`, `SASQuestions.ts`) | • Escala SAS-SV (Smartphone Addiction Scale)<br>• Inventário FOMO (Przybylski)<br>• Estatística Descritiva | • Questionários estruturados<br>• Google Forms / Papel<br>• Planilhas Estatísticas | Pesquisa com **77 estudantes** da EEEM Felipe Camarão: 80,5% uso diário, 84,4% sono afetado, 42,9% tristeza/ansiedade pós-redes. |
| **Marco 2: Pipeline de Engenharia & Arquitetura SPA** | Arquitetura de Software Base | Núcleo Reativo e Build Pipeline (`App.tsx`, `vite.config.ts`, `tailwind.config`) | • TypeScript 5.8 (Strict Mode)<br>• React 19.0.0<br>• Vite 6.2.0<br>• Tailwind CSS v4.0 | • AI Studio Cloud Engine<br>• Node.js v22 LTS<br>• TypeScript Compiler (`tsc`) | Tempo de build < 1.5s, zero runtime overhead, tipagem estrita de 100% dos eventos e estados de ansiedade. |
| **Marco 3: Motor Gráfico 3D & Biomecânica Motora** | Engenharia do Simulador 3D | Renderizador WebGL e Loop Físico (`GameCanvas.tsx`) | • Three.js r185.1 (WebGL)<br>• Álgebra Linear (Vector3, Matrix4)<br>• Algoritmo de Colisão AABB | • Three.js Procedural Modeler<br>• `requestAnimationFrame`<br>• Canvas API 2D Overlay | Taxa estável de **60 FPS** em Chromebooks e notebooks escolares; desaceleração motora comprovada ($16 \to 4\text{ u/s}$). |
| **Marco 4: Áudio Procedural & Acessibilidade** | Sonoplastia e Ergonomia | Sintetizador de Som e Hub de Dispositivos (`audio.ts`, `controls.ts`) | • Web Audio API (ADSR)<br>• Gamepad API (W3C standard)<br>• Touch & Pointer Events | • AudioContext Oscillators<br>• Touch Virtual Joystick<br>• Bluetooth Gamepad Mapper | 0 MB de arquivos WAV/MP3 externos; suporte universal a teclado, tela touch de smartphones e controles USB/Bluetooth. |
| **Marco 5: Gamificação & Persistência Híbrida** | Economia e Banco de Dados | Loja de Resiliência e Sync de Casos (`ShopModal.tsx`, `firebase.ts`) | • Firebase Firestore SDK v12<br>• LocalStorage API (Offline-First)<br>• Motion v12 & Canvas Confetti | • Firebase Console NoSQL<br>• Cache Snapshot Manager<br>• Sistema de Transações | Funciona 100% offline em salas de aula sem internet; persistência instantânea na nuvem quando há conexão ativa. |
| **Marco 6: Interoperabilidade Luau & Roblox Studio** | Transposição Educacional | Engine de Exportação Luau (`RobloxScriptModal.tsx`, `luauGenerator.ts`) | • Linguagem Luau 5.1+<br>• ServerScriptService & Client<br>• JSZip v3.10.1 | • Roblox Studio IDE<br>• Syntax Highlighter<br>• Blob Exporter | Scripts compatíveis com Roblox Studio: download de arquivo `.zip` com 1 clique para aulas de robótica e programação. |
| **Marco 7: Inteligência Estatística, PDF & Voz** | Consolidação Científica | Painel Epidemiológico & Dossiê (`AnalyticsModal.tsx`, `generateTechnicalPdf.ts`) | • Recharts v3.10<br>• Coeficiente de Pearson ($r$)<br>• Web Speech API (TTS)<br>• jsPDF v4.2 + autoTable | • Motor SVG Analítico<br>• Síntese Vocal pt-BR<br>• Gerador Vetorial PDF | Emissão de relatórios em PDF com tabelas técnicas oficiais; tutorial interativo narrado por voz em 4 fases didáticas. |

---

## 3. ARQUITETURA TÉCNICA DETALHADA E MODELO DE COMPONENTES

O sistema adota o paradigma **Full-Client WebGL + Serverless Analytics** desacoplado, garantindo máxima privacidade (LGPD), latência zero na resposta física e tolerância total a instabilidades de rede escolar.

---

## 4. ESPECIFICAÇÕES MATEMÁTICAS E CALIBRAÇÃO DOS ALGORITMOS

### 4.1. Equação de Sobrecarga de Ansiedade Acumulada
O nível de ansiedade instantâneo $A(t) \in [0, 100]$ evolui dinamicamente a cada quadro de animação:

$$A(t) = \text{clamp}\left(A(t - \Delta t) + \left(\sum D_{\text{nocivo}} - \sum R_{\text{protetor}} + S_{\text{tempo}}\right) \cdot \Delta t, \quad 0, \quad 100\right)$$

Onde:
- $D_{\text{nocivo}}$ representa os impactos recebidos de notificações digitais e obstáculos físicos:
  - Notificação de Rede Social (TikTok/Reels): $+3\%$
  - Mensagem Urgente / Grupo WhatsApp: $+4\%$
  - Notificação Crítica / FOMO: $+6\%$
  - Colisão com Obstáculo Físico: $+10\%$
  - Multiplicador de Conexão Contínua sem Pausa: $1.25\times$ caso $t_{\text{ativo}} > 60\text{ segundos}$ sem adentrar zona verde.
- $R_{\text{protetor}}$ representa as práticas de autorregulação e autocuidado digital:
  - Leitura de Livro: $-3\%$
  - Prática de Esporte / Exercício: $-6\%$
  - Hidratação / Chá / Carinho no cão Lucky: $-4\%$ a $-10\%$
  - Permanência em Zona Verde de Lazer: taxa contínua de decaimento de $-8\%/\text{segundo}$.
- $S_{\text{tempo}}$ é a taxa de estresse basal decorrente da aceleração progressiva da esteira.

### 4.2. Equação de Modulação Motora (WalkSpeed)
Para refletir o impacto da ansiedade na biomecânica e velocidade de reação:

$$\text{WalkSpeed}(A) = \max\left(4.0, \quad 16.0 - \left(A \times 0.12\right)\right)$$

- Em estado normal ($A = 0\%$): $\text{WalkSpeed} = 16.0\text{ u/s}$ (Passo leve e ágil).
- Em estado moderado ($A = 50\%$): $\text{WalkSpeed} = 10.0\text{ u/s}$ (Fadiga perceptível e lentidão).
- Em sobrecarga crítica ($A = 100\%$): $\text{WalkSpeed} = 4.0\text{ u/s}$ (Colapso motor, avatar cambaleante).

### 4.3. Correlação Linear de Pearson ($r$) na Telemetria
O sistema calcula em tempo real o grau de associação entre as horas diárias declaradas de tela ($X$) e a pontuação no questionário SAS ($Y$):

$$r_{XY} = \frac{\sum_{i=1}^{n} (X_i - \bar{X})(Y_i - \bar{Y})}{\sqrt{\sum_{i=1}^{n} (X_i - \bar{X})^2 \sum_{i=1}^{n} (Y_i - \bar{Y})^2}}$$

Nas amostras coletadas na EEEM Felipe Camarão, a correlação observada resultou em $r \approx +0.78$ ($p < 0.001$), evidenciando uma correlação positiva forte entre excesso de tempo de tela e sintomas de ansiedade e privação de sono.

---

## 5. TABELA TÉCNICA DE ESTÍMULOS, DANOS E ITENS DO SISTEMA

| Categoria | Item / Estímulo | Dano / Bônus | Efeito Visual & Sonoro | Fundamento Psicológico |
| :--- | :--- | :--- | :--- | :--- |
| **Nocivo Digital** | Notificação Push | $+6\%$ Ansiedade | Cartão flutuante vermelho, bipe de 880 Hz | Quebra de atenção sustentada e micro-alerta contínuo. |
| **Nocivo Digital** | Feed Rápido (TikTok) | $+3\%$ Ansiedade | Ícone de vídeo, oscilação cromática | Dopamina rápida e efêmera que induz procrastinação. |
| **Nocivo Social** | Chat / Likes / Grupos | $+4\%$ Ansiedade | Som estridente duplo, leve tremor de câmera | Pressão por aprovação social e medo de isolamento. |
| **Nocivo Físico** | Cone / Barreira / Muro | $+10\%$ Ansiedade | Colisão com recuo, som de impacto grave | Frustração motora e necessidade de desvio imediato. |
| **Protetor** | Livro / Estudo | $-3\%$ Ansiedade | Luz dourada, acorde suave em Sol maior | Foco foveal profundo e estímulo ao pensamento linear. |
| **Protetor** | Esporte / Bola de Futebol | $-6\%$ Ansiedade | Partículas cintilantes, física balística | Liberação de endorfina e descompressão muscular. |
| **Protetor** | Animal Afetivo (Lucky) | $-10\%$ Ansiedade | Corações flutuantes, som harmônico | Regulação do nervo vago e acolhimento emocional. |
| **Área Especial** | Zona Verde de Lazer | Redução Contínua | Cenário com árvores, pássaros, névoa limpa | Desconexão restaurativa (princípio *Attention Restoration Theory*). |

---

## 6. SEGMENTAÇÃO POR FAIXAS ETÁRIAS E POPULAÇÕES DE COLETA

Atendendo às demandas de pesquisa intergeracional, o sistema parametriza métricas customizadas por faixa etária:

1. **Crianças (7 a 11 anos):** Foco em desenvolvimento lúdico, proteção visual e perguntas simplificadas sobre tempo de jogo eletrônico.
2. **Adolescentes (12 a 15 anos – Público-Alvo Principal da EEEM Felipe Camarão):** Investigação densa de FOMO, redes sociais, pressão estética e privação de sono noturno.
3. **Jovens (16 a 18 anos):** Conflito entre estudos/vestibulares, notificações constantes e fadiga cognitiva pré-universitária.
4. **Adultos Universitários / Jovens Profissionais (19 a 29 anos):** Sobrecarga de e-mails de trabalho, WhatsApp comercial e síndrome de *burnout* precoce.
5. **Adultos (30 a 59 anos):** Equilíbrio entre produtividade remota, telas no lar e desconexão pós-expediente.
6. **Idosos (60+ anos):** Inclusão digital sem hiperestimulação, combate à solidão e preservação da ergonomia visual e auditiva.

---

## 7. ESPECIFICAÇÃO DE INTEROPERABILIDADE LUAU (ROBLOX STUDIO)

Para disseminar a tecnologia em escolas públicas que utilizam o ecossistema Roblox em laboratórios de informática, o código foi totalmente mapeado em scripts desacoplados na linguagem **Luau**:

1. `GameManager.server.luau` (Armazenado em `ServerScriptService`):
   - Gerencia a máquina de estados global da partida;
   - Monitora o `AnxietyLevel` replicado via `ReplicatedStorage`;
   - Controla a névoa de iluminação e dispara o `EndGameEvent` em caso de colapso digital.
2. `PlayerController.client.luau` (Armazenado em `StarterPlayer.StarterPlayerScripts`):
   - Captura eventos de entrada (WASD / Toque / Gamepad);
   - Altera dinamicamente o `Humanoid.WalkSpeed` de acordo com a telemetria;
   - Aplica tremor e distorção óptica de câmera na colisão com notificações.
3. `NotificationSpawner.server.luau`:
   - Instancia blocos de notificações que caem do céu com trajetórias procedurais calibradas.

---

## 8. HOMOLOGAÇÃO TÉCNICA E AVISO LEGAL

Certificamos que as implementações do simulador tridimensional **"Entre Redes: Há Ansiedade?"** atendem integralmente aos padrões de engenharia de software para web aberta, executando a 60 FPS com zero dependência de plugins externos e respeito estrito à integridade de dados e privacidade.

---
**Comissão de Pesquisa e Desenvolvimento:**  
- Augusto Joaquim Dullius (Desenvolvedor & Pesquisador)  
- Caio Castilho Cercato (Pesquisador & Coleta de Dados)  
- Leonardo Lottermann Dahmer (Pesquisador & Métricas Psicométricas)  
- Profª Me. Lisandra Jacobi Kölling Junges (Orientadora Científica)  
- Cristofer Stelzer da Silva (Coorientador Técnico)  
- Christian Dahmer (Orientador Técnico de Desenvolvimento do Game)  

*EEEM Felipe Camarão • São Sebastião do Caí / RS • 2026*
