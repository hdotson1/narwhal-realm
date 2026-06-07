// ── UNLOCK ────────────────────────────────────────────────────────────────────
function canEnterRealm(id){
  if(id==='hub'||id==='water')return true;
  if(id==='void'){
    if(voidUnlocked)return true;
    return hasAllFour() && sandDollars>=5;
  }
  const n=UNLOCK_CHAIN[id];return n?rescuedSet.has(n):true;
}

function hasAllFour(){
  return ['water','fire','earth','air'].every(e=>rescuedSet.has(e));
}

// ── COMPANION UI ──────────────────────────────────────────────────────────────
function updateCompanionUI(){
  NARWHAL_DEFS.forEach((n,i)=>{
    const bar=document.getElementById('cbar_'+n.id);
    const fill=document.getElementById('cbf_'+n.id);
    const slotHp=document.getElementById('slotHp'+(i+1));
    if(rescuedSet.has(n.id)){
      bar.classList.add('visible');
      const pct=Math.max(0,companionHp[n.id]/COMPANION_MAX_HP*100);
      fill.style.width=pct+'%';slotHp.style.width=pct+'%';
    } else {bar.classList.remove('visible');}
  });
}

function healAllCompanions(amount){
  rescuedSet.forEach(id=>{companionHp[id]=Math.min(COMPANION_MAX_HP,companionHp[id]+amount);});
  player.hp=Math.min(player.maxHp,player.hp+amount);
  updateHealthBar();updateCompanionUI();
}

// ── SELECTED ELEMENT ──────────────────────────────────────────────────────────
function setSelected(id){
  selectedElement=id;
  NARWHAL_DEFS.forEach((n,i)=>{
    const slot=document.getElementById('slot'+(i+1));
    n.id===id?slot.classList.add('active'):slot.classList.remove('active');
  });
  const lbl=document.getElementById('activeElemLabel');
  if(id){const def=NARWHAL_DEFS.find(n=>n.id===id);lbl.textContent=def?(def.element==='air'?'💨 Breeze — healing mode':def.emoji+' '+def.name+' active'):'';lbl.style.display='block';}
  else lbl.style.display='none';
}

// ── LUMA ENCOUNTER ────────────────────────────────────────────────────────────
function meetLuma(cn){
  cn.freed=true;
  rescuedSet.add('void');
  companionHp['void']=COMPANION_MAX_HP;
  blackHolePurchased=true;
  updateCompanionUI();
  spawnBurst(cn.x,cn.y,ELEM_COLORS['void'],24);
  state='fact'; // pause the game

  // Use the factPopup — fill it with Luma's dialogue
  document.getElementById('factNarwhal').textContent='🌑';
  document.getElementById('factTitle').textContent='Luma the Void Narwhal!';
  document.getElementById('factText').textContent=
    'You found me! Thank you for rescuing all of us — the narwhals will never forget this.\n\n' +
    "The Black Hole power is now yours. 🌑 Use it against the Evil Orca's Cybertruck and save the ocean!";
  document.getElementById('factNote').style.display='none';

  // Replace the single factBtn with two choices
  const factBtn=document.getElementById('factBtn');
  factBtn.style.display='none';

  // Remove any previous Luma buttons
  ['lumaGo','lumaNot'].forEach(id=>{const el=document.getElementById(id);if(el)el.remove();});

  const popup=document.getElementById('factPopup');

  const goBtn=document.createElement('button');
  goBtn.id='lumaGo';
  goBtn.textContent='🌊 Save the Ocean!';
  goBtn.style.cssText='background:linear-gradient(135deg,#8800ff,#440088);color:#fff;border:none;border-radius:8px;padding:10px 22px;font-family:"Fredoka One",cursive;font-size:16px;cursor:pointer;margin:6px;box-shadow:0 0 16px rgba(120,0,255,0.6);';
  goBtn.onclick=()=>{
    popup.classList.remove('show');
    factBtn.style.display='';
    goBtn.remove();notYetBtn.remove();
    lastTime=performance.now();
    setTimeout(()=>startBoss(),400);
  };

  const notYetBtn=document.createElement('button');
  notYetBtn.id='lumaNot';
  notYetBtn.textContent="I'm not ready yet";
  notYetBtn.style.cssText='background:rgba(30,30,50,0.9);color:#aaaacc;border:2px solid #446;border-radius:8px;padding:10px 22px;font-family:"Fredoka One",cursive;font-size:15px;cursor:pointer;margin:6px;';
  notYetBtn.onclick=()=>{
    popup.classList.remove('show');
    factBtn.style.display='';
    goBtn.remove();notYetBtn.remove();
    lastTime=performance.now();
    enterRealm('hub');
  };

  popup.appendChild(goBtn);
  popup.appendChild(notYetBtn);
  popup.classList.add('show');
  if(!selectedElement)setSelected('void');
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}

function showStatus(msg,dur=2){
  const el=document.getElementById('statusMsg');
  el.textContent=msg;el.style.display='block';
  clearTimeout(showStatus._t);
  showStatus._t=setTimeout(()=>{el.style.display='none';},dur*1000);
}

function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

// ── ORBIT POSITIONS ───────────────────────────────────────────────────────────
function getOrbitPos(idx,total){
  const a=(gameTime/1000)*1.1+idx*(Math.PI*2/total);
  return{x:player.x+Math.cos(a)*50,y:player.y+Math.sin(a)*50,angle:a+Math.PI/2};
}

