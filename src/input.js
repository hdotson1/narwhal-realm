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
      if(abilityCooldowns[n.id]>0)return;
      abilityCooldowns[n.id]=effectiveCooldown;
      shootPlayer(player.x,player.y,mouseX,mouseY,n,true);
      projectiles[projectiles.length-1].isVoidSpecial=true;
      projectiles[projectiles.length-1].targetX=mouseX;
      projectiles[projectiles.length-1].targetY=mouseY;
      const s5=document.getElementById('slot5');s5.classList.add('activating');s5.addEventListener('animationend',()=>s5.classList.remove('activating'),{once:true});
      showStatus('🌑 Black Hole!',1.5);
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
