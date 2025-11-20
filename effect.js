/* effect.js
   Single-file merged animation + slideshow + heartbeat + fireworks + confetti
   Drop this into your project root and ensure index.html includes:
     <script src="effect.js"></script>
   It is defensive: missing elements or missing files won't crash everything.
*/
(function(){
  'use strict';

  /* ---------- helpers ---------- */
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const noop = ()=>{};
  const clamp = (v,a,b)=> Math.max(a, Math.min(b, v));

  function safePlay(audio){
    if(!audio) return Promise.resolve();
    try{ return audio.play().catch(()=>{}); } catch(e){ return Promise.resolve(); }
  }

  /* ---------- DOM nodes ---------- */
  const DOM = {
    typed: $('#typed'),
    wishBtn: $('#wishBtn'),
    musicBtn: $('#musicBtn'),
    slideshowBtn: $('#slideshowBtn') || $('#slideshowbtn') || $('#slideshowBTN'),
    downloadBtn: $('#downloadBtn'),
    bgMusic: $('#bgMusic'),
    music2: $('#music2'),
    overlay: $('#slideshowOverlay') || $('#slideshowoverlay'),
    slideImg: $('#slideImg') || $('#slideimg'),
    slideCaption: $('#slideCaption') || $('#slidecaption'),
    prevSlide: $('#prevSlide'),
    nextSlide: $('#nextSlide'),
    endSlides: $('#endSlides'),
    fireworksCanvas: $('#fireworks'),
    heartbeatGlow: $('#heartbeatGlow'),
    finalText: $('#finalText'),
    leftBulbs: $$('.bulb') // optional nodes
  };

  /* ---------- Safely check existence ---------- */
  function el(name){ return DOM[name]; }
  function has(name){ return !!DOM[name]; }

  /* ---------- small typed intro ---------- */
  (function typedIntro(){
    const el = DOM.typed;
    if(!el) return;
    const lines = [
      "RISHI! Today your legend level rises.",
      "May you crush goals, beat odds and celebrate wins.",
      "Make a wish and blow the candles. 🎂"
    ];
    let li=0, ci=0;
    el.textContent = '';
    function step(){
      if(li >= lines.length) return;
      const s = lines[li];
      if(ci < s.length){
        el.textContent += s[ci++];
        setTimeout(step, 34 + Math.random()*36);
      } else { li++; ci = 0; el.textContent += ' '; setTimeout(step, 600); }
    }
    setTimeout(step, 600);
  })();

  /* ---------- confetti (via canvas-confetti if present) ---------- */
  function confettiBurst(opts){
    try{
      if(typeof confetti === 'function'){
        confetti(Object.assign({ particleCount: 100, spread: 90 }, opts||{}));
      }
    }catch(e){}
  }

  /* ---------- lightweight fireworks canvas ---------- */
  const Fireworks = (function(){
    const canvas = DOM.fireworksCanvas;
    if(!canvas) return null;
    const ctx = canvas.getContext('2d');
    let parts = [];
    function size(){
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    size();
    window.addEventListener('resize', size);
    function spawn(x,y,count,cols){
      for(let i=0;i<(count||50);i++){
        parts.push({
          x: x, y: y,
          vx: (Math.random()-0.5)*6,
          vy: (Math.random()-0.9)*6,
          alpha: 1,
          size: 1 + Math.random()*3,
          color: `hsl(${Math.random()*360},80%,60%)`
        });
      }
    }
    function loop(){
      ctx.clearRect(0,0,canvas.width, canvas.height);
      for(let i=parts.length-1;i>=0;i--){
        const p = parts[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.06;
        p.alpha -= 0.01 + Math.random()*0.01;
        if(p.alpha <= 0){ parts.splice(i,1); continue; }
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(loop);
    }
    loop();
    return { spawn };
  })();

  /* ---------- small wrapper to gently fade audio ---------- */
  function fadeAudio(audio, target, duration = 900){
    if(!audio) return Promise.resolve();
    target = clamp(target,0,1);
    const start = audio.volume || 0;
    const delta = target - start;
    if(Math.abs(delta) < 0.01){ audio.volume = target; return Promise.resolve(); }
    const t0 = performance.now();
    return new Promise(res=>{
      function tick(now){
        const t = clamp((now - t0) / duration, 0, 1);
        audio.volume = start + delta * t;
        if(t < 1) requestAnimationFrame(tick);
        else res();
      }
      requestAnimationFrame(tick);
    });
  }

  /* ---------- Wish button ---------- */
  if(has('wishBtn')){
    DOM.wishBtn.addEventListener('click', ()=>{
      confettiBurst();
      try{ if(Fireworks) Fireworks.spawn(window.innerWidth * 0.5, 140, 60); }catch(e){}
    });
  }

  /* ---------- Music button ---------- */
  if(has('musicBtn') && has('bgMusic')){
    const btn = DOM.musicBtn, a = DOM.bgMusic;
    btn.addEventListener('click', ()=>{
      if(a.paused){ safePlay(a); btn.textContent = 'Pause Music ⏸️'; btn.setAttribute('aria-pressed','true'); }
      else { a.pause(); btn.textContent = 'Play Music ▶️'; btn.setAttribute('aria-pressed','false'); }
    });
  }

  /* ---------- Basic legacy intro (bulbs/cake/balloons) safe implementation ---------- */
  (function legacyIntro(){
    // Many old templates relied on specific IDs — we try to be unobtrusive and create the ambiance instead.
    // If the original effect.js from repo had its own heavy logic, this is a lightweight safe version
    // so users still see bulbs -> balloons -> cake feel.
    try{
      // bulbs: small DOM-based glow animation if any bulb elements exist
      const bulbs = $$('.bulb, .bulb-light');
      if(bulbs && bulbs.length){
        bulbs.forEach((b,i)=>{
          b.style.transition = 'opacity 700ms ease, transform 700ms ease';
          b.style.opacity = '0.15';
          setTimeout(()=> b.style.opacity = '0.95', 350 + i*120);
          setInterval(()=> { b.style.transform = `translateY(${Math.sin(Date.now()/1000 + i)*4}px)`; }, 600);
        });
      }
      // balloons visual: create a few floating balloon divs if none exist
      if(!document.querySelector('.floating-balloons')){
        const wrap = document.createElement('div');
        wrap.className = 'floating-balloons';
        wrap.style.pointerEvents = 'none';
        wrap.style.position = 'fixed';
        wrap.style.inset = '0';
        wrap.style.zIndex = 0;
        document.body.appendChild(wrap);
        for(let i=0;i<8;i++){
          const b = document.createElement('div');
          const sz = 30 + Math.random()*80;
          b.style.position = 'absolute';
          b.style.left = `${Math.random()*100}%`;
          b.style.bottom = `-${50 + Math.random()*180}px`;
          b.style.width = `${sz}px`;
          b.style.height = `${sz*1.2}px`;
          b.style.borderRadius = '50%';
          b.style.background = ['#ff6bcb','#6be0ff','#ffd36b','#a78bfa'][Math.floor(Math.random()*4)];
          b.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)';
          b.style.opacity = '0.95';
          b.style.transition = 'transform 14s linear';
          wrap.appendChild(b);
          // animate via requestAnimationFrame loop
          (function(el, delay){
            setTimeout(()=> {
              el.style.transform = `translateY(-140vh) rotate(${Math.random()*360}deg)`;
            }, delay);
          })(b, i*400 + Math.random()*800);
        }
      }
      // cake small pop animation if element exists with .cake
      const cake = document.querySelector('.cake, .birthday-cake, #cake');
      if(cake){
        cake.style.transition = 'transform 800ms cubic-bezier(.2,.8,.2,1), opacity 600ms';
        setTimeout(()=> cake.style.transform = 'translateY(-8px) scale(1.02)', 900);
        setTimeout(()=> cake.style.transform = 'translateY(0) scale(1)', 1800);
      }
    }catch(e){}
  })();

  /* ---------- Slideshow & captions ---------- */
  (function slideshowModule(){
    const overlay = DOM.overlay;
    const slideImg = DOM.slideImg;
    const slideCaption = DOM.slideCaption;
    const btn = DOM.slideshowBtn;
    const endBtn = DOM.endSlides;
    const prev = DOM.prevSlide;
    const next = DOM.nextSlide;
    const music2 = DOM.music2;
    const bgMusic = DOM.bgMusic;

    // slides config (p1..p7 + thankyou)
    const slides = [
      {file:'p1.jpg', msg:"Rishi bhai... tu na alag hi level ka insaan hai 🤌", pan:'left'},
      {file:'p2.jpg', msg:"bhot sari khushiya tere liye... hamesa", pan:'right'},
      {file:'p3.jpg', msg:"tu jesa dost milna mushkil hota h re", pan:'zoom'},
      {file:'p4.jpg', msg:"kabhi kabhi gussa bhi aata, pr phir bhi best tu hi h 😂💙", pan:'left'},
      {file:'p5.jpg', msg:"teri smile... bhai sach me dangerous cute h 😭🔥", pan:'right'},
      {file:'p6.jpg', msg:"teri life me sirf success success aur orr bhi success aaye", pan:'zoom'},
      {file:'p7.jpg', msg:"last me... bas itna ki... i m proud of u bro ❤️", pan:'center'},
      {file:'thankyou.jpg', msg:"Thanks for being you, Rishi. Much love ❤️", pan:'center'}
    ];
    const slideDuration = 2000;
    let index = 0, timer = null, running = false;

    function showOverlay(v){
      if(!overlay) return;
      overlay.classList.toggle('active', !!v);
      overlay.style.display = v ? 'flex' : 'none';
    }
    function applyPan(imgEl, type){
      if(!imgEl) return;
      imgEl.style.transition = 'transform 1.6s cubic-bezier(.2,.8,.2,1), opacity 0.6s ease';
      imgEl.style.opacity = '0';
      // slight delay to set src then animate
      setTimeout(()=> {
        if(type==='left') imgEl.style.transform = 'scale(1.08) translateX(-6%)';
        else if(type==='right') imgEl.style.transform = 'scale(1.08) translateX(6%)';
        else if(type==='zoom') imgEl.style.transform = 'scale(1.12)';
        else imgEl.style.transform = 'scale(1.06)';
        imgEl.style.opacity = '1';
      }, 70);
    }
    function typeCaption(text, el){
      if(!el) return Promise.resolve();
      el.textContent = '';
      return new Promise(res=>{
        let i=0;
        function step(){
          if(i < text.length){
            el.textContent += text[i++];
            if(Math.random() < 0.03){ // intentional tiny typos then fix
              const wrong = String.fromCharCode(97 + Math.floor(Math.random()*26));
              el.textContent += wrong;
              setTimeout(()=> { el.textContent = el.textContent.slice(0,-1); }, 160);
            }
            setTimeout(step, 28 + Math.random()*38);
          } else res();
        }
        step();
      });
    }
    function setSlide(i){
      if(!slideImg) return;
      const s = slides[i] || slides[0];
      slideImg.classList.remove('show');
      // quick crossfade
      setTimeout(()=> {
        slideImg.src = s.file;
        try{ slideCaption.textContent = ''; }catch(e){}
        void slideImg.offsetWidth;
        slideImg.classList.add('show');
        applyPan(slideImg, s.pan);
        typeCaption(s.msg, slideCaption);
      }, 80);
    }
    function startSlides(){
      if(running) return;
      running = true;
      index = 0;
      // fade out bgMusic then start music2
      Promise.resolve()
      .then(()=> fadeAudio(bgMusic, 0, 900).then(()=> { try{ bgMusic.pause(); }catch(e){}; }))
      .then(()=> {
        if(music2){ music2.volume = 0; music2.currentTime = 0; safePlay(music2); }
        try{ setupAnalyserForMusic2(); }catch(e){}
        return fadeAudio(music2, 1, 1200);
      })
      .then(()=> {
        showOverlay(true);
        setSlide(index);
        timer = setInterval(()=> {
          index++;
          if(index >= slides.length){
            runFinale();
            return;
          }
          setSlide(index);
        }, slideDuration);
      });
    }
    function stopSlides(){
      running = false;
      clearInterval(timer);
      showOverlay(false);
      try{ fadeAudio(music2, 0, 900).then(()=>{ try{ music2.pause(); }catch(e){} }); }catch(e){}
      try{ if(window._birthday_audio_ctx){ window._birthday_audio_ctx.close(); window._birthday_audio_ctx=null; } }catch(e){}
      try{ if(DOM.finalText) DOM.finalText.classList.remove('show'); }catch(e){}
    }
    function runFinale(){
      clearInterval(timer);
      index = slides.length - 1;
      setSlide(index);
      setTimeout(()=> {
        // big fireworks
        if(Fireworks){
          for(let i=0;i<6;i++){
            setTimeout(()=> Fireworks.spawn(window.innerWidth*(0.2 + Math.random()*0.6), 130 + Math.random()*200, 60), i*300);
          }
        }
        try{ if(DOM.finalText) DOM.finalText.classList.add('show'); }catch(e){}
        try{ fadeAudio(music2, 0.4, 900); }catch(e){}
        setTimeout(()=> { if(typeof confetti === 'function') confetti({ particleCount:200, spread:160, origin:{ y:0.6 } }); }, 1300);
        setTimeout(()=> { stopSlides(); }, 7000);
      }, 700);
    }

    // Button hooks
    if(btn) btn.addEventListener('click', startSlides);
    if(endBtn) endBtn.addEventListener('click', stopSlides);
    if(prev) prev.addEventListener('click', ()=>{ if(running){ index = Math.max(0, index-1); setSlide(index); }});
    if(next) next.addEventListener('click', ()=>{ if(running){ index = Math.min(slides.length-1, index+1); setSlide(index); }});
  })();

  /* ---------- Audio analyser for heartbeat glow on music2 ---------- */
  function setupAnalyserForMusic2(){
    const music2 = DOM.music2;
    const glow = DOM.heartbeatGlow;
    const finalText = DOM.finalText;
    if(!music2 || !glow) return;
    try{
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      window._birthday_audio_ctx = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      const dataArr = new Uint8Array(analyser.frequencyBinCount);
      const src = ctx.createMediaElementSource(music2);
      src.connect(analyser);
      analyser.connect(ctx.destination);
      // periodic pulse
      const interval = setInterval(()=>{
        analyser.getByteFrequencyData(dataArr);
        let sum = 0;
        for(let i=0;i<8;i++) sum += dataArr[i];
        const avg = sum / 8 / 255;
        if(glow) glow.style.opacity = (0.04 + avg * 0.45).toString();
        if(finalText) finalText.style.transform = `translateX(-50%) scale(${1 + avg*0.06})`;
      }, 120);
      // store for cleanup
      window._birthday_audio_interval = interval;
    }catch(e){}
  }

  /* ---------- small initial confetti for flavor ---------- */
  setTimeout(()=> { try{ confettiBurst({ particleCount: 60, spread: 60 }); }catch(e){} }, 1100);

  /* ---------- expose a tiny API if someone wants to call from HTML console ---------- */
  window._birthday = {
    confetti: confettiBurst,
    fireworks: (x,y)=> { if(Fireworks) Fireworks.spawn(x||window.innerWidth/2, y||120, 120); },
    startSlides: ()=> { try{ const btn = DOM.slideshowBtn; if(btn) btn.click(); }catch(e){} }
  };

  /* ---------- done ---------- */
})();