// Boss-mode formation: narwhals in tight line alongside player at bottom
function getBossOrbitPos(idx,total){
  const spacing=52; // tight spacing between companions
  const totalWidth=spacing*(total-1);
  const startX=player.x-totalWidth/2;
  const x=startX+idx*spacing;
  const y=player.y+30; // trails just below player, moves with them
  return{x,y,angle:-Math.PI/2};
}

// ── ENEMIES ───────────────────────────────────────────────────────────────────
function spawnEnemies(bossMode=false){
  const count=2+Math.floor(Math.random()*2);
  for(let i=0;i<count;i++){
    const side=Math.floor(Math.random()*4);let x,y;
    if(side===0){x=Math.random()*W;y=-30;}
    else if(side===1){x=W+30;y=Math.random()*H;}
    else if(side===2){x=Math.random()*W;y=H+30;}
    else{x=-30;y=Math.random()*H;}
    const elem=bossMode?ALL_ELEMENTS[Math.floor(Math.random()*ALL_ELEMENTS.length)]:(REALM_ENEMY_ELEMENT[currentRealm]||'water');
    enemies.push({x,y,element:elem,hp:35,maxHp:35,r:18,speed:52+Math.random()*30,shootTimer:1200+Math.random()*1600,dmgFlash:0});
  }
}

// ── PROJECTILES ───────────────────────────────────────────────────────────────
function shootPlayer(fromX,fromY,toX,toY,elemDef,special=false){
  const dx=toX-fromX,dy=toY-fromY,d=Math.hypot(dx,dy)||1;
  const spd=350,dmg=special?elemDef.damage:Math.ceil(elemDef.damage*0.6);
  projectiles.push({x:fromX,y:fromY,vx:dx/d*spd,vy:dy/d*spd,
    color:elemDef.autoColor,r:special?(elemDef.element==='void'?20:10):7,dmg,life:1.6,
    element:elemDef.element,pullRadius:elemDef.element==='void'&&special?200:0});
}

// ── COIN PICKUPS ──────────────────────────────────────────────────────────────
function spawnCoin(x,y){
  coinPickups.push({x,y,bobT:Math.random()*Math.PI*2,life:12}); // despawn after 12s
}

function updateCoinPickups(dt){
  coinPickups=coinPickups.filter(c=>{
    c.bobT+=dt*3;
    c.life-=dt;
    if(dist(player,c)<player.r+14){
      sandDollars++;
      document.getElementById('sandDollars').textContent='🪙 '+sandDollars;
      // pop particle
      particles.push({type:'text',text:'+🪙',x:c.x,y:c.y-10,life:0.7,maxLife:0.7,color:'#ffee44'});
      return false;
    }
    return c.life>0;
  });
}

// ── PARTICLES ─────────────────────────────────────────────────────────────────
function spawnBurst(x,y,color,count=8){
  for(let i=0;i<count;i++){
    const a=(Math.PI*2*i/count)+Math.random()*0.5,sp=60+Math.random()*80;
    particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,color,life:0.5+Math.random()*0.4,maxLife:0.9,size:5+Math.random()*4});
  }
}

// ── BOSS MINIONS ─────────────────────────────────────────────────────────────
function spawnBossMinions(){
  const count=boss.phase>=2?3:2;
  for(let i=0;i<count;i++){
    const elem=ALL_ELEMENTS[Math.floor(Math.random()*ALL_ELEMENTS.length)];
    const x=40+Math.random()*(W-80);
    enemies.push({x,y:-25,element:elem,hp:25,maxHp:25,r:16,
      speed:90+Math.random()*60*(boss.phase>=2?1.5:1),
      shootTimer:800+Math.random()*800,dmgFlash:0,
      isBossMinion:true,
      vx:(Math.random()-0.5)*40}); // slight horizontal drift
  }
}

function updateBossMinion(e,dt){
  if(e.dmgFlash>0)e.dmgFlash-=dt;
  // Move downward with slight drift
  e.y+=e.speed*dt;
  e.x+=e.vx*dt;
  e.x=Math.max(e.r,Math.min(W-e.r,e.x));

  // Melee hit against player at bottom
  if(dist(player,e)<player.r+e.r+5&&player.invincible<=0){damagePlayer(12);player.invincible=0.8;}

  // Shoot downward at player occasionally
  e.shootTimer-=dt*1000;
  if(e.shootTimer<=0){
    e.shootTimer=700+Math.random()*700;
    const ba=Math.atan2(player.y-e.y,player.x-e.x);
    enemyProjectiles.push({x:e.x,y:e.y,vx:Math.cos(ba)*190,vy:Math.sin(ba)*190,
      color:ELEM_COLORS[e.element],element:e.element,r:7,dmg:9,life:4});
  }

  // Remove if gone past bottom
  if(e.y>H+30){e.hp=0;}
}

// ── DAMAGE / HEALTH ───────────────────────────────────────────────────────────
function damagePlayer(amt){
  if(player.invincible>0)return;
  player.hp=Math.max(0,player.hp-amt);player.dmgFlash=0.2;player.invincible=0.4;
  updateHealthBar();
  if(player.hp<=0){
    if(state==='boss'){
      // In boss fight: show trivia question instead of game over
      showBossLoseTrivia();
    } else {
      state='lose';document.getElementById('loseScreen').style.display='flex';
    }
  }
}
function updateHealthBar(){document.getElementById('healthFill').style.width=(player.hp/player.maxHp*100)+'%';}

