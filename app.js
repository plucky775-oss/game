/* 배전 가공 현장 LIVE - App Logic (no deps) */
(() => {
  'use strict';

  // ---------- Utilities ----------
  const $ = (sel) => document.querySelector(sel);
  const clamp = (n, a=0, b=100) => Math.max(a, Math.min(b, n));
  const fmt = (n) => `${Math.round(n)}%`;
  const nowStr = () => new Date().toLocaleTimeString('ko-KR', {hour:'2-digit', minute:'2-digit'});
  const rand = () => Math.random();
  const pick = (arr) => arr[Math.floor(Math.random()*arr.length)];

  function safeLS(){
    try{
      const k="__t";
      localStorage.setItem(k,"1");
      localStorage.removeItem(k);
      return true;
    }catch(e){ return false; }
  }
  const HAS_LS = safeLS();

  function vibrate(ms){
    const chk = $('#chkVibe');
    if(!chk || !chk.checked) return;
    if(navigator.vibrate) navigator.vibrate(ms);
  }

  // WebAudio tiny beep
  const audio = {
    enabled: true,
    ctx: null,
    init(){
      if(this.ctx) return;
      try{ this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){}
    },
    beep(freq=440, dur=0.08, type='sine', vol=0.03){
      if(!this.enabled) return;
      this.init();
      if(!this.ctx) return;
      const ctx=this.ctx;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.value = vol;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + dur);
    },
    danger(){ this.beep(220, 0.12, 'sawtooth', 0.04); },
    warn(){ this.beep(330, 0.10, 'square', 0.03); },
    ok(){ this.beep(660, 0.06, 'sine', 0.03); },
  };

  // ---------- State ----------
  const state = {
    projectId: null,
    stepIdx: 0,
    day: 1,
    paused: false,
    timerOn: true,
    timerLeft: 0,
    timerHandle: null,
    timerChoiceIdx: null,

    // metrics
    hazard: 0,
    compliance: 0,
    progress: 0,
    complaint: 0,
    boss: 0,
    crew: 0,
    grid: 0,
    negligence: 0,

    // history
    fatalCount: 0,
    minorCount: 0,
    gridIncidents: 0,
    log: [],
    avgComplianceSum: 0,
    avgComplianceN: 0,
    peakComplaint: 0,

    // last computed
    fatalRiskPct: 0,
    lastChoice: null,
    lastStepRiskMult: 1.0,

    // run info
    ended: false,
    endReason: null,
    score: 0,
  };

  function resetStateFromProject(projectId){
    const p = GAME_DATA.projects[projectId];
    if(!p) throw new Error("unknown project");
    state.projectId = projectId;
    state.stepIdx = 0;
    state.day = 1;
    state.paused = false;
    state.ended = false;
    state.endReason = null;

    const init = p.init;
    state.hazard = init.hazard;
    state.compliance = init.compliance;
    state.progress = init.progress;
    state.complaint = init.complaint;
    state.boss = init.boss;
    state.crew = init.crew;
    state.grid = init.grid;
    state.negligence = init.negligence;

    state.fatalCount = 0;
    state.minorCount = 0;
    state.gridIncidents = 0;
    state.log = [];
    state.avgComplianceSum = 0;
    state.avgComplianceN = 0;
    state.peakComplaint = state.complaint;

    state.fatalRiskPct = 0;
    state.lastChoice = null;
    state.lastStepRiskMult = 1.0;

    stopTimer();
  }

  // ---------- UI ----------
  const screens = {
    start: $('#screenStart'),
    game: $('#screenGame'),
    result: $('#screenResult'),
  };
  function showScreen(name){
    Object.values(screens).forEach(s => s.classList.remove('screen--active'));
    screens[name].classList.add('screen--active');
    window.scrollTo({top:0, behavior:'smooth'});
  }

  function setGauge(elFill, elVal, value, invert=false){
    const v = clamp(value);
    elFill.style.width = v + '%';
    elVal.textContent = fmt(v);

    // color coding
    const t = invert ? (100 - v) : v;
    elFill.classList.remove('fill--ok','fill--warn','fill--danger','pulse-danger');
    if(t < 45){ elFill.classList.add('fill--ok'); }
    else if(t < 70){ elFill.classList.add('fill--warn'); }
    else { elFill.classList.add('fill--danger'); }
    if(t >= 85) elFill.classList.add('pulse-danger');
  }

  function shake(el){
    el.classList.remove('shake');
    // reflow
    void el.offsetWidth;
    el.classList.add('shake');
  }

  function addLog(msg, kind='info'){
    const feed = $('#feedList');
    const item = document.createElement('div');
    item.className = `log log--${kind}`;
    item.innerHTML = `<div class="log__t">${nowStr()}</div><div class="log__m">${escapeHtml(msg)}</div>`;
    feed.prepend(item);
    // keep max 25
    while(feed.children.length > 25) feed.removeChild(feed.lastChild);
  }

  function showBubbles(bubbles){
    const area = $('#bubbleArea');
    area.innerHTML = '';
    (bubbles||[]).forEach(b => {
      const div = document.createElement('div');
      const cls = b.type === 'complaint' ? 'bubble--complaint' :
                  b.type === 'boss' ? 'bubble--boss' :
                  b.type === 'crew' ? 'bubble--crew' : 'bubble--system';
      div.className = `bubble ${cls}`;
      div.innerHTML = `<div class="bubble__who">${escapeHtml(b.who)}</div><div class="bubble__msg">${escapeHtml(b.msg)}</div>`;
      area.appendChild(div);
    });
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  function renderChoices(choices){
    const area = $('#choicesArea');
    area.innerHTML = '';
    choices.forEach((c, idx) => {
      const btn = document.createElement('button');
      btn.className = 'choice';
      btn.innerHTML = `
        <div class="choice__text">${escapeHtml(c.text)}</div>
        <div class="choice__tagRow">
          ${(c.tags||[]).map(tag => {
            let tcls = 'tag';
            if(['안전우선','원칙','통제','차폐','절연점검','TBM','추락방지','신호수','계통확인','체크리스트','민원관리','인수인계','정리정돈','재발방지','동선확보','임시지지','2중확인','단계투입','확인절차','접지/방전','보류','교육','역할고정','통제강화','통제회복','펜스','교통통제'].some(k => tag.includes(k))) tcls += ' tag--safe';
            if(['시간단축','속도우선','통제축소','절충','부분정전','부분차폐','작업분할','분할','민원응대','부분보강','핵심만','핵심점검','재배치'].some(k => tag.includes(k))) tcls += ' tag--fast';
            if(['위험','강행','생략','무정전강행','차폐생략','서명만','서류만','종료강행','통제축소','인원축소'].some(k => tag.includes(k))) tcls += ' tag--risk';
            return `<span class="${tcls}">${escapeHtml(tag)}</span>`;
          }).join('')}
        </div>`;
      btn.addEventListener('click', () => choose(idx));
      area.appendChild(btn);
    });
  }

  function updateTop(){
    const p = GAME_DATA.projects[state.projectId];
    $('#projectTitle').textContent = p.title;
    $('#projectMeta').textContent = p.meta;
    $('#chipDay').textContent = `DAY ${state.day}`;
    $('#chipStep').textContent = `${state.stepIdx+1} / ${p.steps.length}`;
    $('#vNeg').textContent = `관리소홀 ${Math.round(state.negligence)}`;
    $('#vBest').textContent = getBestScoreLabel(state.projectId);

    // gauges
    setGauge($('#gHazard'), $('#vHazard'), state.hazard);
    setGauge($('#gCompliance'), $('#vCompliance'), state.compliance, true); // invert: 낮을수록 위험
    setGauge($('#gProgress'), $('#vProgress'), state.progress);
    setGauge($('#gComplaint'), $('#vComplaint'), state.complaint);
    setGauge($('#gBoss'), $('#vBoss'), state.boss);
    setGauge($('#gCrew'), $('#vCrew'), state.crew, true);
    setGauge($('#gGrid'), $('#vGrid'), state.grid, true);
    setGauge($('#gFatal'), $('#vFatal'), state.fatalRiskPct);
  }

  function renderStep(){
    const p = GAME_DATA.projects[state.projectId];
    const step = p.steps[state.stepIdx];

    $('#sceneTitle').textContent = step.title;
    $('#sceneDesc').textContent = step.desc;

    showBubbles(step.bubbles);
    renderChoices(step.choices);

    // timer logic
    if(step.timer && state.timerOn){
      startTimer(10, step);
    } else {
      stopTimer();
    }
  }

  // ---------- Risk model ----------
  function computeRiskPct(riskMult=1.0){
    // riskScore in 0..100
    const hazard = clamp(state.hazard);
    const compBad = clamp(100 - state.compliance);
    const complaint = clamp(state.complaint);
    const boss = clamp(state.boss);
    const crewBad = clamp(100 - state.crew);
    const gridBad = clamp(100 - state.grid);
    const neg = clamp(state.negligence);

    // Weighted (현장 체감: 통제가 무너지면 위험이 급상승)
    let riskScore =
      0.34*hazard +
      0.24*compBad +
      0.10*complaint +
      0.08*boss +
      0.12*crewBad +
      0.10*gridBad +
      0.02*neg;

    riskScore = clamp(riskScore, 0, 100);

    // Base fatal probability by 교육용 강화 테이블
    let base = 0.0;
    if(riskScore <= 50) base = 0.0;
    else if(riskScore <= 65) base = 0.05;
    else if(riskScore <= 75) base = 0.12;
    else if(riskScore <= 85) base = 0.25;
    else base = 0.40;

    // Additional: negligence makes it more likely once in fatal zone
    const negBoost = (neg/100) * 0.10; // up to +10% absolute
    let pFatal = (base + negBoost) * riskMult;

    // cap for gameplay
    pFatal = Math.min(0.70, Math.max(0, pFatal));
    return { riskScore, pFatal };
  }

  function computeMinorProb(riskScore){
    // Frequent, but not always
    const neg = clamp(state.negligence)/100;
    let pMinor = (riskScore/100)*0.42 + neg*0.18; // ~0..0.6
    pMinor = Math.min(0.65, Math.max(0.08, pMinor));
    return pMinor;
  }

  function computeGridProb(riskScore){
    // grid incident is more likely when stability is low and decisions were risky
    const gridBad = clamp(100 - state.grid)/100;
    let pGrid = (riskScore/100)*0.15 + gridBad*0.25; // up to ~0.4
    pGrid = Math.min(0.45, Math.max(0.02, pGrid));
    return pGrid;
  }

  function pickFatalType(){
    const types = [
      { t: "감전", msg: "인접 활선 근접/차폐 미흡 상태에서 감전 사고 발생." },
      { t: "추락", msg: "고소작업 중 추락. 추락방지/연결점 관리 미흡." },
      { t: "전도", msg: "고소차/장비 전도. 동선/회전반경/지반 관리 미흡." },
      { t: "낙하", msg: "자재/중량물 낙하로 인명피해. 통제/신호수/인양 점검 미흡." },
      { t: "아크/화상", msg: "투입/개폐 과정 아크로 중상. 절차/거리/보호구 미흡." },
    ];
    return pick(types);
  }

  function pickMinorType(){
    const types = [
      { t:"경미 감전", msg:"절연/차폐 미흡으로 경미 감전. 작업 중단 및 점검 필요." , prog:-6, hazard:+4, crew:-3, comp:-2, grid:-2 },
      { t:"타박상/베임", msg:"정리정돈 미흡으로 부상 발생. 공정 지연." , prog:-4, hazard:+3, crew:-2, comp:-1, grid:0 },
      { t:"장비 파손", msg:"장비 간섭/동선 미흡으로 장비 파손. 비용/지연 발생." , prog:-8, hazard:+3, crew:-2, comp:-2, grid:-1 },
      { t:"낙하(무피해)", msg:"자재 낙하(무피해). 통제 재정비 필요." , prog:-5, hazard:+4, crew:-2, comp:-2, grid:0 },
      { t:"작업 중단", msg:"작업자 불만으로 작업 중단. 통제력 저하." , prog:-6, hazard:+2, crew:-6, comp:-1, grid:0 },
    ];
    return pick(types);
  }

  function applyIncidentEffects(inc){
    state.progress = clamp(state.progress + (inc.prog||0));
    state.hazard = clamp(state.hazard + (inc.hazard||0));
    state.crew = clamp(state.crew + (inc.crew||0));
    state.compliance = clamp(state.compliance + (inc.comp||0));
    state.grid = clamp(state.grid + (inc.grid||0));
  }

  // ---------- Game flow ----------
  function choose(choiceIdx){
    if(state.paused || state.ended) return;
    stopTimer();

    const p = GAME_DATA.projects[state.projectId];
    const step = p.steps[state.stepIdx];
    const c = step.choices[choiceIdx];
    state.lastChoice = c;
    state.lastStepRiskMult = c.riskMult || 1.0;

    // Apply effects
    const e = c.effects || {};
    state.hazard = clamp(state.hazard + (e.hazard||0));
    state.compliance = clamp(state.compliance + (e.compliance||0));
    state.progress = clamp(state.progress + (e.progress||0));
    state.complaint = clamp(state.complaint + (e.complaint||0));
    state.boss = clamp(state.boss + (e.boss||0));
    state.crew = clamp(state.crew + (e.crew||0));
    state.grid = clamp(state.grid + (e.grid||0));
    state.negligence = clamp(state.negligence + (e.negligence||0), 0, 100);

    state.avgComplianceSum += state.compliance;
    state.avgComplianceN += 1;
    state.peakComplaint = Math.max(state.peakComplaint, state.complaint);

    addLog(`선택: ${c.text}`, 'info');
    audio.ok();

    // Recompute fatal risk display
    const { riskScore, pFatal } = computeRiskPct(state.lastStepRiskMult);
    state.fatalRiskPct = Math.round(pFatal*100);

    updateTop();
    shake($('#gFatal'));

    // Determine incidents
    const incident = rollIncidents(riskScore, pFatal, step);
    if(incident) {
      handleIncident(incident, riskScore, pFatal);
      if(state.ended){
        return;
      }
    } else {
      // If risk high but no incident: "운이 좋았다" message
      if(riskScore >= 82){
        addLog("이번엔 운이 좋았습니다. 동일 조건에서 실제 중대사고가 발생할 수 있습니다.", "warn");
        audio.warn();
        vibrate(40);
      } else {
        addLog("무사고 진행.", "ok");
      }
    }

    // Next step / finish
    state.stepIdx += 1;
    state.day += 1;

    // Completion condition: progress >= 100 or last step reached
    if(state.stepIdx >= p.steps.length || state.progress >= 100){
      endRun("complete");
      return;
    }
    renderStep();
  }

  function rollIncidents(riskScore, pFatal, step){
    // 1) Fatal
    if(pFatal > 0 && rand() < pFatal){
      return { kind: "fatal", detail: pickFatalType() };
    }

    // 2) Grid incident (not always injury, but critical)
    const pGrid = computeGridProb(riskScore);
    if(rand() < pGrid && state.grid < 60 && (step.title.includes("계통") || step.title.includes("투입") || state.grid < 50)){
      return { kind: "grid", detail: { t:"계통 사고", msg:"계통 불안정 상태에서 오동작/정전 확대 발생. 민원 폭증 및 조사 가능.", prog:-10, hazard:+2, crew:-2, comp:-2, grid:-15 } };
    }

    // 3) Minor
    const pMinor = computeMinorProb(riskScore);
    if(rand() < pMinor){
      return { kind: "minor", detail: pickMinorType() };
    }
    return null;
  }

  function handleIncident(incident, riskScore, pFatal){
    if(incident.kind === "fatal"){
      state.fatalCount += 1;
      audio.danger();
      vibrate(120);

      addLog(`🚨 중대재해 발생: ${incident.detail.t}`, "danger");
      addLog(`원인(요약): ${incident.detail.msg}`, "danger");
      addLog("조사/책임 리스크: 관리감독 의무 미이행 항목 검토, 작업중지 가능.", "danger");

      // immediate end on fatal
      endRun("fatal", { fatalType: incident.detail.t, riskScore, pFatal });
      return;
    }
    if(incident.kind === "grid"){
      state.gridIncidents += 1;
      audio.warn();
      vibrate(70);

      addLog(`⚡ ${incident.detail.t}: ${incident.detail.msg}`, "warn");
      applyIncidentEffects(incident.detail);

      // grid incident increases complaints and boss pressure
      state.complaint = clamp(state.complaint + 12);
      state.boss = clamp(state.boss + 8);
      state.negligence = clamp(state.negligence + 4);
      return;
    }
    if(incident.kind === "minor"){
      state.minorCount += 1;
      audio.warn();
      vibrate(60);
      addLog(`🟡 일반재해: ${incident.detail.t}`, "warn");
      addLog(incident.detail.msg, "warn");
      applyIncidentEffects(incident.detail);

      // general incident tends to increase pressure
      state.complaint = clamp(state.complaint + 6);
      state.boss = clamp(state.boss + 4);
      state.negligence = clamp(state.negligence + 3);
      return;
    }
  }

  function endRun(reason, extra={}){
    state.ended = true;
    state.endReason = reason;

    // Final score (simple but meaningful)
    const avgComp = state.avgComplianceN ? (state.avgComplianceSum/state.avgComplianceN) : state.compliance;
    const penalties = state.minorCount*12 + state.gridIncidents*18 + (100-avgComp)*0.4 + state.negligence*0.35;
    let score = Math.round(state.progress*1.2 + avgComp*0.8 + state.crew*0.4 + state.grid*0.3 - penalties);
    if(reason === "fatal") score -= 120;
    score = Math.max(0, score);
    state.score = score;

    // Save best
    saveBestScore(state.projectId, score);

    // Render result
    renderResult(extra);
    showScreen('result');
  }

  function gradeFrom(){
    if(state.endReason === "fatal") return { grade: "F", label:"🚫 중대재해" };
    const avgComp = state.avgComplianceN ? (state.avgComplianceSum/state.avgComplianceN) : state.compliance;
    if(state.progress >= 100 && state.minorCount === 0 && avgComp >= 75) return { grade:"S", label:"🏆 무사고·모범" };
    if(state.progress >= 100 && state.fatalCount === 0 && avgComp >= 65) return { grade:"A", label:"✅ 완료·양호" };
    if(state.progress >= 90) return { grade:"B", label:"⚠ 완료(개선 필요)" };
    return { grade:"C", label:"⏳ 미완(리스크 과다)" };
  }

  function renderResult(extra){
    const p = GAME_DATA.projects[state.projectId];
    const g = gradeFrom();

    $('#resultTitle').textContent = `${p.title} 결과`;
    $('#resultGrade').textContent = `${g.grade} · ${g.label}`;

    const avgComp = state.avgComplianceN ? (state.avgComplianceSum/state.avgComplianceN) : state.compliance;
    const summary = [];
    if(state.endReason === 'fatal'){
      summary.push(`🚨 <strong>중대재해</strong>가 발생하여 공사가 중단되었습니다.`);
      if(extra.fatalType) summary.push(`사고 유형: <strong>${escapeHtml(extra.fatalType)}</strong>`);
      summary.push(`이 선택 조합은 <strong>압박(민원/업체) + 통제 약화</strong>가 겹칠 때 가장 흔하게 터집니다.`);
    } else {
      summary.push(`✅ 공정을 <strong>${Math.round(state.progress)}%</strong>까지 진행했습니다.`);
      summary.push(`일반재해 ${state.minorCount}회, 계통 사고 ${state.gridIncidents}회.`);
      if(state.minorCount === 0 && state.gridIncidents === 0) summary.push(`무사고로 마무리했습니다.`);
    }
    summary.push(`평균 관리이행지수: <strong>${Math.round(avgComp)}%</strong> · 관리소홀 누적: <strong>${Math.round(state.negligence)}</strong>`);
    summary.push(`<span class="muted">팁:</span> 압박이 커질수록 <em>절차 생략</em> 유혹이 뜹니다. 통제(역할 고정/차폐/교통 통제)를 유지하세요.`);

    $('#resultSummary').innerHTML = `<p>${summary.join('<br/>')}</p>`;

    $('#rProgress').textContent = `${Math.round(state.progress)}%`;
    $('#rFatal').textContent = `${state.fatalCount}회`;
    $('#rMinor').textContent = `${state.minorCount}회`;
    $('#rComp').textContent = `${Math.round(avgComp)}%`;
    $('#rComplain').textContent = `${Math.round(state.peakComplaint)}%`;
    $('#rGrid').textContent = `${state.gridIncidents}회`;

    const note = [
      "앱에 붙이는 2가지 방법",
      "",
      "1) 새 페이지로 링크",
      "   - 이 폴더(kePCO_overhead_game)를 앱 폴더에 복사",
      "   - 메뉴 버튼에서 kePCO_overhead_game/index.html 로 이동",
      "",
      "2) SPA/웹뷰에서 iframe으로 임베드(가장 간단)",
      "   <iframe src=\"kePCO_overhead_game/index.html\" style=\"width:100%;height:100vh;border:0;\"></iframe>",
      "",
      "자동 시작(공사 유형 바로 지정)도 가능:",
      "   kePCO_overhead_game/index.html?type=overhead_new",
      "   kePCO_overhead_game/index.html?type=overhead_replace_tr",
      "",
      `버전: ${GAME_DATA.meta.version}`
    ].join("\n");

    $('#integrationNote').textContent = note;
  }

  // ---------- Timer ----------
  function startTimer(seconds, step){
    stopTimer();
    state.timerLeft = seconds;
    $('#timerWrap').classList.remove('hidden');
    $('#timerVal').textContent = String(state.timerLeft);
    audio.warn();

    state.timerHandle = setInterval(() => {
      if(state.paused || state.ended) return;
      state.timerLeft -= 1;
      $('#timerVal').textContent = String(state.timerLeft);
      if(state.timerLeft <= 3){
        vibrate(20);
        audio.beep(440, 0.05, 'square', 0.02);
        $('#timerWrap').classList.add('pulse-danger');
      }
      if(state.timerLeft <= 0){
        stopTimer();
        // Auto pick the "middle" choice as a compromise (or last if only 2)
        const idx = step.choices.length >= 3 ? 1 : step.choices.length - 1;
        addLog("⏱ 시간 초과: 자동 선택(현장 타협) 적용", "warn");
        choose(idx);
      }
    }, 1000);
  }

  function stopTimer(){
    if(state.timerHandle){
      clearInterval(state.timerHandle);
      state.timerHandle = null;
    }
    $('#timerWrap').classList.add('hidden');
    $('#timerWrap').classList.remove('pulse-danger');
  }

  // ---------- Pause/Restart ----------
  function togglePause(){
    state.paused = !state.paused;
    $('#btnPause').textContent = state.paused ? '▶' : '⏸';
    addLog(state.paused ? "⏸ 일시정지" : "▶ 재개", "info");
  }

  function restart(){
    if(!state.projectId) return;
    resetStateFromProject(state.projectId);
    showScreen('game');
    addLog("↻ 재시작", "info");
    audio.ok();
    state.timerOn = $('#chkTimer').checked;
    // initial fatal risk
    const { pFatal } = computeRiskPct(1.0);
    state.fatalRiskPct = Math.round(pFatal*100);
    updateTop();
    renderStep();
  }

  // ---------- Best score ----------
  function bestKey(projectId){ return `kePCO_overhead_best_${projectId}`; }
  function getBestScore(projectId){
    if(!HAS_LS) return null;
    const v = localStorage.getItem(bestKey(projectId));
    if(v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  function saveBestScore(projectId, score){
    if(!HAS_LS) return;
    const best = getBestScore(projectId);
    if(best == null || score > best) localStorage.setItem(bestKey(projectId), String(score));
  }
  function getBestScoreLabel(projectId){
    const b = getBestScore(projectId);
    return b == null ? "기록 없음" : `${b}점`;
  }

  // ---------- URL auto start ----------
  function getParam(name){
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  }

  function startProject(projectId){
    const p = GAME_DATA.projects[projectId];
    if(!p){
      alert("알 수 없는 공사 유형입니다.");
      return;
    }
    state.timerOn = $('#chkTimer') ? $('#chkTimer').checked : true;

    resetStateFromProject(projectId);
    showScreen('game');

    addLog(`시작: ${p.title}`, 'info');
    addLog("압박(민원/업체/작업자/돌발)이 올라갈수록 ‘타협 선택지’가 더 위험해집니다.", "info");

    const { pFatal } = computeRiskPct(1.0);
    state.fatalRiskPct = Math.round(pFatal*100);

    updateTop();
    renderStep();
  }

  // ---------- Help modal ----------
  function openHelp(){
    const body = [
      "<ul>",
      "<li><strong>현장위험도</strong>: 작업 자체의 위험(근접·고소·인양·차폐 등). 높을수록 위험.</li>",
      "<li><strong>관리이행지수</strong>: TBM/차폐/통제/절차 준수. 낮아지면 위험이 급증합니다.</li>",
      "<li><strong>민원압박</strong>: 정전/통제/소음 등으로 올라갑니다. 높으면 ‘절차 단축’ 유혹이 강해집니다.</li>",
      "<li><strong>업체압박</strong>: 사장 독촉/비용 압박. 높으면 통제가 흔들립니다.</li>",
      "<li><strong>작업통제력</strong>: 작업자 협조/역할 고정/지시 이행. 낮으면 돌발 불이행이 자주 터집니다.</li>",
      "<li><strong>계통안정성</strong>: 투입/절체/경보 대응. 낮으면 계통 사고(정전 확대) 확률이 커집니다.</li>",
      "<li><strong>중대재해위험</strong>: 누적 리스크 기반 확률(교육용 강화). <em>랜덤</em>이지만 선택이 확률을 바꿉니다.</li>",
      "</ul>",
      "<p class='muted'>통합 팁: 앱 메뉴에서 <code>kePCO_overhead_game/index.html</code>로 링크하거나 iframe으로 임베드하세요.</p>"
    ].join("");
    $('#modalBody').innerHTML = body;
    $('#modal').classList.remove('hidden');
  }
  function closeHelp(){ $('#modal').classList.add('hidden'); }

  // ---------- Wiring ----------
  function wire(){
    // start buttons
    document.querySelectorAll('[data-start]').forEach(btn => {
      btn.addEventListener('click', () => startProject(btn.getAttribute('data-start')));
    });

    $('#btnHelp').addEventListener('click', openHelp);
    $('#btnModalClose').addEventListener('click', closeHelp);
    $('#modal').addEventListener('click', (e) => { if(e.target.id === 'modal') closeHelp(); });

    $('#btnPause').addEventListener('click', togglePause);
    $('#btnRestart').addEventListener('click', restart);

    $('#btnBackHome').addEventListener('click', () => {
      stopTimer();
      showScreen('start');
    });
    $('#btnPlayAgain').addEventListener('click', () => {
      showScreen('start');
    });

    $('#btnCopy').addEventListener('click', async () => {
      const p = GAME_DATA.projects[state.projectId];
      const avgComp = state.avgComplianceN ? (state.avgComplianceSum/state.avgComplianceN) : state.compliance;
      const text = [
        `배전 가공 현장 LIVE 결과`,
        `공사: ${p ? p.title : '-'}`,
        `점수: ${state.score}`,
        `공정률: ${Math.round(state.progress)}%`,
        `중대재해: ${state.fatalCount}회`,
        `일반재해: ${state.minorCount}회`,
        `계통 사고: ${state.gridIncidents}회`,
        `평균 관리이행: ${Math.round(avgComp)}%`,
        `민원 최고: ${Math.round(state.peakComplaint)}%`,
        `관리소홀: ${Math.round(state.negligence)}`
      ].join("\n");

      try{
        await navigator.clipboard.writeText(text);
        addLog("결과를 클립보드에 복사했습니다.", "ok");
        audio.ok();
      }catch(e){
        addLog("복사 실패(브라우저 권한).", "warn");
        audio.warn();
      }
    });

    // sound toggle
    $('#btnSound').addEventListener('click', () => {
      audio.enabled = !audio.enabled;
      $('#btnSound').textContent = audio.enabled ? "🔊" : "🔇";
      $('#btnSound').setAttribute('aria-pressed', audio.enabled ? 'true' : 'false');
      if(audio.enabled) audio.ok();
    });

    // Auto start via URL param
    const type = getParam('type');
    if(type && GAME_DATA.projects[type]){
      // Ensure toggles exist (start screen still mounted)
      showScreen('start');
      setTimeout(() => startProject(type), 100);
    }
  }

  // init
  wire();
})();
