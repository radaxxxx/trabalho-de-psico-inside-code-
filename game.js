// ===== InsideCode - protótipo jogável =====
// Salve como game.js e abra index.html no navegador.
// Autor: Gerado por ChatGPT (exemplo educativo)

// ---------- Dados iniciais e utilitários ----------
const SAVE_KEY = "insidecode_save_v1";

function clamp(n){ return Math.max(0, Math.min(100, Math.round(n))); }
function addLog(text){
  const log = document.getElementById("event-log");
  const div = document.createElement("div");
  div.className = "log-item";
  div.textContent = `${new Date().toLocaleTimeString()} — ${text}`;
  log.prepend(div);
}

// Typewriter simples para o texto da cena
async function typeText(targetEl, text, speed = 14){
  targetEl.textContent = "";
  for(let i=0;i<text.length;i++){
    targetEl.textContent += text[i];
    await new Promise(r => setTimeout(r, speed));
  }
}

// ---------- Estado do jogo ----------
const initialState = {
  sprint: 1,
  sprintTotal: 3,
  decisionsCount: 0,
  stats: {
    moral: 70,
    codeQuality: 70,
    stress: 40,
    managerTrust: 60
  },
  sceneId: "intro",
  events: []
};

let state = JSON.parse(JSON.stringify(initialState));

// ---------- Definição de cenas (narrativa) ----------
/*
Cada cena:
- id
- text (string)
- choices: array de { text, effects (aplica ao stats), next, log (mensagem) }
- optional: onEnter(state) para lógica adicional
*/
const scenes = {
  intro: {
    text: "Bem-vindo ao InsideCode. Você é um desenvolvedor júnior. O projeto tem 3 sprints. Tome decisões que afetarão a equipe, a qualidade do código e sua própria saúde mental. Está pronto para o primeiro sprint?",
    choices: [
      { text: "Começar Sprint 1 — participar da daily", effects: { managerTrust:+5, stress:-5 }, next: "sprint1_planning", log:"Participou da daily e demonstrou proatividade." },
      { text: "Começar Sprint 1 — ser discreto", effects: { managerTrust:-5, stress:+5 }, next: "sprint1_planning", log:"Preferiu observar e não se expor na team daily." }
    ]
  },

  sprint1_planning: {
    text: "Planejamento do Sprint 1: o PO pediu entrega rápida de uma feature crítica. O time está dividido sobre priorizar testes ou entregar pela data.",
    choices: [
      { text: "Priorizar entrega (aceitar dívida técnica)", effects: { codeQuality:-10, managerTrust:+8, stress:+5 }, next:"sprint1_mid", log:"Priorizou entrega, acumulando dívida técnica." },
      { text: "Argumentar por qualidade (testes/refatoração)", effects: { codeQuality:+8, moral:+4, managerTrust:-6 }, next:"sprint1_mid", log:"Defendeu qualidade, enfrentando pressão do PO." }
    ]
  },

  sprint1_mid: {
    text: "Metade do sprint: um colega está sobrecarregado e pede ajuda. Sua carga também está alta.",
    choices: [
      { text: "Ajudar o colega (reduzir produtividade própria)", effects: { moral:+8, stress:+8, codeQuality:+4 }, next:"sprint1_end", log:"Ajudou o colega; time ficou grato." },
      { text: "Focar nas próprias tarefas", effects: { moral:-6, stress:-3 }, next:"sprint1_end", log:"Focou nas próprias tarefas, evitando risco pessoal." }
    ]
  },

  sprint1_end: {
    text: "Fim do Sprint 1: houve um hotfix e algumas decisões vão repercutir nos próximos sprints.",
    choices: [
      { text: "Ir para Sprint 2", effects: {}, next:"interlude" }
    ]
  },

  interlude: {
    text: "Você tem um breve intervalo entre sprints. Aproveite para refletir ou descansar (escolha afeta stress e moral).",
    choices: [
      { text: "Descansar e estudar (pequeno descanso)", effects: { stress:-8, managerTrust:+2 }, next:"sprint2_planning", log:"Fez auto-cuidado e aprimoramento técnico." },
      { text: "Trabalhar horas extras", effects: { stress:+12, managerTrust:+6, codeQuality:-4 }, next:"sprint2_planning", log:"Fez horas extras para melhorar reputação." }
    ]
  },

  sprint2_planning: {
    text: "Sprint 2 começa: o time detectou débito técnico que pode causar falhas. O gerente quer mitigar, mas o prazo é curto.",
    choices: [
      { text: "Liderar refatoração (abrir PR grande)", effects: { codeQuality:+12, stress:+10, managerTrust:-4 }, next:"sprint2_mid", log:"Liderou esforço de refatoração." },
      { text: "Isolar correções pequenas", effects: { codeQuality:+4, managerTrust:+3 }, next:"sprint2_mid", log:"Focou em correções localizadas para minimizar risco." }
    ]
  },

  sprint2_mid: {
    text: "Um bug crítico aparece durante a integração contínua (CI). Tempo de decisão: aplicar hotfix ou bloquear release para investigar?",
    choices: [
      { text: "Hotfix rápido (risco)", effects: { codeQuality:-12, managerTrust:+8, stress:+6 }, next:"sprint2_end", log:"Aplicou hotfix rápido; release mantida, risco futuro aumentado." },
      { text: "Bloquear e investigar", effects: { codeQuality:+8, managerTrust:-6, stress:+4 }, next:"sprint2_end", log:"Bloqueou release para investigação, atrasando entrega." }
    ]
  },

  sprint2_end: {
    text: "Fim do Sprint 2. As escolhas acumuladas começam a mostrar efeitos no projeto.",
    choices: [
      { text: "Preparar Sprint 3 (final)", effects: {}, next:"sprint3_planning" }
    ]
  },

  sprint3_planning: {
    text: "Sprint 3 (final): o produto está quase pronto, mas um bug acumulado de dívida técnica ameaça o lançamento final.",
    choices: [
      { text: "Priorizar lançamento (pressa)", effects: { managerTrust:+10, codeQuality:-20, stress:+8 }, next:"sprint3_mid", log:"Empurrou o lançamento para manter prazos." },
      { text: "Adiar para consertar dívida", effects: { managerTrust:-8, codeQuality:+18, moral:+6, stress:+6 }, next:"sprint3_mid", log:"Adiou lançamento para priorizar qualidade." }
    ]
  },

  sprint3_mid: {
    text: "Última semana: mentor dá feedback crítico sobre sua atuação. Você pode aceitar e melhorar ou negar e justificar suas decisões.",
    choices: [
      { text: "Ouvir e agir no feedback", effects: { managerTrust:+6, moral:+4, stress:-6 }, next:"ending", log:"Recebeu feedback e mostrou crescimento." },
      { text: "Defender suas decisões (explique o contexto)", effects: { managerTrust:-3, moral:+2, stress:+2 }, next:"ending", log:"Defendeu suas decisões; impacto misto." }
    ]
  },

  ending: {
    text: "Final do projeto: com base nas métricas, diferentes finais serão apresentados.",
    choices: [
      { text: "Ver resultado final", effects: {}, next:"final_result" }
    ]
  },

  final_result: {
    text: "Calculando resultado final...",
    choices: []
  }
};