// ── UPDATE HELPERS ────────────────────────────────────────────────────────────
function updateCooldownUI(dt){
  NARWHAL_DEFS.forEach((n,i)=>{
    if(abilityCooldowns[n.id]>0)abilityCooldowns[n.id]=Math.max(0,abilityCooldowns[n.id]-dt*1000);
    const slot=document.getElementById('slot'+(i+1));
    document.getElementById('cd'+(i+1)).style.height=(abilityCooldowns[n.id]/n.cooldown*100)+'%';
    if(rescuedSet.has(n.id)){slot.classList.remove('locked');}
    else{slot.classList.add('locked');slot.classList.remove('active');}
  });
}

function updateAutoFire(dt,bossMode){
  autoFireTimer-=dt*1000;
  if(autoFireTimer>0)return;
  autoFireTimer=325+Math.random()*100;

  const targets=bossMode?(boss.alive?[boss]:[]):enemies;
  if(targets.length===0)return;
  let nearest=targets[0],nearD=dist(player,targets[0]);
  targets.forEach(t=>{const td=dist(player,t);if(td<nearD){nearD=td;nearest=t;}});
  if(nearD>380)return;

  if(bossMode){
    // All narwhals fire at boss
    rescuedSet.forEach(id=>{
      const def=NARWHAL_DEFS.find(n=>n.id===id);
      if(!def||def.element==='air')return;
      shootPlayer(player.x,player.y,nearest.x,nearest.y,def,false);
    });
  } else {
    // Only selected narwhal fires
    if(!selectedElement||!rescuedSet.has(selectedElement))return;
    const def=NARWHAL_DEFS.find(n=>n.id===selectedElement);
    if(!def||def.element==='air')return;
    shootPlayer(player.x,player.y,nearest.x,nearest.y,def,false);
  }
}

function updateProjectiles(dt){
  projectiles=projectiles.filter(p=>{
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;
    if(p.pullRadius>0){
      const ts=state==='boss'?(boss.alive?[boss]:[]):enemies;
      ts.forEach(e=>{const pd=dist(p,e);if(pd<p.pullRadius){
        const pf=400*(1-pd/p.pullRadius),pa=Math.atan2(p.y-e.y,p.x-e.x);
        e.x+=Math.cos(pa)*pf*dt;e.y+=Math.sin(pa)*pf*dt;
      }});
    }
    return p.life>0&&p.x>-20&&p.x<W+20&&p.y>-20&&p.y<H+20;
  });
  enemyProjectiles=enemyProjectiles.filter(p=>{
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;
    if(p.homing>0){
      const speed=Math.hypot(p.vx,p.vy);
      const ta=Math.atan2(player.y-p.y,player.x-p.x);
      const blend=p.homing*dt*5;
      p.vx+=(Math.cos(ta)*speed-p.vx)*blend;
      p.vy+=(Math.sin(ta)*speed-p.vy)*blend;
      const ns=Math.hypot(p.vx,p.vy)||1;
      p.vx=p.vx/ns*speed;p.vy=p.vy/ns*speed;
    }
    return p.life>0&&p.x>-20&&p.x<W+20&&p.y>-20&&p.y<H+20;
  });
}

function checkEnemyProjHit(){
  enemyProjectiles=enemyProjectiles.filter(p=>{
    if(dist(player,p)<player.r+p.r){damagePlayer(p.dmg);spawnBurst(p.x,p.y,p.color,5);return false;}
    return true;
  });
}

function checkProjHitEnemies(){
  projectiles=projectiles.filter(proj=>{
    let hit=false;
    enemies=enemies.filter(e=>{
      if(hit)return true;
      if(dist(proj,e)<proj.r+e.r){
        const mult=proj.element===ELEM_WEAKNESSES[e.element]?2:1;
        e.hp-=proj.dmg*mult;e.dmgFlash=0.15;
        spawnBurst(proj.x,proj.y,proj.color,mult>1?10:5);
        if(mult>1)particles.push({type:'text',text:'WEAK! x2',x:e.x,y:e.y-20,life:0.8,maxLife:0.8,color:'#ffdd00'});
        if(e.hp<=0){
          if(Math.random()<0.75&&state!=='boss'){spawnCoin(e.x,e.y);}
          spawnBurst(e.x,e.y,ELEM_COLORS[e.element],14);
        }
        hit=true;return e.hp>0;
      }
      return true;
    });
    return !hit;
  });
}

function updateParticles(dt){
  particles=particles.filter(p=>{
    p.life-=dt;
    if(p.type==='text'||p.type==='coin')return p.life>0;
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=0.92;p.vy*=0.92;return p.life>0;
  });
}

