const canvas=document.getElementById('c'),ctx=canvas.getContext('2d');
canvas.width=W*CANVAS_SCALE;canvas.height=H*CANVAS_SCALE;
canvas.style.width=W+'px';canvas.style.height=H+'px';
ctx.scale(CANVAS_SCALE,CANVAS_SCALE);

// ── ART ASSETS ────────────────────────────────────────────────────────────────
const IMAGES={};
let _imgsTotal=0,_imgsLoaded=0,_onImgsReady=null;
function _imgDone(){if(++_imgsLoaded===_imgsTotal&&_onImgsReady)_onImgsReady();}
['narwhal-player','narwhal-water','narwhal-fire','narwhal-earth','narwhal-air','narwhal-void',
 'enemy-water','enemy-fire','enemy-earth','enemy-air','enemy-void','orca-boss',
].forEach(k=>{_imgsTotal++;const i=new Image();i.onload=i.onerror=_imgDone;i.src='assets/'+k+'.png';IMAGES[k]=i;});
['hub','water','fire','earth','air','void','boss'].forEach(k=>{_imgsTotal++;const i=new Image();i.onload=i.onerror=_imgDone;i.src='assets/bg-'+k+'.svg';IMAGES['bg-'+k]=i;});

// ── STATE ─────────────────────────────────────────────────────────────────────
let state='title'; // title|playing|carrying|shop|boss|win|lose|fact
let controlMode='wasd'; // 'wasd' or 'mouse'
let keys={},mouseX=W/2,mouseY=H/2,sandDollars=0,gameTime=0,lastTime=0;
let shopStep=0; // 0=not open, 1=question1, 2=question2
let blackHolePurchased=false;
let bossTriggered=false;
let voidUnlocked=false; // stays true permanently after first purchase
let currentRealm='hub';

let companionHp={};
NARWHAL_DEFS.forEach(n=>{companionHp[n.id]=COMPANION_MAX_HP;});

let selectedElement=null;

const player={x:W/2,y:H/2,speed:180,hp:100,maxHp:100,r:22,angle:0,invincible:0,dmgFlash:0};

// Status effects
let playerEntangled=0;    // seconds remaining
let playerBlown={vx:0,vy:0,t:0};  // wind push

let rescuedSet=new Set();
let factResumeState='carrying';
let realmTipsShown=new Set();
let carryingNarwhal=null; // narwhal id being carried back to exit
let abilityCooldowns={};
let autoFireTimer=0;
NARWHAL_DEFS.forEach(n=>{abilityCooldowns[n.id]=0;});

// ── CAPTIVE NARWHALS ──────────────────────────────────────────────────────────
let captiveNarwhals=NARWHAL_DEFS.map(n=>({
  ...n,x:CAPTIVE_POSITIONS[n.id].x,y:CAPTIVE_POSITIONS[n.id].y,
  freed:false,bobT:Math.random()*Math.PI*2,
}));

// ── OBSTACLES ─────────────────────────────────────────────────────────────────
let obstacles=[];

// ── ENEMIES ───────────────────────────────────────────────────────────────────
let enemies=[],enemySpawnTimer=0;

// ── PROJECTILES ───────────────────────────────────────────────────────────────
let projectiles=[],enemyProjectiles=[];

// ── COIN PICKUPS ──────────────────────────────────────────────────────────────
let coinPickups=[]; // {x,y,bobT,life}  — stay on ground until player touches

// ── PARTICLES ─────────────────────────────────────────────────────────────────
let particles=[];

// ── BOSS ─────────────────────────────────────────────────────────────────────
const boss={x:W/2,y:160,r:60,hp:3500,maxHp:3500,speed:55,velX:1.2,velY:0.6,shootTimer:0,phase:1,alive:true,dmgFlash:0,angle:0};
let blackHoleEffect=null; // {x,y,life,maxLife,pct}

// ── REALM DMG ─────────────────────────────────────────────────────────────────
let realmDmgTimer=0;