// ---------- Lógica de efeitos e transições ----------
function applyEffects(effects){
  const s = state.stats;
  if(!effects) return;
  if("moral" in effects) s.moral = clamp(s.moral + effects.moral);
  if("codeQuality" in effects) s.codeQuality = clamp(s.codeQuality + effects.codeQuality);
  if("stress" in effects) s.stress = clamp(s.stress + effects.stress);
  if("managerTrust" in effects) s.managerTrust = clamp(s.managerTrust + effects.managerTrust);

  // also accept shorthand aliases
  if("moral" in effects === false && "moral" in effects) s.moral = clamp(s.moral + effects.moral);
}

// Helper: effects object may use short names; convert when applying
function applyEffectsNormalized(effects){
  if(!effects || Object.keys(effects).length === 0) return;
  const s = state.stats;
  for(const key in effects){
    const val = effects[key];
    if(key === "moral") s.moral = clamp(s.moral + val);
    if(key === "managerTrust" || key === "manager") s.managerTrust = clamp(s.managerTrust + val);
    if(key === "codeQuality" || key === "code") s.codeQuality = clamp(s.codeQuality + val);
    if(key === "stress") s.stress = clamp(s.stress + val);
  }
}

// ---------- Renderização ----------
const dom = {
    sceneText: document.getElementById("scene-text"),
    choices: document.getElementById("choices"),
    moralBar: document.getElementById("moral-bar"),
    codeBar: document.getElementById("code-bar"),
    stressBar: document.getElementById("stress-bar"),
    managerBar: document.getElementById("manager-bar"),
    moralVal: document.getElementById("moral-val"),
    codeVal: document.getElementById("code-val"),
    stressVal: document.getElementById("stress-val"),
    managerVal: document.getElementById("manager-val"),
    sprintNum: document.getElementById("sprint-num"),
    sprintTotal: document.getElementById("sprint-total"),
    decisionsCount: document.getElementById("decisions-count"),
    saveBtn: document.getElementById("save-btn"),
    loadBtn: document.getElementById("load-btn"),
    resetBtn: document.getElementById("reset-btn")
};

function updateStatsUI(){
    const s = state.stats;
    dom.moralBar.value = s.moral; dom.moralVal.textContent = s.moral;
    dom.codeBar.value = s.codeQuality; dom.codeVal.textContent = s.codeQuality;
    dom.stressBar.value = s.stress; dom.stressVal.textContent = s.stress;
    dom.managerBar.value = s.managerTrust; dom.managerVal.textContent = s.managerTrust;

    dom.sprintNum.textContent = state.sprint;
    dom.sprintTotal.textContent = state.sprintTotal;
    dom.decisionsCount.textContent = state.decisionsCount;
}