function updateEnemy(e,dt){
  if(e.dmgFlash>0)e.dmgFlash-=dt;
  const edx=player.x-e.x,edy=player.y-e.y,ed=Math.hypot(edx,edy)||1;
  let avX=0,avY=0;
  obstacles.forEach(o=>{const od=dist(e,o);if(od<e.r+o.r+10){avX+=(e.x-o.x)/od;avY+=(e.y-o.y)/od;}});
  const avL=Math.hypot(avX,avY)||1;
  const mx=(edx/ed)*0.8+(avX/avL)*0.4,my=(edy/ed)*0.8+(avY/avL)*0.4,ml=Math.hypot(mx,my)||1;
  if(ed>65){e.x+=mx/ml*e.speed*dt;e.y+=my/ml*e.speed*dt;}
  // Per-realm damage multipliers
  const dmgMult={water:0.5,fire:1,earth:1.25,air:1.5}[e.element]||1;
  if(ed<player.r+e.r+5&&player.invincible<=0){damagePlayer(Math.round(10*dmgMult));player.invincible=0.8;}
  e.shootTimer-=dt*1000;
  if(e.shootTimer<=0){
    e.shootTimer=1400+Math.random()*1600;
    if(ed<340){
      const a2=Math.atan2(edy,edx);
      enemyProjectiles.push({x:e.x,y:e.y,vx:Math.cos(a2)*200,vy:Math.sin(a2)*200,
        color:ELEM_COLORS[e.element],element:e.element,r:7,dmg:Math.round(8*dmgMult),life:2.5});
    }
  }
}

// ── REALM / NARWHAL ───────────────────────────────────────────────────────────
function enterRealm(id){
  currentRealm=id;enemies=[];projectiles=[];enemyProjectiles=[];coinPickups=[];
  enemySpawnTimer=3;realmDmgTimer=2;state='playing';
  player.x=W/2;player.y=H-80;playerEntangled=0;playerBlown={vx:0,vy:0,t:0};
  obstacles=id==='hub'?[]:generateObstacles(id);
  document.getElementById('realmLabel').textContent=REALMS[id]?.name||'';
  const hint=document.getElementById('unlockHint');
  if(id!=='hub'){
    const cn=captiveNarwhals.find(n=>n.realm===id&&!n.freed);
    if(cn){hint.textContent='Find '+cn.emoji+' '+cn.name+' in the north!';hint.style.display='block';setTimeout(()=>hint.style.display='none',3500);}
    else{hint.style.display='none';}
  if(id==='void'){
      setTimeout(()=>showStatus('🌑 Find Luma the Void Narwhal!',3),500);
      // Reset Luma's chaotic movement
      lumaState.x=CAPTIVE_POSITIONS.void.x;lumaState.y=CAPTIVE_POSITIONS.void.y;
      lumaState.vx=40+Math.random()*30;lumaState.vy=-30-Math.random()*20;
      lumaState.spinAngle=0;lumaState.spinRate=4;lumaState.cryTimer=1;lumaState.cryText='';
    }
  } else {hint.style.display='none';}

  // Companion realm tips — fire after hint toast settles, first entry only
  if(id==='fire' &&rescuedSet.has('water')&&!realmTipsShown.has('fire'))
    setTimeout(()=>{if(state==='playing')showRealmTip('fire','💧','Squirt says:','Squirt here! 💧 Water is super effective against these fire enemies — I\'ve got this!');},400);
  else if(id==='earth'&&rescuedSet.has('fire') &&!realmTipsShown.has('earth'))
    setTimeout(()=>{if(state==='playing')showRealmTip('earth','🔥','Spark says:','Spark here! 🔥 Fire tears right through earth creatures — leave it to me!');},400);
  else if(id==='air'  &&rescuedSet.has('earth')&&!realmTipsShown.has('air'))
    setTimeout(()=>{if(state==='playing')showRealmTip('air','🍃','Root says:','Root here! 🍃 Earth energy grounds these air enemies perfectly — I\'ll handle them!');},400);
}

function freeNarwhal(cn){
  cn.freed=true;rescuedSet.add(cn.id);
  companionHp[cn.id]=COMPANION_MAX_HP;
  carryingNarwhal=cn.id;
  factResumeState='carrying';
  document.getElementById('factBtn').textContent='Awesome! Now bring them back safely! 🌊';
  state='fact'; // pauses game behind popup
  document.getElementById('factNarwhal').textContent=cn.emoji;
  document.getElementById('factTitle').textContent=cn.factTitle;
  let factBody=cn.fact;
  if(cn.element==='air')factBody+='\n\nAs your companion, Breeze will HEAL your whole team! Press [4] to activate her healing power.';
  document.getElementById('factText').textContent=factBody;
  document.getElementById('factNote').style.display='';
  document.getElementById('factPopup').classList.add('show');
  spawnBurst(cn.x,cn.y,ELEM_COLORS[cn.element],20);
  if(!selectedElement&&cn.element!=='air')setSelected(cn.id);
  updateCompanionUI();
}

function showRealmTip(realmId,emoji,title,msg){
  factResumeState='playing';
  realmTipsShown.add(realmId);
  const factBtn=document.getElementById('factBtn');
  factBtn.textContent='Got it';
  factBtn.style.display='';
  document.getElementById('factNarwhal').textContent=emoji;
  document.getElementById('factTitle').textContent=title;
  document.getElementById('factText').textContent=msg;
  document.getElementById('factNote').style.display='none';
  const popup=document.getElementById('factPopup');
  state='fact';
  popup.classList.add('show');
}

