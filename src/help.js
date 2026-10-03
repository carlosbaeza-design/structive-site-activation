import {resolveGuide} from './help-content.js';
import {milestoneSnapshot,snapshotMarkup} from './milestone-help.js';

export function createHelp({state,esc}) {
 let context='setup',opened=false,returnFocus=null,trigger=null,tipCode='',pinned=false,hideTimer;
 try {opened=localStorage.getItem('structive-guide-open')==='true';} catch {}
 const $=s=>document.querySelector(s);
 function article(actions=true) {
  const t=resolveGuide(context);
  return `<p class="guide-purpose">${esc(t.purpose)}</p><h3>How to use this screen</h3><ol>${t.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><div class="guide-result"><h3>What the result means</h3><p>${esc(t.result)}</p></div>${actions&&t.next?`<button type="button" class="secondary guide-next" data-route="${esc(t.next[0])}">Open ${esc(t.next[1])} →</button>`:''}`;
 }
 function refresh(){
  if(!$('#reference-panel'))return;
  $('#reference-title').textContent=resolveGuide(context).title;
  $('#reference-body').innerHTML=article();
  $('#reference-body').scrollTop=0;
 }
 function setContext(key){if(context===key)return;context=key;refresh();}
 function mount(){
  if(!$('#reference-root'))document.body.insertAdjacentHTML('beforeend',`<div id="reference-root"><button type="button" id="guide-launcher" class="guide-launcher" aria-controls="reference-panel" aria-expanded="false"><span aria-hidden="true">?</span> User guide</button><aside id="reference-panel" class="reference-panel" aria-labelledby="reference-title" hidden><div class="reference-head"><div><span class="eyebrow">THRESHOLD · USER GUIDE</span><h2 id="reference-title" tabindex="-1" aria-live="polite"></h2></div><button type="button" class="guide-close" aria-label="Close user guide">×</button></div><div id="reference-body" class="reference-body"></div><div class="reference-foot">Guidance follows your active screen or milestone.</div></aside><div id="milestone-tip" class="milestone-tip" role="tooltip" hidden></div></div>`);
  $('#reference-root').hidden=false;refresh();applyOpen();
 }
 function applyOpen(){if(!$('#reference-panel'))return;$('#reference-panel').hidden=!opened;$('#guide-launcher').setAttribute('aria-expanded',String(opened));$('#guide-launcher').hidden=opened;}
 function toggle(open){
  opened=open;hideTip();applyOpen();
  try {localStorage.setItem('structive-guide-open',String(opened));} catch {}
  if(open){returnFocus=document.activeElement;$('#reference-title')?.focus();}
  else (returnFocus?.isConnected?returnFocus:$('#guide-launcher'))?.focus();
 }
 function hide(){hideTip();if($('#reference-root'))$('#reference-root').hidden=true;}
 function inline(){const t=resolveGuide(context);return `<details class="dialog-reference"><summary>User guide · ${esc(t.title)}</summary>${article(false)}</details>`;}
 function hideTip(){clearTimeout(hideTimer);if(trigger){trigger.removeAttribute('aria-describedby');if(trigger.hasAttribute('data-gate-peek'))trigger.setAttribute('aria-expanded','false');}if($('#milestone-tip'))$('#milestone-tip').hidden=true;trigger=null;tipCode='';pinned=false;}
 function positionTip(){
  const tip=$('#milestone-tip');if(!trigger?.isConnected||!tip||tip.hidden){hideTip();return;}
  const r=trigger.getBoundingClientRect(),w=tip.offsetWidth,h=tip.offsetHeight,vw=document.documentElement.clientWidth,vh=window.innerHeight;
  const left=Math.max(12,Math.min(r.left+r.width/2-w/2,vw-w-12));
  let top=r.bottom+10;if(top+h>vh-12)top=r.top-h-10;
  tip.style.left=`${left}px`;tip.style.top=`${Math.max(12,Math.min(top,vh-h-12))}px`;
 }
 function showTip(element,pin=false){
  const code=element.dataset.gateTip;const {site,data}=state();const s=milestoneSnapshot(code,site,data);
  if(!s)return;clearTimeout(hideTimer);
  if(trigger&&trigger!==element){trigger.removeAttribute('aria-describedby');if(trigger.hasAttribute('data-gate-peek'))trigger.setAttribute('aria-expanded','false');}
  trigger=element;tipCode=code;pinned=pin;
  const tip=$('#milestone-tip');if(!tip)return;
  tip.innerHTML=snapshotMarkup(s,esc);tip.hidden=false;
  element.setAttribute('aria-describedby','milestone-tip');if(element.hasAttribute('data-gate-peek'))element.setAttribute('aria-expanded','true');
  positionTip();
 }
 function scheduleHide(){if(pinned)return;clearTimeout(hideTimer);hideTimer=setTimeout(()=>{if(!$('#milestone-tip')?.matches(':hover')&&!trigger?.matches(':hover')&&document.activeElement!==trigger)hideTip();},180);}
 document.addEventListener('click',e=>{
  if(e.target.closest('#guide-launcher')){toggle(true);return;}
  if(e.target.closest('.guide-close')){toggle(false);return;}
  const b=e.target.closest('[data-gate-peek]');
  if(b){e.preventDefault();const close=pinned&&tipCode===b.dataset.gateTip;close?hideTip():showTip(b,true);}
 });
 document.addEventListener('pointerover',e=>{if(e.pointerType==='touch')return;const b=e.target.closest('[data-gate-tip]');if(b){if(!pinned)showTip(b);}else if(e.target.closest('#milestone-tip'))clearTimeout(hideTimer);});
 document.addEventListener('pointerout',e=>{if(e.target.closest('[data-gate-tip],#milestone-tip'))scheduleHide();});
 document.addEventListener('focusin',e=>{const b=e.target.closest('[data-gate-tip]');if(b&&!pinned)showTip(b);});
 document.addEventListener('focusout',e=>{if(e.target.closest('[data-gate-tip]'))scheduleHide();});
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('[data-gate-tip],#milestone-tip'))hideTip();});
 document.addEventListener('keydown',e=>{if(e.key!=='Escape'||$('#dialog')?.open)return;if(trigger){hideTip();e.preventDefault();return;}if(opened){toggle(false);e.preventDefault();}});
 document.addEventListener('scroll',e=>{if(e.target!==$('#milestone-tip'))hideTip();},true);
 window.addEventListener('resize',hideTip);
 return {mount,hide,inline,setContext,hideTip};
}