// Render scene and choices
async function render(){
    const scene = scenes[state.sceneId];
    if(!scene) return console.error("Cena não encontrada:", state.sceneId);

  // render text with typewriter
    await typeText(dom.sceneText, scene.text, 8);

  // choices
    dom.choices.innerHTML = "";
    if(scene.choices && scene.choices.length > 0){
    scene.choices.forEach((choice, idx) => {
        const btn = document.createElement("button");
        btn.className = "choice-btn";
        btn.innerText = choice.text;
        btn.onclick = async () => {
        // Apply effects (normalized)
        applyEffectsNormalized(choice.effects);
        // log
        if(choice.log) addLog(choice.log);
        state.decisionsCount += 1;

        // If move to inter-sprint transition, increment sprint counter where appropriate
        const from = state.sceneId;
        const to = choice.next;

        // update sprint progression logic: when reaching interlude or sprint end increment sprint
        if(from === "sprint1_end" && to === "interlude"){ state.sprint = 2; }
        if(from === "sprint2_end" && to === "sprint3_planning"){ state.sprint = 3; }

        state.sceneId = to;

        // Special: if next is final_result, compute final narrative
        if(state.sceneId === "final_result"){
            computeFinalResult();
            return;
        }

        updateStatsUI();
        await render();
};
        dom.choices.appendChild(btn);
    });
} else {
    // no choices: might be final result or waiting
    if(state.sceneId === "final_result") {
      // final_result will be handled by computeFinalResult()
    } else {
        const p = document.createElement("p");
        p.style.color = "#9aa7a0";
        p.textContent = "Sem escolhas nesta cena.";
        dom.choices.appendChild(p);
    }
    }
    updateStatsUI();
}

// ---------- Finais (multiplicidade baseada em métricas) ----------
function computeFinalResult(){
    const s = state.stats;
  // scoring heuristics
  const score = s.codeQuality * 0.5 + s.moral * 0.2 + (100 - s.stress) * 0.15 + s.managerTrust * 0.15;

    let finalText = "";
    if(score >= 80){
    finalText = `Excelência técnica e humana!\nPontuação final: ${Math.round(score)}\nO produto foi lançado com alta qualidade. A equipe mantém moral elevada e você é reconhecido como um dev promissor.`;
    addLog("Final: Sucesso com qualidade — reconhecimento e oportunidades.");
    } else if(score >= 60){
    finalText = `Resultado sólido, com concessões.\nPontuação final: ${Math.round(score)}\nO produto foi entregue com alguns problemas menores. Sua carreira segue bem, mas há lições a aprender sobre equilíbrio e comunicação.`;
    addLog("Final: Entrega aceitável; aprendizado presente.");
    } else if(score >= 40){
    finalText = `Entrega problemática.\nPontuação final: ${Math.round(score)}\nHouve bugs pós-lançamento e desgaste na equipe. O time aprendeu, mas o gestor ficará atento. Reflita sobre escolhas de priorização e cuidado pessoal.`;
    addLog("Final: Problemas no lançamento; impacto na equipe.");
    } else {
    finalText = `Fracasso parcial — impacto sério.\nPontuação final: ${Math.round(score)}\nDívida técnica acumulada levou a uma falha crítica. A equipe está desmotivada e o gestor repensará estratégias. Use isso como impulso para melhorar práticas e empatia.`;
    addLog("Final: Falha crítica; necessidade de reconstrução.");
    }

  // show final message
    const finalSceneText = `=== RESULTADO FINAL ===\n${finalText}\n\n(Pressione 'Reiniciar' para jogar novamente.)`;
    typeText(dom.sceneText, finalSceneText, 5);
    dom.choices.innerHTML = "<p style='color:#9aa7a0'>Fim da simulação.</p>";
  saveState(); // autosave final
}

// ---------- Save/Load ----------
function saveState(){
    try{
    const payload = JSON.stringify(state);
    localStorage.setItem(SAVE_KEY, payload);
    addLog("Progresso salvo.");
    } catch(e){
    console.error(e);
    }
}

function loadState(){
    try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw) { addLog("Nenhum save encontrado."); return false; }
    state = JSON.parse(raw);
    updateStatsUI();
    addLog("Save carregado.");
    render();
    return true;
    } catch(e){
    console.error(e);
    return false;
    }
}

function resetState(){
    state = JSON.parse(JSON.stringify(initialState));
  // also clear event log
    document.getElementById("event-log").innerHTML = "";
    addLog("Estado reiniciado.");
    updateStatsUI();
    render();
    localStorage.removeItem(SAVE_KEY);
}

// ---------- Botões ----------
dom.saveBtn.onclick = saveState;
dom.loadBtn.onclick = () => loadState();
dom.resetBtn.onclick = () => {
    if(confirm("Deseja reiniciar a simulação? Todo progresso local será apagado.")) resetState();
};

// ---------- Inicialização ----------
(function init(){
  // expose state for debugging
    window.insideState = state;
    updateStatsUI();
    render();
    addLog("Simulação iniciada.");
})();