function showReadyPrompt(){
  state='fact'; // pause game
  const factBtn=document.getElementById('factBtn');
  factBtn.style.display='none';
  ['readyGo','readyNot'].forEach(id=>{const el=document.getElementById(id);if(el)el.remove();});

  document.getElementById('factNarwhal').textContent='🌑';
  document.getElementById('factTitle').textContent='Luma the Void Narwhal';
  document.getElementById('factText').textContent=
    'Are you ready to save the ocean and defeat the Evil Orca?';
  document.getElementById('factNote').style.display='none';

  const popup=document.getElementById('factPopup');

  const goBtn=document.createElement('button');
  goBtn.id='readyGo';
  goBtn.textContent='🌊 Save the Ocean!';
  goBtn.style.cssText='background:linear-gradient(135deg,#8800ff,#440088);color:#fff;border:none;border-radius:8px;padding:10px 22px;font-family:"Fredoka One",cursive;font-size:16px;cursor:pointer;margin:6px;box-shadow:0 0 16px rgba(120,0,255,0.6);';
  goBtn.onclick=()=>{
    popup.classList.remove('show');
    factBtn.style.display='';
    goBtn.remove();notYetBtn.remove();
    lastTime=performance.now();
    setTimeout(()=>startBoss(),400);
  };

  const notYetBtn=document.createElement('button');
  notYetBtn.id='readyNot';
  notYetBtn.textContent="I'm not ready yet";
  notYetBtn.style.cssText='background:rgba(30,30,50,0.9);color:#aaaacc;border:2px solid #446;border-radius:8px;padding:10px 22px;font-family:"Fredoka One",cursive;font-size:15px;cursor:pointer;margin:6px;';
  notYetBtn.onclick=()=>{
    popup.classList.remove('show');
    factBtn.style.display='';
    goBtn.remove();notYetBtn.remove();
    lastTime=performance.now();
    enterRealm('hub');
  };

  popup.appendChild(goBtn);
  popup.appendChild(notYetBtn);
  popup.classList.add('show');
}

// ── SHOP ──────────────────────────────────────────────────────────────────────
function openShop(){
  if(blackHolePurchased)return;
  shopStep=1;state='shop';
  const allFour=['water','fire','earth','air'].every(e=>rescuedSet.has(e));
  document.getElementById('shopNarwhal').textContent='⬛';
  document.getElementById('shopTitle').textContent='🌑 The Void Shopkeeper';
  document.getElementById('shopText').textContent=
    allFour
      ? 'HMPH. So you actually did it. Did you conquer all four realms and rescue your four companions?'
      : 'GET OUT OF HERE! You haven\'t even rescued all four companions yet! Come back when you\'ve conquered all four realms, you amateur!';
  document.getElementById('shopYes').style.display=allFour?'block':'none';
  document.getElementById('shopYes').onclick=()=>shopAnswer(true);
  document.getElementById('shopNo').style.display='block';
  document.getElementById('shopNo').textContent=allFour?'No, not yet':'OK OK I\'ll go...';
  document.getElementById('shopNo').onclick=()=>closeShop(true); // always back to hub
  document.getElementById('shopPopup').classList.add('show');
}

function shopAnswer(yes){
  // Only called for YES answers; No button always directly calls closeShop(true)
  if(shopStep===1){
    // They said yes to "did you conquer all four realms?"
    shopStep=2;
    const canAfford=sandDollars>=21;
    document.getElementById('shopText').textContent=
      canAfford
        ? `The Black Hole power is LEGENDARY. It costs 21 sand dollars. You have 🪙${sandDollars}. Do you wish to purchase?`
        : `HA! You need 21 sand dollars but you only have 🪙${sandDollars}. Go earn more and come back, broke narwhal!`;
    document.getElementById('shopYes').style.display=canAfford?'block':'none';
    document.getElementById('shopYes').onclick=()=>shopAnswer(true);
    document.getElementById('shopNo').textContent=canAfford?'No thanks':'Ugh, fine...';
    document.getElementById('shopNo').onclick=()=>closeShop(true); // still goes to hub
  } else if(shopStep===2){
    if(sandDollars>=21){
      sandDollars-=21;
      document.getElementById('sandDollars').textContent='🪙 '+sandDollars;
      blackHolePurchased=true;
      rescuedSet.add('void');
      companionHp['void']=COMPANION_MAX_HP;
      updateCompanionUI();
      document.getElementById('shopText').textContent='EXCELLENT. The Black Hole power is yours! Now go defeat the Evil Orca! 🌑';
      document.getElementById('shopYes').style.display='none';
      document.getElementById('shopNo').textContent='LET\'S GO! 🚗💥';
      document.getElementById('shopNo').onclick=()=>{
        closeShop(false);
        setTimeout(()=>startBoss(),600);
      };
    } else {
      closeShop(true); // somehow got here without funds — back to hub
    }
  }
}

function closeShop(sendToHub=false){
  shopStep=0;
  document.getElementById('shopPopup').classList.remove('show');
  lastTime=performance.now();
  if(sendToHub){
    enterRealm('hub'); // kicked back to hub
  } else {
    state='playing';
  }
}

