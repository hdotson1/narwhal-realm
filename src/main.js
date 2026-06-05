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

document.getElementById('scaleBar').addEventListener('click',e=>{
  const btn=e.target.closest('.scaleBtn');
  if(!btn)return;
  document.querySelectorAll('.scaleBtn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.documentElement.style.setProperty('--game-scale',btn.dataset.scale);
});

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

// ── NARWHAL ICONS ─────────────────────────────────────────────────────────────
function initNarwhalIcons(){
  drawNarwhalToCanvas(document.getElementById('titleNarwhalCanvas'),70);
  drawNarwhalToCanvas(document.getElementById('playerIconHP'),18);
  const fn=document.getElementById('factNarwhal');
  if(fn){fn.textContent='';}
}

// ── STARTUP ───────────────────────────────────────────────────────────────────
// Safety guard: if all images are already cached, fire immediately instead of
// waiting for onload events that will never fire.
function _startGame(){
  initNarwhalIcons();
  requestAnimationFrame(ts=>{lastTime=ts;gameLoop(ts);});
}
if(_imgsLoaded===_imgsTotal){
  _startGame();
} else {
  _onImgsReady=_startGame;
}
