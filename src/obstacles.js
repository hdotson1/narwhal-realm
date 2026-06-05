// ── OBSTACLES ─────────────────────────────────────────────────────────────────
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