// ── BOSS-LOSS TRIVIA ──────────────────────────────────────────────────────────
const BOSS_TRIVIA=[
  {q:'How deep can narwhals dive?',
   correct:'Over 5,000 feet — deeper than most submarines!',
   wrong:['About 1,000 feet','Around 500 feet','Up to 3,000 feet like a sea turtle']},
  {q:'What is a narwhal\'s spiral tusk actually made of?',
   correct:'An enlarged tooth',
   wrong:['A hollow horn filled with air','Fused cartilage from their nose','Compressed whale bone']},
  {q:'What are the nerve channels in a narwhal\'s tusk thought to detect?',
   correct:'Water temperature, pressure, and salinity',
   wrong:['The location of nearby fish','Changes in ocean currents','The earth\'s magnetic field']},
  {q:'How do narwhals breathe when Arctic waters freeze over?',
   correct:'Through cracks in the ice, sometimes shared with beluga whales',
   wrong:['They migrate south before ice forms','They slow breathing and hibernate underwater','They break thin ice with their tusks']},
  {q:'What are narwhals sometimes called because of their tusk?',
   correct:'The unicorns of the sea',
   wrong:['The swordfish of the Arctic','The ocean\'s knights','The tusked whales']},
];

function showBossLoseTrivia(){
  state='lose'; // pause boss updates
  // Pick a random question
  const q=BOSS_TRIVIA[Math.floor(Math.random()*BOSS_TRIVIA.length)];
  const screen=document.getElementById('bossLoseScreen');
  screen.style.display='flex';
  document.getElementById('bossLoseQ').textContent=q.q;
  document.getElementById('bossLoseFeedback').textContent='';

  // Shuffle options
  const opts=shuffle([q.correct,...q.wrong]);
  const container=document.getElementById('bossLoseOptions');
  container.innerHTML='';
  opts.forEach(opt=>{
    const btn=document.createElement('button');
    btn.textContent=opt;
    btn.style.cssText='background:rgba(40,0,80,0.8);color:#ddc8ff;border:2px solid #7700cc;border-radius:10px;padding:10px 16px;font-family:Nunito,sans-serif;font-size:13px;cursor:pointer;text-align:left;';
    btn.onmouseover=()=>btn.style.background='rgba(80,0,140,0.9)';
    btn.onmouseout=()=>btn.style.background='rgba(40,0,80,0.8)';
    btn.onclick=()=>{
      [...container.querySelectorAll('button')].forEach(b=>b.onclick=null);
      const fb=document.getElementById('bossLoseFeedback');
      if(opt===q.correct){
        fb.textContent='✅ Correct! Back into battle!';
        fb.style.color='#44ff88';
        setTimeout(()=>{
          screen.style.display='none';
          // Restore player and resume boss fight
          player.hp=player.maxHp;player.invincible=1;
          updateHealthBar();
          state='boss';
          lastTime=performance.now();
        },1200);
      } else {
        fb.textContent='❌ Wrong! The answer was: "'+q.correct+'" — Try another question!';
        fb.style.color='#ff6666';
        setTimeout(()=>showBossLoseTrivia(),2500);
      }
    };
    container.appendChild(btn);
  });
}

// ── BOSS ─────────────────────────────────────────────────────────────────────
function startBoss(){
  state='boss';currentRealm='boss';enemies=[];projectiles=[];enemyProjectiles=[];coinPickups=[];obstacles=[];
  blackHoleEffect=null;
  player.x=W/2;player.y=H-60;
  boss.x=W/2;boss.y=100;boss.hp=boss.maxHp;boss.alive=true;boss.phase=1;boss.speed=80;
  boss.velX=1.2;boss.velY=0;
  enemySpawnTimer=2;
  lastTime=performance.now();
  document.getElementById('realmLabel').textContent='Boss Arena';
  document.getElementById('bossHPWrap').style.display='flex';
  document.getElementById('sandDollars').style.display='none'; // no coins in final level
  showStatus('🚗 THE EVIL ORCA ARRIVES!',3);
}

// Boss-mode auto fire: all narwhals fire straight upward
let bossAutoFireTimer=0;
function updateBossAutoFire(dt){
  bossAutoFireTimer-=dt*1000;
  if(bossAutoFireTimer>0)return;
  bossAutoFireTimer=280+Math.random()*80; // fast upward fire
  rescuedSet.forEach(id=>{
    const def=NARWHAL_DEFS.find(n=>n.id===id);
    if(!def||def.element==='air')return;
    // Fire straight up from each orbiting companion position
    const rescArr=[...rescuedSet];
    const oi=rescArr.indexOf(id);
    const op=getBossOrbitPos(oi,rescArr.length);
    // shoot upward toward boss
    const dx=boss.x-op.x,dy=boss.y-op.y,d=Math.hypot(dx,dy)||1;
    projectiles.push({x:op.x,y:op.y,vx:dx/d*380,vy:dy/d*380,
      color:def.autoColor,r:7,dmg:Math.ceil(def.damage*0.5),life:1.5,
      element:def.element,pullRadius:0});
  });
}

