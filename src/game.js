const canvas=document.getElementById('c'),ctx=canvas.getContext('2d'),W=800,H=600;

// ── ART ASSETS ────────────────────────────────────────────────────────────────
// Display dimensions in canvas pixels (independent of source PNG resolution)
const NARWHAL_SIZE=80;  // square bounding box at scale=1; companions drawn at 0.55×
const ENEMY_SIZE=48;    // square
const BOSS_W=140,BOSS_H=100;

const IMAGES={};
let _imgsTotal=0,_imgsLoaded=0,_onImgsReady=null;
function _imgDone(){if(++_imgsLoaded===_imgsTotal&&_onImgsReady)_onImgsReady();}
['narwhal-player','narwhal-water','narwhal-fire','narwhal-earth','narwhal-air','narwhal-void',
 'enemy-water','enemy-fire','enemy-earth','enemy-air','enemy-void','cybertruck-boss',
].forEach(k=>{_imgsTotal++;const i=new Image();i.onload=i.onerror=_imgDone;i.src='assets/'+k+'.png';IMAGES[k]=i;});
['hub','water','fire','earth','air','void','boss'].forEach(k=>{_imgsTotal++;const i=new Image();i.onload=i.onerror=_imgDone;i.src='assets/bg-'+k+'.svg';IMAGES['bg-'+k]=i;});

// ── STATE ─────────────────────────────────────────────────────────────────────
let state='title';
let controlMode='wasd'; // 'wasd' or 'mouse' // title|playing|carrying|shop|boss|win|lose|fact
let keys={},mouseX=W/2,mouseY=H/2,sandDollars=0,gameTime=0,lastTime=0;
let shopStep=0; // 0=not open, 1=question1, 2=question2
let blackHolePurchased=false;
let bossTriggered=false;

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
    'The Black Hole power is now yours. 🌑 Use it against the Evil Cybertruck and save the ocean!';

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

// ── UNLOCK ────────────────────────────────────────────────────────────────────
const UNLOCK_CHAIN={water:null,fire:'water',earth:'fire',air:'earth'};
let voidUnlocked=false; // stays true permanently after first purchase
function canEnterRealm(id){
  if(id==='hub'||id==='water')return true;
  if(id==='void'){
    if(voidUnlocked)return true;
    return hasAllFour() && sandDollars>=5;
  }
  const n=UNLOCK_CHAIN[id];return n?rescuedSet.has(n):true;
}

// Separate check: do they have all 4 narwhals (regardless of sand dollars)?
function hasAllFour(){
  return ['water','fire','earth','air'].every(e=>rescuedSet.has(e));
}

// ── REALMS ────────────────────────────────────────────────────────────────────
const REALMS={
  hub:  {name:'Hub Realm',   bg:['#003366','#001833'],accent:'#00aaff'},
  water:{name:'Water Realm', bg:['#001428','#000a18'],accent:'#00aaff'},
  fire: {name:'Fire Realm',  bg:['#220800','#110300'],accent:'#ff5500'},
  earth:{name:'Earth Realm', bg:['#071400','#030a00'],accent:'#44bb00'},
  air:  {name:'Air Realm',   bg:['#0a0a22','#060614'],accent:'#88aaff'},
  void: {name:'Void Realm',  bg:['#0e000e','#060006'],accent:'#aa00ff'},
  boss: {name:'Boss Arena',  bg:['#120004','#080002'],accent:'#ff0044'},
};
let currentRealm='hub';

// ── NARWHAL DEFS ──────────────────────────────────────────────────────────────
const NARWHAL_DEFS=[
  {id:'water',idx:0,emoji:'💧',name:'Squirt',element:'water',realm:'water',
   color:'#0088ff',damage:10,cooldown:1000,autoColor:'#00bbff',
   fact:'Narwhals live in Arctic waters and can dive over 5,000 feet deep — deeper than most submarines!',
   factTitle:'💧 Squirt the Water Narwhal!'},
  {id:'fire', idx:1,emoji:'🔥',name:'Spark', element:'fire', realm:'fire',
   color:'#ff5511',damage:12,cooldown:1200,autoColor:'#ff6600',
   fact:'Narwhals are called the "unicorns of the sea"! Their spiral tusk is actually a tooth that can grow up to 10 feet long.',
   factTitle:'🔥 Spark the Fire Narwhal!'},
  {id:'earth',idx:2,emoji:'🍃',name:'Root',  element:'earth',realm:'earth',
   color:'#44aa00',damage:11,cooldown:1100,autoColor:'#66cc22',
   fact:'A narwhal\'s tusk has millions of tiny nerve channels that may sense water temperature, pressure, and salinity!',
   factTitle:'🍃 Root the Earth Narwhal!'},
  {id:'air',  idx:3,emoji:'💨',name:'Breeze',element:'air',  realm:'air',
   color:'#88aaff',damage:0, cooldown:3500,autoColor:'#aaccff',
   fact:'Narwhals are mammals! They use cracks in Arctic ice as breathing holes, sometimes sharing them with beluga whales.',
   factTitle:'💨 Breeze the Air Narwhal!'},
  {id:'void', idx:4,emoji:'🌑',name:'Luma',  element:'void', realm:'void',
   color:'#8800ff',damage:60,cooldown:10000,autoColor:'#aa22ff',
   fact:'There are only about 123,000 narwhals left in the world. Climate change is melting their Arctic home!',
   factTitle:'🌑 Luma the Void Narwhal!'},
];

// ── COMPANION HP ──────────────────────────────────────────────────────────────
const COMPANION_MAX_HP=60;
let companionHp={};
NARWHAL_DEFS.forEach(n=>{companionHp[n.id]=COMPANION_MAX_HP;});

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
let selectedElement=null;
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

// ── PLAYER ────────────────────────────────────────────────────────────────────
const PLAYER_COLOR='#c9a0ff';
const player={x:W/2,y:H/2,speed:180,hp:100,maxHp:100,r:22,angle:0,invincible:0,dmgFlash:0};

// Status effects
let playerEntangled=0;    // seconds remaining
let playerBlown={vx:0,vy:0,t:0};  // wind push

let rescuedSet=new Set();
let carryingNarwhal=null; // narwhal id being carried back to exit
let abilityCooldowns={};
let autoFireTimer=0;
NARWHAL_DEFS.forEach(n=>{abilityCooldowns[n.id]=0;});

// ── PORTALS ───────────────────────────────────────────────────────────────────
const PORTALS=[
  {id:'water',x:680,y:130,emoji:'💧'},
  {id:'fire', x:680,y:320,emoji:'🔥'},
  {id:'earth',x:120,y:320,emoji:'🍃'},
  {id:'air',  x:120,y:130,emoji:'💨'},
  {id:'void', x:W/2,y:H/2,emoji:'🌑'}, // center — large and menacing
];
const HUB_PORTAL={id:'hub',x:60,y:H-60,emoji:'🏠'};

// ── VOID SHOPKEEPER ───────────────────────────────────────────────────────────
const SHOPKEEPER={x:400,y:H-100}; // near the bottom of void realm (entry area)

// ── CAPTIVE NARWHALS ──────────────────────────────────────────────────────────
const CAPTIVE_POSITIONS={
  water:{x:130,y:90},fire:{x:670,y:90},
  earth:{x:100,y:110},air:{x:700,y:100},void:{x:400,y:100},
};
let captiveNarwhals=NARWHAL_DEFS.map(n=>({
  ...n,x:CAPTIVE_POSITIONS[n.id].x,y:CAPTIVE_POSITIONS[n.id].y,
  freed:false,bobT:Math.random()*Math.PI*2,
}));

// ── OBSTACLES ─────────────────────────────────────────────────────────────────
let obstacles=[];

