const showcase=document.querySelector('.gallery');
const panels=[...showcase.querySelectorAll(':scope > figure')];
panels.forEach(panel=>{const anchor=document.createElement('div');anchor.className='motion-anchor';anchor.setAttribute('aria-hidden','true');panel.before(anchor);});
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let queued=false;
function size(){panels.forEach((panel,i)=>{panel.style.setProperty('--pin-top',`${Math.min(24,innerHeight-panel.offsetHeight-32)}px`);panel.style.zIndex=i+1;});showcase.classList.add('motion-ready');update();}
function update(){queued=false;panels.forEach((panel,i)=>{const next=panels[i+1];const overlap=next?Math.max(0,Math.min(1,(innerHeight-next.getBoundingClientRect().top)/innerHeight)):0;panel.style.setProperty('--shade',reduced.matches?0:overlap*.12);});}
addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(update)}},{passive:true});
addEventListener('resize',size);showcase.addEventListener('load',size,true);reduced.addEventListener('change',size);new ResizeObserver(size).observe(showcase);size();