function updateBoss(dt){
  if(!boss.alive)return;
  if(boss.hp<boss.maxHp*0.5&&boss.phase===1){
    boss.phase=2;boss.speed=130;
    showStatus('⚡ PHASE 2 — Cybertruck is furious!',2.5);
  }
  if(boss.hp<boss.maxHp*0.25&&boss.phase===2){
    boss.phase=3;boss.speed=180;
    showStatus('🔥 PHASE 3 — MAXIMUM OVERDRIVE!',2.5);
  }

  // Boss moves side-to-side at top, faster each phase
  boss.x+=boss.velX*boss.speed*dt;
  if(boss.x<boss.r+20)boss.velX=Math.abs(boss.velX);
  if(boss.x>W-boss.r-20)boss.velX=-Math.abs(boss.velX);
  boss.y=boss.phase>=3?140:boss.phase===2?120:100;

  if(boss.dmgFlash>0)boss.dmgFlash-=dt;

  // Bullet patterns — more patterns and faster each phase
  boss.shootTimer-=dt*1000;
  const fireRate=boss.phase>=3?220:boss.phase===2?350:600;
  if(boss.shootTimer<=0){
    boss.shootTimer=fireRate+Math.random()*150;
    const be=ALL_ELEMENTS[Math.floor(Math.random()*ALL_ELEMENTS.length)];
    const maxPattern=boss.phase>=3?4:boss.phase===2?3:2;
    const pattern=Math.floor(Math.random()*maxPattern);

    if(pattern===0){
      // Spread fan downward
      const spread=boss.phase>=3?9:boss.phase===2?7:5;
      for(let i=0;i<spread;i++){
        const a=(Math.PI/2)+(i-(spread-1)/2)*0.22;
        enemyProjectiles.push({x:boss.x,y:boss.y+boss.r,vx:Math.cos(a)*200,vy:Math.sin(a)*200,
          color:ELEM_COLORS[be],element:be,r:8,dmg:12,life:4});
      }
    } else if(pattern===1){
      // Aimed at player
      const ba=Math.atan2(player.y-boss.y,player.x-boss.x);
      const spread2=boss.phase>=3?5:boss.phase===2?3:1;
      for(let i=0;i<spread2;i++){
        const off=(i-(spread2-1)/2)*0.18;
        enemyProjectiles.push({x:boss.x,y:boss.y+boss.r,vx:Math.cos(ba+off)*280,vy:Math.sin(ba+off)*280,
          color:ELEM_COLORS[be],element:be,r:9,dmg:14,life:4,homing:BOSS_HOMING_FACTOR});
      }
    } else if(pattern===2){
      // Horizontal spray across full width
      const cols=boss.phase>=3?9:6;
      for(let i=0;i<cols;i++){
        const sx=60+i*(W-120)/(cols-1);
        enemyProjectiles.push({x:sx,y:boss.y+boss.r+20,vx:0,vy:230+Math.random()*60,
          color:ELEM_COLORS[be],element:be,r:8,dmg:11,life:4});
      }
    } else {
      // Phase 3 only: spiral burst from boss position
      const count=12;
      const spinOffset=gameTime/400;
      for(let i=0;i<count;i++){
        const a=(Math.PI*2/count)*i+spinOffset;
        enemyProjectiles.push({x:boss.x,y:boss.y,vx:Math.cos(a)*180,vy:Math.sin(a)*180,
          color:ELEM_COLORS[be],element:be,r:7,dmg:10,life:4});
      }
    }
  }

  // Minion spawning: enemies always enter from top, move downward
  // (handled by spawnEnemies(true) in update loop)

  // Check player projectile hits boss
  projectiles=projectiles.filter(proj=>{
    if(boss.alive&&dist(proj,boss)<boss.r+proj.r){
      boss.hp-=proj.dmg;boss.dmgFlash=0.12;
      spawnBurst(proj.x,proj.y,proj.color,6);
      document.getElementById('bossFill').style.width=Math.max(0,boss.hp/boss.maxHp*100)+'%';
      if(boss.hp<=0){
        boss.alive=false;spawnBurst(boss.x,boss.y,'#ff4400',40);
        setTimeout(()=>{state='win';document.getElementById('winScreen').style.display='flex';drawQR();
          },1800);
      }
      return false;
    }
    return true;
  });
}

// ── MAIN LOOP ─────────────────────────────────────────────────────────────────
function gameLoop(ts){
  const dt=Math.min((ts-lastTime)/1000,0.05);lastTime=ts;
  if(state==='playing'||state==='carrying'||state==='boss')update(dt);
  // fact, shop, quiz states intentionally skip update — game is paused behind the popup
  render();requestAnimationFrame(gameLoop);
}

