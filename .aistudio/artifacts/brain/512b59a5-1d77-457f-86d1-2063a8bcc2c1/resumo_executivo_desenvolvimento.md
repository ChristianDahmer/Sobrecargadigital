# 📊 RESUMO EXECUTIVO DO DESENVOLVIMENTO
## Game Simulador 3D "Entre Redes: Há Ansiedade? – Sobrecarga Digital"
### Síntese de Tecnologias, Ferramentas, Cronograma e Descobertas Científicas

---

**Escola Estadual de Ensino Médio Felipe Camarão** • São Sebastião do Caí / RS  
**Estudantes Pesquisadores:** Augusto J. Dullius, Caio C. Cercato e Leonardo L. Dahmer (Turma 61)  
**Orientação:** Profª Me. Lisandra Jacobi Kölling Junges | **Coorientação:** Cristofer Stelzer da Silva  
**Orientador Técnico de Desenvolvimento do Game:** Christian Dahmer  
**Versão:** 2.4.0 (WebGL / Three.js / Firebase / Luau)

---

### 1. O Que É o Projeto?
O **"Entre Redes: Há Ansiedade?"** é um simulador tridimensional interativo educacional concebido para demonstrar como o uso excessivo de telas e o bombardeio incessante de notificações digitais provocam sobrecarga cognitiva, ansiedade e perda de controle motor em adolescentes e jovens. 

O jogador vivencia em tempo real a transição entre o foco saudável e a fadiga digital, aprendendo a importância de pausas ativas e descompressão presencial.

---

### 2. Base Diagnóstica Empírica (Pesquisa de Campo)
A simulação foi calibrada diretamente a partir dos dados coletados com **77 estudantes** da EEEM Felipe Camarão:
- **80,5%** utilizam redes sociais diariamente;
- **52,0%** passam mais de 4 horas diárias conectados;
- **71,4%** usam celular imediatamente antes de dormir;
- **84,4%** têm a qualidade do sono prejudicada pelas telas;
- **42,9%** relatam sentimentos de tristeza, vazio ou ansiedade após o uso contínuo de redes;
- **14,3%** apresentam sintomas severos de F.O.M.O. (*Fear of Missing Out*).

---

### 3. As Tecnologias e Ferramentas Empregadas
O sistema foi projetado com tecnologias modernas de alto desempenho para rodar fluido diretamente no navegador de computadores escolares, sem travamentos e sem necessidade de instalação:

| Área do Sistema | Tecnologias Utilizadas | Ferramentas de Criação | Benefício Prático |
| :--- | :--- | :--- | :--- |
| **Engine Gráfica 3D** | Three.js r185, WebGL, Álgebra Vetorial | Three.js Procedural Modeler, RequestAnimationFrame | 60 FPS estáveis mesmo em computadores mais modestos. |
| **Arquitetura Web** | TypeScript 5.8, React 19, Vite 6, Tailwind CSS v4 | VS Code, AI Studio Cloud Engine, Node.js v22 | Código modular, seguro contra bugs de tipagem e compilação em 1,5s. |
| **Motor de Som** | Web Audio API (ADSR, Senoides, Ruído Branco) | Osciladores Matemáticos Nativos do Navegador | Zero megabytes de arquivos de áudio; som gerado em tempo real por cálculos. |
| **Física & Colisões** | Caixas Delimitadoras AABB (*Axis-Aligned Bounding Box*) | Algoritmo Customizado com Normalização Delta-Time | Detecção milimétrica de colisões entre avatar e notificações. |
| **Banco de Dados** | Firebase Firestore NoSQL + LocalStorage API | Firebase Console, Google Cloud Platform | Funciona 100% offline em salas sem Wi-Fi e sincroniza na nuvem quando online. |
| **Gamificação** | Sistema de Moedas de Foco, Loja de Resiliência, Motion | Canvas Confetti, Gerenciador de Inventário | Recompensa hábitos saudáveis (livros, esportes, animais e descanso). |
| **Interoperabilidade** | Luau (Scripts Server e Client para Roblox Studio) | Roblox Studio IDE, JSZip Exporter | Permite aos estudantes levarem o código para o Roblox com download em 1 clique. |
| **Ciência & Dados** | Recharts, Coeficiente $r$ de Pearson, jsPDF, Web Speech API | Visualizador SVG, Sintetizador Vocal pt-BR | Relatórios automáticos em PDF, exportação CSV e tutorial com narração por voz. |

---

### 4. Resumo dos 7 Marcos do Desenvolvimento
1. **Marco 1 – Diagnóstico Psicométrico:** Coleta de dados com 77 alunos, adaptação da escala internacional SAS-SV em 100 perguntas reflexivas categorizadas.
2. **Marco 2 – Pipeline de Engenharia:** Estruturação da base em React 19, Vite 6 e TypeScript 5.8 com Tailwind CSS v4.
3. **Marco 3 – Motor 3D & Biomecânica:** Criação da pista infinita em Three.js e algoritmo de penalidade motora onde a velocidade (*WalkSpeed*) cai de $16$ para $4\text{ u/s}$ sob estresse.
4. **Marco 4 – Áudio Procedural & Acessibilidade:** Síntese matemática de som e suporte híbrido a teclado, toque em smartphones e joystick Bluetooth (Gamepad API).
5. **Marco 5 – Gamificação & Persistência:** Loja de Resiliência (Pulo Duplo, Escudo, Ímã de Foco, Bicicleta) e banco de dados híbrido tolerante a falhas.
6. **Marco 6 – Interoperabilidade Roblox (Luau):** Geração modular de scripts `.luau` empacotados em `.zip` para expansão pedagógica em aulas de robótica.
7. **Marco 7 – Inteligência Estatística & Acessibilidade:** Cálculo em tempo real da Correlação de Pearson ($r \approx +0.78$), Dossiê Técnico Oficial em PDF, segmentação em 6 faixas etárias e tutorial com voz humana.

---

### 5. Mecânica Central da Ansiedade no Simulador
- **Estímulos Nocivos:** Notificações flutuantes, curtidas incessantes e vídeos curtos geram picos de $+3\%$ a $+10\%$ de ansiedade, ativam tremores de tela (*camera shake*) e visão turva.
- **Estímulos Protetores:** Livros, esportes, hidratação e o cãozinho Lucky reduzem a ansiedade de $-3\%$ a $-10\%$.
- **Zona Verde Restaurativa:** Ao atingir a área de lazer (pesca e futebol), a ansiedade é reduzida continuamente a zero, demonstrando a importância do contato com a natureza e com o mundo físico real.

---

### 6. Conclusão e Impacto Educacional
O projeto comprova cientificamente e de forma tangível que a tecnologia, quando desenvolvida com propósito crítico e rigor metodológico, torna-se uma aliada poderosa da saúde mental juvenil. O simulador transforma números abstratos de pesquisas em uma experiência imersiva de autoconhecimento, promovendo escolhas digitais mais equilibradas e conscientes.
