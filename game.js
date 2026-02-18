
let safety = 100;
let score = 0;
let level = 1;
let activeRisk = null;
let riskTimer = null;

const risks = [
  {icon:"⚡", type:"control"},
  {icon:"🪜", type:"fix"},
  {icon:"🚗", type:"talk"},
  {icon:"🔥", type:"control"},
];

function spawnRisk(){
  if(activeRisk) return;

  const r = risks[Math.floor(Math.random()*risks.length)];
  const div = document.createElement("div");
  div.className="risk";
  div.innerText=r.icon;
  div.style.left=Math.random()*80+10+"%";
  div.style.top=Math.random()*60+20+"%";
  document.getElementById("field").appendChild(div);

  activeRisk = {element:div,type:r.type};

  riskTimer = setTimeout(()=>{
    damage();
  }, 2000 - (level*100));
}

function action(type){
  if(!activeRisk) return;

  if(type===activeRisk.type){
    score+=10;
    safety=Math.min(100,safety+2);
  }else{
    safety-=10;
  }

  clearTimeout(riskTimer);
  activeRisk.element.remove();
  activeRisk=null;

  updateHUD();
  checkLevel();
}

function damage(){
  safety-=15;
  activeRisk.element.remove();
  activeRisk=null;
  updateHUD();
}

function updateHUD(){
  document.getElementById("safety").innerText=safety;
  document.getElementById("score").innerText=score;
  document.getElementById("level").innerText=level;

  if(safety<=0){
    endGame(false);
  }
}

function checkLevel(){
  if(score>0 && score%100===0){
    level++;
  }
}

function endGame(success){
  clearInterval(gameLoop);
  document.getElementById("result").classList.remove("hidden");
  if(success){
    document.getElementById("result").innerHTML="🏆 무사고 완료! 안전을 지켰습니다!";
  }else{
    document.getElementById("result").innerHTML="🚨 사고 발생! 다시 도전하세요.";
  }
}

let gameLoop = setInterval(()=>{
  if(!activeRisk) spawnRisk();
}, 1000);
