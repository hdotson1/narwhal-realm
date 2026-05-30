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

// ── COIN PICKUPS ──────────────────────────────────────────────────────────────
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