const OBSTACLE_THEMES={
  water:{count:15,
    shapes:()=>{const r=(10+Math.random()*Math.random()*50)*1.3;return{r,shapeType:'bubble',color:'rgba(100,200,255,0.15)',borderColor:'rgba(180,230,255,0.7)'};}},
  fire:{count:13,
    shapes:()=>{
      const r=(10+Math.random()*Math.random()*55)*1.3;
      const rx=r*(0.8+Math.random()*1.0),ry=r*(0.5+Math.random()*0.9);
      return{r:Math.max(rx,ry),rx,ry,shapeType:'lavapool',color:'#330800',borderColor:'#ff3300',burns:true};
    }},
  earth:{count:15,
    shapes:()=>{const r=(12+Math.random()*Math.random()*44)*1.3;return{r,shapeType:'tree',color:'#1a3300',borderColor:'#336600',tangles:true};}},
  air:{count:11,
    shapes:()=>{const r=(14+Math.random()*Math.random()*40)*1.3;return{r,shapeType:'cloud',color:'rgba(20,20,60,0.5)',borderColor:'#5577cc',blows:true};}},
  void:{count:30,
    shapes:()=>{
      const r=(10+Math.random()*Math.random()*80)*1.3;
      const spikes=4+Math.floor(Math.random()*6);
      const speed=(60+Math.random()*100)/Math.sqrt(r/20);
      const angle=Math.random()*Math.PI*2;
      return{r,spikes,shapeType:'rift',color:'#1a0022',borderColor:'#7700aa',
        vx:Math.cos(angle)*speed, vy:Math.sin(angle)*speed,
        spinRate:(Math.random()-0.5)*5*(20/r), blows:true}; // bigger = slower spin
    }},
};

function generateObstacles(realmId){
  const theme=OBSTACLE_THEMES[realmId];if(!theme)return[];
  const obs=[];
  const cn=captiveNarwhals.find(n=>n.realm===realmId);
  for(let attempt=0;attempt<theme.count*12&&obs.length<theme.count;attempt++){
    const x=65+Math.random()*(W-130),y=85+Math.random()*(H-200);
    if(Math.hypot(x-W/2,y-(H-80))<110)continue;
    if(cn&&Math.hypot(x-cn.x,y-cn.y)<85)continue;
    if(Math.hypot(x-HUB_PORTAL.x,y-HUB_PORTAL.y)<70)continue;
    // keep shopkeeper clear in void
    if(realmId==='void'&&Math.hypot(x-SHOPKEEPER.x,y-SHOPKEEPER.y)<80)continue;
    const shape=theme.shapes();
    const clearR = realmId==='void' ? shape.r*2.5 : shape.r*5.0;
    if(obs.some(o=>Math.hypot(x-o.x,y-o.y)<clearR))continue;
    obs.push({x,y,rotation:Math.random()*Math.PI*2,...shape});
  }
  return obs;
}