function update(dt){
  gameTime+=dt*1000;

  // Wind bleed off
  if(playerBlown.t>0){playerBlown.t-=dt;playerBlown.vx*=0.88;playerBlown.vy*=0.88;}
  else{playerBlown.vx*=0.7;playerBlown.vy*=0.7;}
  if(playerEntangled>0)playerEntangled-=dt;

  // Movement
  let dx=0,dy=0;
  if(playerEntangled<=0){
    if(controlMode==='mouse'){
      // Steer toward cursor — move if cursor is more than 18px away
      const mdx=mouseX-player.x,mdy=mouseY-player.y;
      const md=Math.hypot(mdx,mdy);
      if(md>18){dx=mdx/md;dy=mdy/md;}
    } else {
      if(keys['ArrowLeft']||keys['a']||keys['A'])dx-=1;
      if(keys['ArrowRight']||keys['d']||keys['D'])dx+=1;
      if(keys['ArrowUp']||keys['w']||keys['W'])dy-=1;
      if(keys['ArrowDown']||keys['s']||keys['S'])dy+=1;
    }
  }
  const dl=Math.hypot(dx,dy)||1;
  if(dx||dy){player.x+=dx/dl*player.speed*dt;player.y+=dy/dl*player.speed*dt;}
  // Wind push
  player.x+=playerBlown.vx;player.y+=playerBlown.vy;
  player.x=Math.max(player.r,Math.min(W-player.r,player.x));
  player.y=Math.max(player.r,Math.min(H-player.r,player.y));
  applyObstacleEffects();

  player.angle=Math.atan2(mouseY-player.y,mouseX-player.x);
  if(player.invincible>0)player.invincible-=dt;
  if(player.dmgFlash>0)player.dmgFlash-=dt;

  if(state==='boss'){
    // Lock player to bottom third — full movement within that zone
    const bossZoneTop=H*2/3;
    player.y=Math.max(bossZoneTop+player.r,Math.min(H-player.r,player.y));
    player.x=Math.max(player.r,Math.min(W-player.r,player.x));
    player.angle=-Math.PI/2; // tusk always points up during boss fight

    updateBoss(dt);updateBossAutoFire(dt);
    if(blackHoleEffect)blackHoleEffect.dtRef=dt;
    updateProjectiles(dt);updateParticles(dt);updateCoinPickups(dt);
    updateCooldownUI(dt);checkEnemyProjHit();
    enemySpawnTimer-=dt;
    if(enemySpawnTimer<=0){
      enemySpawnTimer=1.8+Math.random()*(boss.phase>=2?1.2:2.0);
      spawnBossMinions();
    }
    checkProjHitEnemies();
    enemies.forEach(e=>updateBossMinion(e,dt));
    return;
  }

  // Realm damage for entering wrong realm
  if(currentRealm!=='hub'&&currentRealm!=='void'&&!canEnterRealm(currentRealm)){
    realmDmgTimer-=dt;
    if(realmDmgTimer<=0){realmDmgTimer=1.5;damagePlayer(8);spawnBurst(player.x,player.y,'#ff4444',5);}
  }

  // Enemy spawning in non-hub realms — per-realm spawn rate tuning
  if(currentRealm!=='hub'){
    enemySpawnTimer-=dt;
    if(enemySpawnTimer<=0){
      // base interval ~4-7s. water=2x slower, earth=1.5x faster, air=2x faster
      const baseMin={water:8,fire:4,earth:2.67,air:2,void:4}[currentRealm]||4;
      const baseMax={water:14,fire:7,earth:4.67,air:3.5,void:7}[currentRealm]||7;
      enemySpawnTimer=baseMin+Math.random()*(baseMax-baseMin);
      spawnEnemies();
    }
  }

  enemies.forEach(e=>updateEnemy(e,dt));

  // ── CARRYING STATE: escort rescued narwhal to exit ────────────────────────
  if(state==='carrying'){
    document.getElementById('carryHint').style.display='block';
    if(dist(player,HUB_PORTAL)<50){
      // safe! go back to hub
      document.getElementById('carryHint').style.display='none';
      carryingNarwhal=null;
      enterRealm('hub');
      return;
    }
  } else {
    document.getElementById('carryHint').style.display='none';
  }

  // Portal & interaction logic
  if(currentRealm==='hub'){
    PORTALS.forEach(p=>{
      const enterR=p.id==='void'?75:40;
      if(dist(player,p)<enterR){
        if(canEnterRealm(p.id)){
          if(p.id==='void'&&blackHolePurchased){
            // Luma already rescued — ask if ready for final boss
            showReadyPrompt();
          } else if(p.id==='void'&&!blackHolePurchased){
            sandDollars-=5;
            document.getElementById('sandDollars').textContent='🪙 '+sandDollars;
            voidUnlocked=true;
            showStatus('🌑 5🪙 paid! Now find Luma!',3);
            enterRealm(p.id);
          } else {
            enterRealm(p.id);
          }
        } else if(p.id==='void'&&hasAllFour()&&sandDollars<5){
          showStatus(`🪙 Need 5 sand dollars to enter! You have ${sandDollars}.`,3);
        }
      }
    });
  } else {
    // Check hub portal exit
    if(dist(player,HUB_PORTAL)<45&&state!=='carrying'){enterRealm('hub');return;}

    // Rescue captive narwhals — Luma gets a special dialogue instead of a fact card
    if(state==='playing'){
      captiveNarwhals.forEach(cn=>{
        if(!cn.freed&&cn.realm===currentRealm&&dist(player,cn)<40){
          if(cn.id==='void'){
            meetLuma(cn);
          } else {
            freeNarwhal(cn);
          }
        }
      });
    }
  }

  updateProjectiles(dt);updateParticles(dt);updateCoinPickups(dt);updateCooldownUI(dt);
  updateAutoFire(dt,false);updateVoidPhysics(dt);checkEnemyProjHit();checkProjHitEnemies();

  // Companion-enemy interactions
  const rescArr=[...rescuedSet];
  enemies.forEach(e=>{
    rescArr.forEach((id,oi)=>{
      const op=getOrbitPos(oi,rescArr.length);
      if(Math.hypot(e.x-op.x,e.y-op.y)<e.r+16&&e.dmgFlash<=0){
        companionHp[id]=Math.max(0,companionHp[id]-6);updateCompanionUI();e.dmgFlash=0.3;
      }
    });
  });
  enemyProjectiles.forEach(p=>{
    rescArr.forEach((id,oi)=>{
      const op=getOrbitPos(oi,rescArr.length);
      if(Math.hypot(p.x-op.x,p.y-op.y)<p.r+16){
        companionHp[id]=Math.max(0,companionHp[id]-4);updateCompanionUI();p.life=0;
      }
    });
  });
}
