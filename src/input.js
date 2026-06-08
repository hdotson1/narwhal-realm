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
      const s4=document.getElementById('slot4');s4.classList.add('activating');s4.addEventListener('animationend',()=>s4.classList.remove('activating'),{once:true});
      showStatus('💨 Healed!',1.5);
    } else if(n.id==='void'){
      if(state!=='boss'){showStatus('🌑 Reach the boss first!',1.2);return;}
      if(abilityCooldowns[n.id]>0)return;
      abilityCooldowns[n.id]=effectiveCooldown;
      if(boss.alive){
        // BLACK HOLE: 10-30% of boss max HP as instant damage + visual
        const pct=0.10+Math.random()*0.20;
        const dmg=Math.round(boss.maxHp*pct);
        boss.hp=Math.max(0,boss.hp-dmg);
        boss.dmgFlash=0.4;
        document.getElementById('bossFill').style.width=Math.max(0,boss.hp/boss.maxHp*100)+'%';
        blackHoleEffect={x:boss.x,y:boss.y,life:3.5,maxLife:3.5,pct:Math.round(pct*100)};
        spawnBurst(boss.x,boss.y,'#8800ff',30);
        showStatus('🌑 BLACK HOLE! -'+Math.round(pct*100)+'% HP!',2);
        const s5=document.getElementById('slot5');s5.classList.add('activating');s5.addEventListener('animationend',()=>s5.classList.remove('activating'),{once:true});
        if(boss.hp<=0){
          boss.alive=false;spawnBurst(boss.x,boss.y,'#ff4400',40);
          setTimeout(()=>{state='win';document.getElementById('winScreen').style.display='flex';drawQR();
            },1800);
        }
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

  shootPlayer(player.x,player.y,cx,cy,n,true);
});