function drawObstacle(o){
  ctx.save();
  ctx.translate(o.x,o.y);
  ctx.rotate(o.rotation+Math.sin(gameTime/1200)*0.06);
  const pulse=Math.sin(gameTime/800)*0.08+0.92;

  if(o.shapeType==='bubble'){
    // Transparent iridescent bubble
    const r=o.r*pulse;
    const g=ctx.createRadialGradient(-r*0.3,-r*0.3,r*0.05,0,0,r);
    g.addColorStop(0,'rgba(220,240,255,0.35)');
    g.addColorStop(0.7,'rgba(100,200,255,0.08)');
    g.addColorStop(1,'rgba(180,220,255,0.18)');
    ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);
    ctx.fillStyle=g;ctx.fill();
    ctx.strokeStyle=o.borderColor;ctx.lineWidth=1.5;ctx.stroke();
    // shine glint
    ctx.beginPath();ctx.arc(-r*0.3,-r*0.32,r*0.18,0,Math.PI*2);
    ctx.fillStyle='rgba(255,255,255,0.45)';ctx.fill();

  } else if(o.shapeType==='lavapool'){
    const flicker=Math.sin(gameTime/90+o.rotation*7)*0.5+0.5;
    const heat=Math.sin(gameTime/200+o.rotation*3)*0.3+0.7;
    // Flat pool base — wide squashed ellipse
    ctx.beginPath();ctx.ellipse(0,0,o.rx*pulse,o.ry*pulse*0.55,0,0,Math.PI*2);
    const lg=ctx.createRadialGradient(0,0,o.rx*0.1,0,0,o.rx*pulse);
    lg.addColorStop(0,`rgba(255,${100+flicker*80|0},0,0.95)`); // bright orange core
    lg.addColorStop(0.5,`rgba(200,${30+flicker*40|0},0,0.85)`);
    lg.addColorStop(1,'rgba(60,0,0,0.9)');
    ctx.fillStyle=lg;ctx.fill();
    // Glowing crust ring
    ctx.strokeStyle=`rgba(255,${60+flicker*120|0},0,0.7)`;ctx.lineWidth=2+flicker*2;ctx.stroke();
    // Bubbles rising from pool
    for(let i=0;i<3;i++){
      const bPhase=(gameTime/600+i*1.4+o.rotation)%1;
      const bx=(i-1)*o.rx*0.4;
      const by=o.ry*0.3-bPhase*o.ry*1.4;
      const br=2+flicker*2;
      if(bPhase<0.9){
        ctx.beginPath();ctx.arc(bx,by*0.55,br,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,${150+flicker*80|0},0,${(1-bPhase)*0.8})`;ctx.fill();
      }
    }
    // Heat shimmer glow above
    const hg=ctx.createRadialGradient(0,-o.ry*0.5,0,0,-o.ry*0.5,o.rx*0.8);
    hg.addColorStop(0,`rgba(255,80,0,${heat*0.15})`);
    hg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.beginPath();ctx.ellipse(0,-o.ry*0.4,o.rx*0.8,o.ry*0.6,0,0,Math.PI*2);
    ctx.fillStyle=hg;ctx.fill();

  } else if(o.shapeType==='tree'){
    const h=o.r*2.2,w=o.r*1.5;
    // canopy layers
    [[0,-h*0.5,-w*0.5,h*0.3,w*0.5,h*0.3],[0,-h*0.2,-w*0.42,h*0.52,w*0.42,h*0.52]].forEach(pts=>{
      ctx.beginPath();ctx.moveTo(pts[0],pts[1]);ctx.lineTo(pts[2],pts[3]);ctx.lineTo(pts[4],pts[5]);ctx.closePath();
      ctx.fillStyle=o.color;ctx.fill();ctx.strokeStyle=o.borderColor;ctx.lineWidth=2;ctx.stroke();
    });
    ctx.fillStyle='#5c3300';ctx.fillRect(-5,h*0.3,10,h*0.25);
    // vine tentacles
    for(let i=0;i<3;i++){
      const vx=Math.cos(gameTime/600+i*2)*8;
      ctx.beginPath();ctx.moveTo(0,h*0.3+5);
      ctx.quadraticCurveTo(vx+(i-1)*12,h*0.5+15,(i-1)*20,h*0.55+20);
      ctx.strokeStyle='rgba(50,150,0,0.7)';ctx.lineWidth=2.5;ctx.stroke();
    }

  } else if(o.shapeType==='cloud'){
    const blobs=[{x:0,y:0,r:o.r},{x:-o.r*0.55,y:o.r*0.2,r:o.r*0.7},{x:o.r*0.55,y:o.r*0.2,r:o.r*0.65},{x:-o.r*0.28,y:-o.r*0.4,r:o.r*0.6},{x:o.r*0.28,y:-o.r*0.35,r:o.r*0.55}];
    blobs.forEach(b=>{ctx.beginPath();ctx.arc(b.x,b.y,b.r*pulse,0,Math.PI*2);ctx.fillStyle=o.color;ctx.fill();});
    blobs.forEach(b=>{ctx.beginPath();ctx.arc(b.x,b.y,b.r*pulse,0,Math.PI*2);ctx.strokeStyle=o.borderColor;ctx.lineWidth=1.5;ctx.stroke();});
    // spinning wind arrows
    const wa=gameTime/800;
    for(let i=0;i<3;i++){
      const a=wa+i*Math.PI*2/3,wx=Math.cos(a)*o.r*0.55,wy=Math.sin(a)*o.r*0.4;
      ctx.save();ctx.translate(wx,wy);ctx.rotate(a+Math.PI/2);
      ctx.strokeStyle='rgba(150,180,255,0.7)';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(-4,0);ctx.lineTo(4,0);ctx.closePath();ctx.stroke();ctx.restore();
    }

  } else if(o.shapeType==='rift'){
    ctx.beginPath();
    for(let i=0;i<o.spikes*2;i++){
      const a=(Math.PI/o.spikes)*i-Math.PI/2;
      const r2=i%2===0?o.r*pulse:o.r*0.42*pulse;
      const px=Math.cos(a)*r2,py=Math.sin(a)*r2;
      i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
    }
    ctx.closePath();ctx.fillStyle=o.color;ctx.fill();ctx.strokeStyle=o.borderColor;ctx.lineWidth=2;ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,o.r*0.28,0,Math.PI*2);ctx.fillStyle='rgba(160,0,255,0.5)';ctx.fill();
  }
  ctx.restore();
}

// ── OBSTACLE EFFECTS ON PLAYER ────────────────────────────────────────────────
function applyObstacleEffects(){
  obstacles.forEach(o=>{
    const d=dist(player,o);
    const minD=player.r+o.r;
    if(d<minD&&d>0){
      // push out (solid collision for all)
      const nx=(player.x-o.x)/d,ny=(player.y-o.y)/d;
      player.x=o.x+nx*minD;player.y=o.y+ny*minD;
      // special effects on contact
      if(o.burns&&player.invincible<=0){
        damagePlayer(4);player.invincible=0.5;
        spawnBurst(player.x,player.y,'#ff6600',4);
      }
      if(o.tangles&&playerEntangled<=0){
        playerEntangled=1.5;
        showStatus('🌿 Entangled! Can\'t move for 1.5s!',1.8);
      }
      // Wind: single random burst on contact, not a continuous field
      if(o.blows&&!o._blowCooldown){
        const randA=Math.random()*Math.PI*2;
        const strength=220+Math.random()*80;
        playerBlown.vx=Math.cos(randA)*strength*0.05;
        playerBlown.vy=Math.sin(randA)*strength*0.05;
        playerBlown.t=0.4;
        o._blowCooldown=true;
        // Reset cooldown after 0.6s so player can be blown again if they re-enter
        setTimeout(()=>{o._blowCooldown=false;},600);
      }
    }
  });
}

// ── VOID REALM PHYSICS ───────────────────────────────────────────────────────
// Luma spins out of control in the void realm until rescued
const lumaState={
  x:CAPTIVE_POSITIONS.void.x, y:CAPTIVE_POSITIONS.void.y,
  vx:40, vy:-30, spinAngle:0, spinRate:4,
  cryTimer:0, cryText:'',
};
const LUMA_CRIES=['Help!','I\'m dizzy!','I\'ve lost control!','Somebody stop me!','Wheee... wait no!','HELP!','So dizzy...','Can\'t stop spinning!'];

function updateVoidPhysics(dt){
  if(currentRealm!=='void')return;
  const cn=captiveNarwhals.find(n=>n.id==='void');
  if(!cn||cn.freed)return;

  // Move Luma
  lumaState.x+=lumaState.vx*dt;
  lumaState.y+=lumaState.vy*dt;
  lumaState.spinAngle+=lumaState.spinRate*dt;

  // Luma steers away from player — always fleeing
  const ldx=lumaState.x-player.x,ldy=lumaState.y-player.y;
  const ld=Math.hypot(ldx,ldy)||1;
  const fleeRange=180; // starts fleeing when player within this distance
  if(ld<fleeRange){
    const fleeStrength=220*(1-ld/fleeRange); // stronger the closer the player
    lumaState.vx+=ldx/ld*fleeStrength*dt;
    lumaState.vy+=ldy/ld*fleeStrength*dt;
    lumaState.spinRate+=(Math.random()-0.5)*2*dt; // panic spin
    // Cap speed so she doesn't go infinitely fast
    const ls=Math.hypot(lumaState.vx,lumaState.vy);
    if(ls>160){lumaState.vx=lumaState.vx/ls*160;lumaState.vy=lumaState.vy/ls*160;}
  }

  // Bounce off walls
  if(lumaState.x<40){lumaState.x=40;lumaState.vx=Math.abs(lumaState.vx);}
  if(lumaState.x>W-40){lumaState.x=W-40;lumaState.vx=-Math.abs(lumaState.vx);}
  if(lumaState.y<60){lumaState.y=60;lumaState.vy=Math.abs(lumaState.vy);}
  if(lumaState.y>H-60){lumaState.y=H-60;lumaState.vy=-Math.abs(lumaState.vy);}

  // Sync captive narwhal position so rescue detection works
  cn.x=lumaState.x;cn.y=lumaState.y;

  // Luma bounces off void obstacles
  obstacles.forEach(o=>{
    const d=dist(lumaState,o);
    const minD=30+o.r;
    if(d<minD&&d>0){
      const nx=(lumaState.x-o.x)/d,ny=(lumaState.y-o.y)/d;
      lumaState.x=o.x+nx*minD;lumaState.y=o.y+ny*minD;
      // Reflect velocity
      const dot=lumaState.vx*nx+lumaState.vy*ny;
      lumaState.vx-=2*dot*nx;lumaState.vy-=2*dot*ny;
      lumaState.spinRate=(Math.random()-0.5)*8; // chaotic spin change
    }
  });

  // Cry text timer
  lumaState.cryTimer-=dt;
  if(lumaState.cryTimer<=0){
    lumaState.cryText=LUMA_CRIES[Math.floor(Math.random()*LUMA_CRIES.length)];
    lumaState.cryTimer=1.5+Math.random()*2;
  }

  // Move void obstacles and bounce them off walls and each other
  obstacles.forEach(o=>{
    if(!o.vx)return; // non-void obstacles are static
    o.x+=o.vx*dt;o.y+=o.vy*dt;
    o.rotation+=o.spinRate*dt;

    if(o.x<o.r+20){o.x=o.r+20;o.vx=Math.abs(o.vx);}
    if(o.x>W-o.r-20){o.x=W-o.r-20;o.vx=-Math.abs(o.vx);}
    if(o.y<o.r+50){o.y=o.r+50;o.vy=Math.abs(o.vy);}
    if(o.y>H-o.r-40){o.y=H-o.r-40;o.vy=-Math.abs(o.vy);}
  });

  // Obstacle-obstacle collisions
  for(let i=0;i<obstacles.length;i++){
    for(let j=i+1;j<obstacles.length;j++){
      const a=obstacles[i],b=obstacles[j];
      if(!a.vx||!b.vx)continue;
      const d=Math.hypot(a.x-b.x,a.y-b.y);
      const minD=a.r+b.r;
      if(d<minD&&d>0){
        const nx=(a.x-b.x)/d,ny=(a.y-b.y)/d;
        // Push apart
        const overlap=(minD-d)/2;
        a.x+=nx*overlap;a.y+=ny*overlap;
        b.x-=nx*overlap;b.y-=ny*overlap;
        // Swap velocity components along collision normal
        const da=a.vx*nx+a.vy*ny;
        const db=b.vx*nx+b.vy*ny;
        a.vx+=(-da+db)*nx;a.vy+=(-da+db)*ny;
        b.vx+=(da-db)*nx;b.vy+=(da-db)*ny;
      }
    }
  }
}
const ELEM_COLORS={fire:'#ff4400',water:'#0088ff',air:'#88aaff',earth:'#44aa00',void:'#8800ff'};
const ELEM_WEAKNESSES={fire:'water',water:'earth',earth:'fire',air:'earth'}; // void has no weakness
const REALM_ENEMY_ELEMENT={water:'water',fire:'fire',earth:'earth',air:'air',void:'void'};
const ALL_ELEMENTS=['fire','water','air','earth','void'];

// ── ENEMIES ───────────────────────────────────────────────────────────────────
let enemies=[],enemySpawnTimer=0;

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
let projectiles=[],enemyProjectiles=[];

function shootPlayer(fromX,fromY,toX,toY,elemDef,special=false){
  const dx=toX-fromX,dy=toY-fromY,d=Math.hypot(dx,dy)||1;
  const spd=350,dmg=special?elemDef.damage:Math.ceil(elemDef.damage*0.6);
  projectiles.push({x:fromX,y:fromY,vx:dx/d*spd,vy:dy/d*spd,
    color:elemDef.autoColor,r:special?(elemDef.element==='void'?20:10):7,dmg,life:1.6,
    element:elemDef.element,pullRadius:elemDef.element==='void'&&special?200:0});
}

// ── COIN PICKUPS ──────────────────────────────────────────────────────────────
let coinPickups=[]; // {x,y,bobT,life}  — stay on ground until player touches

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

function drawCoinPickups(){
  coinPickups.forEach(c=>{
    const by=c.y+Math.sin(c.bobT)*4;
    ctx.font='18px serif';ctx.textAlign='center';ctx.textBaseline='middle';
    // glow
    ctx.shadowColor='#ffcc00';ctx.shadowBlur=10;
    ctx.fillText('🪙',c.x,by);
    ctx.shadowBlur=0;
    // fade ring when about to despawn
    if(c.life<3){
      ctx.beginPath();ctx.arc(c.x,by,14,0,Math.PI*2);
      ctx.strokeStyle=`rgba(255,220,0,${c.life/3*0.6})`;ctx.lineWidth=1.5;ctx.stroke();
    }
  });
}

// ── PARTICLES ─────────────────────────────────────────────────────────────────
let particles=[];
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

// ── BOSS ─────────────────────────────────────────────────────────────────────
const boss={x:W/2,y:160,r:60,hp:3500,maxHp:3500,speed:55,velX:1.2,velY:0.6,shootTimer:0,phase:1,alive:true,dmgFlash:0,angle:0};
let blackHoleEffect=null; // {x,y,life,maxLife,pct}

// ── REALM DMG ─────────────────────────────────────────────────────────────────
let realmDmgTimer=0;

// ── HELPERS ───────────────────────────────────────────────────────────────────
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}

function showStatus(msg,dur=2){
  const el=document.getElementById('statusMsg');
  el.textContent=msg;el.style.display='block';
  clearTimeout(showStatus._t);
  showStatus._t=setTimeout(()=>{el.style.display='none';},dur*1000);
}

// ── DRAW NARWHAL ──────────────────────────────────────────────────────────────
function drawNarwhal(x,y,angle,scale=1,color='#c9a0ff',flash=false,imgKey='narwhal-player'){
  const img=IMAGES[imgKey];
  const s=NARWHAL_SIZE*scale;
  ctx.save();ctx.translate(x,y);ctx.rotate(angle+Math.PI/2);
  if(flash)ctx.filter='brightness(5)';
  if(img&&img.complete&&img.naturalWidth)ctx.drawImage(img,-s/2,-s/2,s,s);
  ctx.filter='none';
  ctx.restore();
}

function drawShopkeeper(){
  const x=SHOPKEEPER.x,y=SHOPKEEPER.y;
  const bob=Math.sin(gameTime/700)*5;
  const lumaRescued=rescuedSet.has('void');
  ctx.save();
  ctx.fillStyle='rgba(40,0,60,0.85)';
  ctx.beginPath();ctx.roundRect(x-85,y-bob-75,170,36,8);ctx.fill();
  ctx.fillStyle='#cc88ff';ctx.font='11px Nunito,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(lumaRescued?'🌑 The Void awaits...':'🌑 Find Luma first!',x,y-bob-57);
  ctx.restore();
  drawNarwhal(x,y+bob,Math.PI*0.1,1.1,'#111111',false,'narwhal-void');
  ctx.save();
  const g=ctx.createRadialGradient(x,y+bob,5,x,y+bob,38);
  g.addColorStop(0,'rgba(80,0,120,0.3)');g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.beginPath();ctx.arc(x,y+bob,38,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();
  ctx.restore();
}

function drawRobot(x,y,elem,r,flash){
  const img=IMAGES['enemy-'+elem]||IMAGES['enemy-water'];
  ctx.save();ctx.translate(x,y);
  if(flash)ctx.filter='brightness(5)';
  if(img&&img.complete&&img.naturalWidth)ctx.drawImage(img,-ENEMY_SIZE/2,-ENEMY_SIZE/2,ENEMY_SIZE,ENEMY_SIZE);
  ctx.filter='none';
  ctx.restore();
}

function drawCybertruck(flash){
  const img=IMAGES['cybertruck-boss'];
  ctx.save();ctx.translate(boss.x,boss.y);
  if(flash)ctx.filter='brightness(5)';
  if(img&&img.complete&&img.naturalWidth)ctx.drawImage(img,-BOSS_W/2,-BOSS_H/2,BOSS_W,BOSS_H);
  ctx.filter='none';
  // phase 2 — exhaust flames drawn on top of PNG
  if(boss.phase>=2){
    const flk=Math.sin(gameTime/60)*8;
    ctx.beginPath();ctx.moveTo(-BOSS_W/2,-10);ctx.lineTo(-BOSS_W/2-12+flk,-2);ctx.lineTo(-BOSS_W/2,10);
    ctx.fillStyle='rgba(255,100,0,0.8)';ctx.fill();
  }
  ctx.restore();
}

function drawBackground(){
  const realm=REALMS[currentRealm]||REALMS.hub;
  const bgImg=IMAGES['bg-'+currentRealm];
  if(bgImg&&bgImg.complete&&bgImg.naturalWidth){
    ctx.drawImage(bgImg,0,0,W,H);
    ctx.globalAlpha=0.5;
  }
  const g=ctx.createLinearGradient(0,0,W,H);
  g.addColorStop(0,realm.bg[0]);g.addColorStop(1,realm.bg[1]);
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.globalAlpha=1;

  // Hub realm: animated ocean waves
  if(currentRealm==='hub'){
    const t=gameTime/1000;
    for(let row=0;row<6;row++){
      const baseY=80+row*(H/5.5);
      const alpha=0.04+row*0.015;
      ctx.beginPath();
      ctx.moveTo(0,baseY);
      for(let x=0;x<=W;x+=6){
        const y=baseY+Math.sin(x*0.018+t*(0.8+row*0.15))*12+Math.sin(x*0.03-t*0.5)*6;
        ctx.lineTo(x,y);
      }
      ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.closePath();
      ctx.fillStyle=`rgba(0,${130+row*14},${200+row*8},${alpha})`;ctx.fill();
    }
    // Shimmer highlights
    for(let i=0;i<8;i++){
      const sx=(Math.sin(t*0.4+i*1.3)*0.5+0.5)*W;
      const sy=(Math.sin(t*0.3+i*0.9)*0.5+0.5)*H;
      const sg=ctx.createRadialGradient(sx,sy,0,sx,sy,40);
      sg.addColorStop(0,'rgba(100,200,255,0.06)');sg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.beginPath();ctx.arc(sx,sy,40,0,Math.PI*2);ctx.fillStyle=sg;ctx.fill();
    }
    return; // skip hex grid for hub
  }

  ctx.strokeStyle=realm.accent+'10';ctx.lineWidth=0.5;
  const hex=50;
  for(let row=0;row<H/hex+2;row++)for(let col=0;col<W/hex+2;col++){
    const ox=(row%2)*hex*0.5,cx2=col*hex+ox,cy2=row*hex*0.866;
    ctx.beginPath();
    for(let i=0;i<6;i++){const a=Math.PI/6+Math.PI/3*i,px=cx2+Math.cos(a)*hex*0.5,py=cy2+Math.sin(a)*hex*0.5;i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);}
    ctx.closePath();ctx.stroke();
  }
}

function drawPortal(p){
  const unlocked=canEnterRealm(p.id);
  const isVoid=p.id==='void';
  const baseR=isVoid?70:30; // void portal is much larger

  ctx.save();ctx.translate(p.x,p.y);
  const glow=Math.sin(gameTime/500)*0.5+0.5;
  const col=isVoid?'#6600cc':(ELEM_COLORS[p.id==='hub'?'void':p.id]||'#9966ff');

  if(isVoid){
    // Dark menacing void portal — swirling darkness
    const pulse=Math.sin(gameTime/600)*0.08+0.92;

    // Outer dark aura
    const aura=ctx.createRadialGradient(0,0,baseR*0.3,0,0,baseR*2.2);
    aura.addColorStop(0,'rgba(40,0,80,0.6)');
    aura.addColorStop(0.5,'rgba(20,0,40,0.4)');
    aura.addColorStop(1,'rgba(0,0,0,0)');
    ctx.beginPath();ctx.arc(0,0,baseR*2.2,0,Math.PI*2);ctx.fillStyle=aura;ctx.fill();

    // Rotating outer ring with spikes
    ctx.save();ctx.rotate(gameTime/2000);
    for(let i=0;i<8;i++){
      const a=(Math.PI*2/8)*i;
      ctx.beginPath();ctx.moveTo(Math.cos(a)*baseR*1.1,Math.sin(a)*baseR*1.1);
      ctx.lineTo(Math.cos(a)*(baseR*1.5+Math.sin(gameTime/300+i)*8),Math.sin(a)*(baseR*1.5+Math.sin(gameTime/300+i)*8));
      ctx.strokeStyle=unlocked?'rgba(120,0,200,0.7)':'rgba(60,60,60,0.5)';ctx.lineWidth=2;ctx.stroke();
    }
    ctx.restore();

    // Counter-rotating ring
    ctx.save();ctx.rotate(-gameTime/1500);
    ctx.strokeStyle=unlocked?'rgba(150,0,255,0.5)':'rgba(50,50,50,0.4)';ctx.lineWidth=3;
    ctx.setLineDash([10,6]);ctx.beginPath();ctx.arc(0,0,baseR*1.3,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    ctx.restore();

    // Main portal circle — deep darkness
    const pg=ctx.createRadialGradient(0,0,5,0,0,baseR*pulse);
    pg.addColorStop(0,'rgba(0,0,0,0.98)');
    pg.addColorStop(0.7,'rgba(30,0,60,0.9)');
    pg.addColorStop(1,unlocked?'rgba(100,0,180,0.7)':'rgba(30,30,30,0.7)');
    ctx.beginPath();ctx.arc(0,0,baseR*pulse,0,Math.PI*2);ctx.fillStyle=pg;ctx.fill();

    // Ring border
    ctx.strokeStyle=unlocked?`rgba(${120+glow*80|0},0,255,0.9)`:'rgba(70,70,70,0.6)';
    ctx.lineWidth=unlocked?4:2;
    ctx.shadowColor=unlocked?'#8800ff':'transparent';ctx.shadowBlur=unlocked?(20+glow*20):0;
    ctx.stroke();ctx.shadowBlur=0;

    // Inner swirl dots
    if(unlocked){
      for(let i=0;i<6;i++){
        const a=(gameTime/800)+(Math.PI*2/6)*i;
        const ir=baseR*0.5;
        ctx.beginPath();ctx.arc(Math.cos(a)*ir,Math.sin(a)*ir,4,0,Math.PI*2);
        ctx.fillStyle=`rgba(180,80,255,${0.5+Math.sin(gameTime/300+i)*0.3})`;ctx.fill();
      }
    }

    ctx.restore();

    // Emoji and label below
    ctx.font='32px serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.shadowColor='#8800ff';ctx.shadowBlur=unlocked?15:0;
    ctx.fillText(p.emoji,p.x,p.y);ctx.shadowBlur=0;

    ctx.font=unlocked?'bold 13px Nunito,sans-serif':'12px Nunito,sans-serif';
    ctx.fillStyle=unlocked?'#cc88ff':'#666';ctx.textAlign='center';ctx.textBaseline='top';
    ctx.fillText(REALMS.void.name,p.x,p.y+baseR+10);
    if(!unlocked){
      const four=hasAllFour();
      const coins=sandDollars>=5;
      ctx.font='10px Nunito,sans-serif';
      ctx.fillStyle=four?'#88ff88':'#ff8888';
      ctx.fillText(four?'✅ All 4 narwhals rescued':'❌ Need all 4 narwhals',p.x,p.y+baseR+26);
      ctx.fillStyle=coins?'#88ff88':'#ff8888';
      ctx.fillText(coins?'✅ 5 🪙 ready':'❌ Need 5 🪙 (have '+sandDollars+')',p.x,p.y+baseR+40);
    }

  } else {
    // Normal portal
    const pg=ctx.createRadialGradient(0,0,5,0,0,baseR);
    pg.addColorStop(0,col+'aa');pg.addColorStop(1,col+'00');
    ctx.fillStyle=pg;ctx.beginPath();ctx.arc(0,0,baseR,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=unlocked?col:'#444';ctx.lineWidth=3;ctx.shadowColor=col;ctx.shadowBlur=10+glow*15;ctx.stroke();
    ctx.rotate(gameTime/1000);ctx.strokeStyle=(unlocked?col:'#444')+'88';ctx.lineWidth=1.5;
    ctx.setLineDash([5,8]);ctx.beginPath();ctx.arc(0,0,baseR*1.27,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    ctx.restore();

    ctx.font='22px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(p.emoji,p.x,p.y);
    ctx.font='11px Nunito,sans-serif';ctx.fillStyle=unlocked?'#fff':'#666';
    ctx.fillText(REALMS[p.id]?.name||'Home',p.x,p.y+42);
    if(!unlocked){
      const nid=UNLOCK_CHAIN[p.id];
      const hint='Need: '+NARWHAL_DEFS.find(n=>n.id===nid)?.emoji+' first';
      ctx.font='10px Nunito,sans-serif';ctx.fillStyle='#ff8888';ctx.fillText(hint,p.x,p.y+56);
    }
  }
}

// ── ORBIT POSITIONS ───────────────────────────────────────────────────────────
function getOrbitPos(idx,total){
  const a=(gameTime/1000)*1.1+idx*(Math.PI*2/total);
  return{x:player.x+Math.cos(a)*50,y:player.y+Math.sin(a)*50,angle:a+Math.PI/2};
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
  enemyProjectiles=enemyProjectiles.filter(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;return p.life>0&&p.x>-20&&p.x<W+20&&p.y>-20&&p.y<H+20;});
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
}

function freeNarwhal(cn){
  cn.freed=true;rescuedSet.add(cn.id);
  companionHp[cn.id]=COMPANION_MAX_HP;
  carryingNarwhal=cn.id;
  state='fact'; // pauses game behind popup
  document.getElementById('factNarwhal').textContent=cn.emoji;
  document.getElementById('factTitle').textContent=cn.factTitle;
  document.getElementById('factText').textContent=cn.fact;
  document.getElementById('factPopup').classList.add('show');
  spawnBurst(cn.x,cn.y,ELEM_COLORS[cn.element],20);
  if(!selectedElement&&cn.element!=='air')setSelected(cn.id);
  updateCompanionUI();
}

function showReadyPrompt(){
  state='fact'; // pause game
  const factBtn=document.getElementById('factBtn');
  factBtn.style.display='none';
  ['readyGo','readyNot'].forEach(id=>{const el=document.getElementById(id);if(el)el.remove();});

  document.getElementById('factNarwhal').textContent='🌑';
  document.getElementById('factTitle').textContent='Luma the Void Narwhal';
  document.getElementById('factText').textContent=
    'Are you ready to save the ocean and destroy the Evil Cybertruck?';

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
      document.getElementById('shopText').textContent='EXCELLENT. The Black Hole power is yours! Now go destroy the Evil Cybertruck! 🌑';
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

function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

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
  showStatus('🚗 THE EVIL CYBERTRUCK ARRIVES!',3);
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

// Boss-mode formation: narwhals in tight line alongside player at bottom
function getBossOrbitPos(idx,total){
  // Spread tightly around the player, moving with them
  const spacing=52; // tight spacing between companions
  const totalWidth=spacing*(total-1);
  const startX=player.x-totalWidth/2;
  const x=startX+idx*spacing;
  const y=player.y+30; // trails just below player, moves with them
  return{x,y,angle:-Math.PI/2};
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
          color:ELEM_COLORS[be],element:be,r:9,dmg:14,life:4});
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

// ── RENDER ────────────────────────────────────────────────────────────────────
function render(){
  ctx.clearRect(0,0,W,H);
  drawBackground();

  if(state==='playing'||state==='carrying'||state==='shop'){
    if(currentRealm==='hub'){
      PORTALS.forEach(p=>drawPortal(p));
      ctx.font='bold 13px Nunito,sans-serif';ctx.fillStyle='rgba(200,180,255,0.2)';
      ctx.textAlign='center';
    } else {
      drawPortal(HUB_PORTAL);
      obstacles.forEach(o=>drawObstacle(o));
      drawCoinPickups();
      // Shopkeeper in void realm
      if(currentRealm==='void')drawShopkeeper();
      // Captive narwhals
      captiveNarwhals.forEach(cn=>{
        if(cn.realm!==currentRealm||cn.freed)return;

        if(cn.id==='void'){
          // Luma spins out of control — no cage, just chaos
          const lx=lumaState.x,ly=lumaState.y;
          // Draw a broken cage spinning around her
          ctx.save();ctx.translate(lx,ly);ctx.rotate(lumaState.spinAngle*0.4);
          ctx.strokeStyle='rgba(120,0,180,0.5)';ctx.lineWidth=1.5;
          for(let i=0;i<4;i++){
            ctx.beginPath();ctx.moveTo(0,-36);const ba=(Math.PI*2/4)*i;
            ctx.lineTo(Math.cos(ba)*28,Math.sin(ba)*26);ctx.stroke();
          }
          ctx.beginPath();ctx.ellipse(0,0,28,26,lumaState.spinAngle*0.3,0,Math.PI*2);
          ctx.strokeStyle='rgba(100,0,160,0.35)';ctx.stroke();
          ctx.restore();
          // Draw Luma spinning fast
          drawNarwhal(lx,ly,lumaState.spinAngle,1,ELEM_COLORS['void'],false,'narwhal-void');
          // Cry text bubble
          if(lumaState.cryText){
            ctx.save();
            ctx.font='bold 13px Nunito,sans-serif';ctx.textAlign='center';
            const bw=ctx.measureText(lumaState.cryText).width+16;
            ctx.fillStyle='rgba(40,0,60,0.85)';
            ctx.beginPath();ctx.roundRect(lx-bw/2,ly-68,bw,24,6);ctx.fill();
            ctx.fillStyle='#ee88ff';ctx.fillText(lumaState.cryText,lx,ly-52);
            ctx.restore();
          }
          // Rescue hint
          ctx.font='bold 11px Nunito,sans-serif';ctx.fillStyle='#cc88ff';ctx.textAlign='center';
          ctx.fillText('Catch Luma to rescue!',lx,ly+44);
          // Arrow if far
          const ddx=lx-player.x,ddy=ly-player.y,dd=Math.hypot(ddx,ddy);
          if(dd>200){
            const ax=player.x+ddx/dd*60,ay=player.y+ddy/dd*60;
            ctx.save();ctx.translate(ax,ay);ctx.rotate(Math.atan2(ddy,ddx));
            ctx.fillStyle='rgba(200,100,255,0.8)';ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(-6,-6);ctx.lineTo(-6,6);ctx.closePath();ctx.fill();ctx.restore();
          }
        } else {
          // Normal caged narwhal
          cn.bobT+=0.03;const by=cn.y+Math.sin(cn.bobT)*5;
          ctx.save();ctx.translate(cn.x,by);
          ctx.strokeStyle='#888';ctx.lineWidth=2;
          for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(0,-36);const ba=(Math.PI*2/6)*i;ctx.lineTo(Math.cos(ba)*30,Math.sin(ba)*28);ctx.stroke();}
          ctx.beginPath();ctx.ellipse(0,0,30,28,0,0,Math.PI*2);ctx.strokeStyle='rgba(120,120,120,0.45)';ctx.stroke();
          ctx.restore();
          drawNarwhal(cn.x,by,cn.bobT*0.5,1,ELEM_COLORS[cn.element],false,'narwhal-'+cn.id);
          ctx.font='bold 12px Nunito,sans-serif';ctx.fillStyle='#ffffaa';ctx.textAlign='center';
          ctx.fillText('Swim close to rescue!',cn.x,by-56);ctx.fillText(cn.emoji+' '+cn.name,cn.x,by-70);
          const ddx=cn.x-player.x,ddy=cn.y-player.y,dd=Math.hypot(ddx,ddy);
          if(dd>200){
            const ax=player.x+ddx/dd*60,ay=player.y+ddy/dd*60;
            ctx.save();ctx.translate(ax,ay);ctx.rotate(Math.atan2(ddy,ddx));
            ctx.fillStyle='rgba(255,255,150,0.75)';ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(-6,-6);ctx.lineTo(-6,6);ctx.closePath();ctx.fill();ctx.restore();
          }
        }
      });
      // Arrow pointing toward hub portal when carrying
      if(state==='carrying'){
        const ddx=HUB_PORTAL.x-player.x,ddy=HUB_PORTAL.y-player.y,dd=Math.hypot(ddx,ddy);
        if(dd>60){
          const ax=player.x+ddx/dd*65,ay=player.y+ddy/dd*65;
          ctx.save();ctx.translate(ax,ay);ctx.rotate(Math.atan2(ddy,ddx));
          ctx.fillStyle='rgba(100,255,100,0.85)';ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-7,-7);ctx.lineTo(-7,7);ctx.closePath();ctx.fill();ctx.restore();
          // entangle status indicator
          if(playerEntangled>0){
            ctx.fillStyle='rgba(50,180,50,0.8)';ctx.font='bold 13px Nunito,sans-serif';ctx.textAlign='center';
            ctx.fillText('🌿 ENTANGLED '+playerEntangled.toFixed(1)+'s',player.x,player.y-38);
          }
        }
      }
    }
    enemies.forEach(e=>{
      drawRobot(e.x,e.y,e.element,e.r,e.dmgFlash>0);
      if(e.hp<e.maxHp){const bw=e.r*2.5;ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(e.x-bw/2,e.y-e.r-10,bw,5);ctx.fillStyle='#ff4444';ctx.fillRect(e.x-bw/2,e.y-e.r-10,bw*(e.hp/e.maxHp),5);}
    });
  }

  if(state==='boss'){
    if(boss.alive)drawCybertruck(boss.dmgFlash>0);
    else spawnBurst(W/2,H/2,'#ff8800',4);

    // Black hole visual
    if(blackHoleEffect){
      blackHoleEffect.life-=blackHoleEffect.dtRef||0.016;
      const t=1-blackHoleEffect.life/blackHoleEffect.maxLife;
      const r=20+t*260; // expands more slowly over 3.5s
      const alpha=Math.max(0,blackHoleEffect.life/blackHoleEffect.maxLife);
      ctx.save();
      // Dark singularity — grows to eclipse the boss
      ctx.beginPath();ctx.arc(blackHoleEffect.x,blackHoleEffect.y,r*0.4,0,Math.PI*2);
      ctx.fillStyle=`rgba(0,0,0,${Math.min(1,alpha*1.5)})`;ctx.fill();
      // Purple event horizon ring
      ctx.beginPath();ctx.arc(blackHoleEffect.x,blackHoleEffect.y,r,0,Math.PI*2);
      ctx.strokeStyle=`rgba(160,0,255,${alpha*0.95})`;ctx.lineWidth=10*alpha;
      ctx.shadowColor='#aa00ff';ctx.shadowBlur=40*alpha;ctx.stroke();ctx.shadowBlur=0;
      // Outer glow ring
      ctx.beginPath();ctx.arc(blackHoleEffect.x,blackHoleEffect.y,r*1.35,0,Math.PI*2);
      ctx.strokeStyle=`rgba(220,100,255,${alpha*0.45})`;ctx.lineWidth=5*alpha;ctx.stroke();
      // Second outer ring
      ctx.beginPath();ctx.arc(blackHoleEffect.x,blackHoleEffect.y,r*1.7,0,Math.PI*2);
      ctx.strokeStyle=`rgba(160,0,255,${alpha*0.2})`;ctx.lineWidth=3*alpha;ctx.stroke();
      // Damage text — shows during first 70% of animation
      if(t<0.7){
        const textAlpha=t<0.5?1:1-(t-0.5)/0.2;
        ctx.font=`bold ${32+t*16|0}px Fredoka One,cursive`;
        ctx.fillStyle=`rgba(255,180,255,${textAlpha})`;
        ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.shadowColor='#cc00ff';ctx.shadowBlur=20;
        ctx.fillText('🌑 BLACK HOLE! -'+blackHoleEffect.pct+'% HP!',blackHoleEffect.x,blackHoleEffect.y);
        ctx.shadowBlur=0;
      }
      ctx.restore();
      if(blackHoleEffect.life<=0)blackHoleEffect=null;
    }

    enemies.forEach(e=>{
      drawRobot(e.x,e.y,e.element,e.r,e.dmgFlash>0);
      if(e.hp<e.maxHp){const bw=e.r*2.5;ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(e.x-bw/2,e.y-e.r-10,bw,5);ctx.fillStyle='#ff4444';ctx.fillRect(e.x-bw/2,e.y-e.r-10,bw*(e.hp/e.maxHp),5);}
    });
  }

  // Projectiles
  projectiles.forEach(p=>{
    ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    if(p.element==='void'){
      const vg=ctx.createRadialGradient(p.x,p.y,2,p.x,p.y,p.r);
      vg.addColorStop(0,'rgba(200,100,255,0.9)');vg.addColorStop(1,'rgba(80,0,180,0)');
      ctx.fillStyle=vg;
    } else ctx.fillStyle=p.color;
    ctx.shadowColor=p.color;ctx.shadowBlur=12+p.r;ctx.fill();ctx.shadowBlur=0;
  });
  enemyProjectiles.forEach(p=>{
    // Glowing colored circle
    ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=14;ctx.fill();ctx.shadowBlur=0;
    // Small box icon tinted with element color so color stays readable
    ctx.save();
    ctx.globalAlpha=0.85;
    ctx.font='9px serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=4;
    ctx.fillText('📦',p.x,p.y);
    ctx.restore();
  });

  // Particles
  particles.forEach(p=>{
    const alpha=p.life/p.maxLife;
    if(p.type==='text'){ctx.font='bold 14px Nunito,sans-serif';ctx.fillStyle=p.color;ctx.globalAlpha=alpha;ctx.textAlign='center';ctx.fillText(p.text,p.x,p.y-(1-alpha)*20);ctx.globalAlpha=1;}
    else{ctx.beginPath();ctx.arc(p.x,p.y,p.size*alpha,0,Math.PI*2);ctx.fillStyle=p.color;ctx.globalAlpha=alpha;ctx.fill();ctx.globalAlpha=1;}
  });

  // Player
  const flash=player.dmgFlash>0&&Math.sin(gameTime/50)>0;
  // Entangle vines drawn around player
  if(playerEntangled>0){
    for(let i=0;i<4;i++){
      const va=gameTime/400+i*Math.PI/2;
      ctx.beginPath();ctx.arc(player.x+Math.cos(va)*26,player.y+Math.sin(va)*26,5,0,Math.PI*2);
      ctx.fillStyle='rgba(60,180,30,0.75)';ctx.fill();
    }
  }
  drawNarwhal(player.x,player.y,player.angle,1,PLAYER_COLOR,flash,'narwhal-player');

  // Orbiting companions
  const rescArr=[...rescuedSet];
  rescArr.forEach((id,oi)=>{
    const op=state==='boss'?getBossOrbitPos(oi,rescArr.length):getOrbitPos(oi,rescArr.length);
    const hpPct=companionHp[id]/COMPANION_MAX_HP;
    const isActive=(id===selectedElement)&&state!=='boss';
    const col=ELEM_COLORS[id]||'#aaaaff';
    if(isActive){
      ctx.save();ctx.beginPath();ctx.arc(op.x,op.y,20,0,Math.PI*2);
      ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.shadowColor=col;ctx.shadowBlur=12;ctx.stroke();ctx.shadowBlur=0;ctx.restore();
    }
    ctx.globalAlpha=0.4+hpPct*0.6;
    drawNarwhal(op.x,op.y,op.angle,0.55,col,hpPct<0.25&&Math.sin(gameTime/80)>0,'narwhal-'+id);
    ctx.globalAlpha=1;
    const pipW=24,pipH=4;
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(op.x-pipW/2,op.y-24,pipW,pipH);
    ctx.fillStyle=hpPct>0.5?'#44ff88':hpPct>0.25?'#ffdd00':'#ff4444';
    ctx.fillRect(op.x-pipW/2,op.y-24,pipW*hpPct,pipH);
  });

  // Boss mode: draw bottom lane boundary
  if(state==='boss'){
    ctx.strokeStyle='rgba(0,200,255,0.25)';ctx.lineWidth=1.5;ctx.setLineDash([8,6]);
    ctx.beginPath();ctx.moveTo(0,H*2/3);ctx.lineTo(W,H*2/3);ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle='rgba(0,200,255,0.04)';ctx.fillRect(0,H*2/3,W,H/3);
  }

  ctx.textAlign='left';ctx.textBaseline='alphabetic';
}

// ── INPUT ─────────────────────────────────────────────────────────────────────
window.addEventListener('keydown',e=>{
  // Prevent Shift and other keys from triggering browser defaults during gameplay
  if(['Shift','Tab',' '].includes(e.key))e.preventDefault();
  keys[e.key]=true;
  if(state!=='playing'&&state!=='carrying'&&state!=='boss')return;
  const num=parseInt(e.key);
  if(num>=1&&num<=5){
    const n=NARWHAL_DEFS[num-1];
    if(!rescuedSet.has(n.id))return;

    // Boss-mode uses shorter cooldowns
    const effectiveCooldown = state==='boss'
      ? (n.element==='air'?2000 : n.element==='void'?5000 : n.cooldown)
      : n.cooldown;

    if(n.element==='air'){
      if(abilityCooldowns[n.id]>0)return;
      abilityCooldowns[n.id]=effectiveCooldown;
      healAllCompanions(30);
      spawnBurst(player.x,player.y,'#aaccff',14);
      for(let i=0;i<10;i++){const a=Math.random()*Math.PI*2,sp=40+Math.random()*60;particles.push({x:player.x,y:player.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,color:'#aaffcc',life:0.7,maxLife:0.7,size:6});}
      if(state==='boss'){
        const rA=[...rescuedSet];rA.forEach((id,oi)=>{const op=getBossOrbitPos(oi,rA.length);spawnBurst(op.x,op.y,'#88ffcc',5);});
      } else {
        const rA=[...rescuedSet];rA.forEach((id,oi)=>{const op=getOrbitPos(oi,rA.length);spawnBurst(op.x,op.y,'#88ffcc',5);});
      }
      setSelected('air');
    } else if(n.id==='void'){
      setSelected('void');
      if(abilityCooldowns[n.id]>0)return;
      abilityCooldowns[n.id]=effectiveCooldown;
      if(state==='boss'&&boss.alive){
        // BLACK HOLE: 20-40% of boss max HP as instant damage + visual
        const pct=0.10+Math.random()*0.20;
        const dmg=Math.round(boss.maxHp*pct);
        boss.hp=Math.max(0,boss.hp-dmg);
        boss.dmgFlash=0.4;
        document.getElementById('bossFill').style.width=Math.max(0,boss.hp/boss.maxHp*100)+'%';
        // Spawn a black hole visual (large expanding ring particle)
        blackHoleEffect={x:boss.x,y:boss.y,life:3.5,maxLife:3.5,pct:Math.round(pct*100)};
        spawnBurst(boss.x,boss.y,'#8800ff',30);
        showStatus('🌑 BLACK HOLE! -'+Math.round(pct*100)+'% HP!',2);
        if(boss.hp<=0){
          boss.alive=false;spawnBurst(boss.x,boss.y,'#ff4400',40);
          setTimeout(()=>{state='win';document.getElementById('winScreen').style.display='flex';drawQR();
            },1800);
        }
      } else {
        shootPlayer(player.x,player.y,mouseX,mouseY,n,true);
        showStatus('🌑 BLACK HOLE!',1.5);
      }
    } else {
      setSelected(n.id);
      if(abilityCooldowns[n.id]>0)return;
      abilityCooldowns[n.id]=effectiveCooldown;
      shootPlayer(player.x,player.y,mouseX,mouseY,n,true);
    }
  }
});
window.addEventListener('keyup',e=>{keys[e.key]=false;});
canvas.addEventListener('mousemove',e=>{
  const r=canvas.getBoundingClientRect();
  mouseX=(e.clientX-r.left)*(W/r.width);mouseY=(e.clientY-r.top)*(H/r.height);
});

canvas.addEventListener('click',e=>{
  if(state!=='playing'&&state!=='carrying'&&state!=='boss')return;
  const r=canvas.getBoundingClientRect();
  const cx=(e.clientX-r.left)*(W/r.width);
  const cy=(e.clientY-r.top)*(H/r.height);

  if(!selectedElement)return;
  const n=NARWHAL_DEFS.find(nd=>nd.id===selectedElement);
  if(!n||!rescuedSet.has(n.id))return;

  if(n.element==='air'){
    // Air still respects cooldown — heal isn't free
    const effectiveCooldown=state==='boss'?2000:n.cooldown;
    if(abilityCooldowns[n.id]>0)return;
    abilityCooldowns[n.id]=effectiveCooldown;
    healAllCompanions(30);
    spawnBurst(player.x,player.y,'#aaccff',14);
    for(let i=0;i<10;i++){const a=Math.random()*Math.PI*2,sp=40+Math.random()*60;particles.push({x:player.x,y:player.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,color:'#aaffcc',life:0.7,maxLife:0.7,size:6});}
    if(state==='boss'){const rA=[...rescuedSet];rA.forEach((id,oi)=>{const op=getBossOrbitPos(oi,rA.length);spawnBurst(op.x,op.y,'#88ffcc',5);});}
    else{const rA=[...rescuedSet];rA.forEach((id,oi)=>{const op=getOrbitPos(oi,rA.length);spawnBurst(op.x,op.y,'#88ffcc',5);});}
  } else if(n.id==='void'&&state==='boss'&&boss.alive){
    // Black hole still respects cooldown
    const effectiveCooldown=5000;
    if(abilityCooldowns[n.id]>0)return;
    abilityCooldowns[n.id]=effectiveCooldown;
    const pct=0.10+Math.random()*0.20;
    const dmg=Math.round(boss.maxHp*pct);
    boss.hp=Math.max(0,boss.hp-dmg);boss.dmgFlash=0.4;
    document.getElementById('bossFill').style.width=Math.max(0,boss.hp/boss.maxHp*100)+'%';
    blackHoleEffect={x:boss.x,y:boss.y,life:3.5,maxLife:3.5,pct:Math.round(pct*100)};
    spawnBurst(boss.x,boss.y,'#8800ff',30);
    showStatus('🌑 BLACK HOLE! -'+Math.round(pct*100)+'% HP!',2);
    if(boss.hp<=0){boss.alive=false;spawnBurst(boss.x,boss.y,'#ff4400',40);
      setTimeout(()=>{state='win';document.getElementById('winScreen').style.display='flex';drawQR();
        },1800);}
  } else {
    // Normal attack — NO cooldown, fires every click
    shootPlayer(player.x,player.y,cx,cy,n,true);
  }
});

// ── BUTTONS ───────────────────────────────────────────────────────────────────
document.getElementById('startBtn').onclick=()=>{
  document.getElementById('titleScreen').style.display='none';
  state='playing';enterRealm('hub');
};
document.getElementById('factBtn').onclick=()=>{
  document.getElementById('factPopup').classList.remove('show');
  lastTime=performance.now(); // prevent dt spike after pause
  state='carrying'; // now player must walk to exit
};
document.getElementById('helpBtn').onclick=()=>{
  const c=document.getElementById('controls');
  const visible=c.style.display==='block';
  c.style.display=visible?'none':'block';
};

document.getElementById('controlToggleBtn').onclick=()=>{
  controlMode=controlMode==='wasd'?'mouse':'wasd';
  const btn=document.getElementById('controlToggleBtn');
  btn.textContent=controlMode==='wasd'?'WASD':'🖱️';
  btn.style.background=controlMode==='mouse'?'rgba(100,0,200,0.5)':'rgba(0,0,0,0.5)';
  document.getElementById('controls').innerHTML=controlMode==='wasd'
    ?'WASD move • 1-5 select active element<br>Active narwhal fires • Others orbit & shield<br>4 = air heals everyone'
    :'Move cursor to steer • Click to shoot<br>1-5 select active element<br>4 = air heals everyone';
};
document.getElementById('restartBtn').onclick=()=>location.reload();
document.getElementById('retryBtn').onclick=()=>location.reload();

// ── QR CODE for win screen ────────────────────────────────────────────────────
function drawQR(){
  // Minimal QR encoder for the narwhal URL using the qrcode-generator library
  const script=document.createElement('script');
  script.src='https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
  script.onload=()=>{
    const url='https://us.whales.org/whales-dolphins/species-guide/narwhal/';
    const container=document.createElement('div');
    container.style.display='none';
    document.body.appendChild(container);
    new QRCode(container,{text:url,width:120,height:120,colorDark:'#ffffff',colorLight:'#1a0030'});
    // Wait a tick for QRCode to render its canvas/img
    setTimeout(()=>{
      const img=container.querySelector('img')||container.querySelector('canvas');
      const qrCanvas=document.getElementById('qrCanvas');
      const qrCtx=qrCanvas.getContext('2d');
      if(img){
        const src=img.src||img.toDataURL();
        const i=new Image();
        i.onload=()=>{qrCtx.drawImage(i,0,0,120,120);};
        i.src=src;
      }
      container.remove();
    },300);
  };
  document.head.appendChild(script);
}

// ── DRAW PLAYER NARWHAL ICONS ─────────────────────────────────────────────────
function drawNarwhalToCanvas(canvasEl,size,color='#c9a0ff'){
  if(!canvasEl)return;
  const img=IMAGES['narwhal-player'];
  if(!img||!img.complete||!img.naturalWidth)return;
  const c=canvasEl.getContext('2d');
  c.clearRect(0,0,canvasEl.width,canvasEl.height);
  c.save();
  c.translate(canvasEl.width/2,canvasEl.height/2);
  c.rotate(-Math.PI/2); // tusk pointing right for icon (horizontal swimming pose)
  c.drawImage(img,-size/2,-size/2,size,size);
  c.restore();
}

function initNarwhalIcons(){
  drawNarwhalToCanvas(document.getElementById('titleNarwhalCanvas'),70);
  drawNarwhalToCanvas(document.getElementById('playerIconHP'),18);
  const fn=document.getElementById('factNarwhal');
  if(fn){fn.textContent='';}
}

_onImgsReady=()=>{initNarwhalIcons();requestAnimationFrame(ts=>{lastTime=ts;gameLoop(ts);});};
if(_imgsLoaded===_imgsTotal)_onImgsReady();
