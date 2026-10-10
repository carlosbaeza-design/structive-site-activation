import {explainField} from './field-help-content.js';

export function installFieldHelp(doc=document) {
 const win=doc.defaultView, fields=new WeakMap();
 let sequence=0,active=null,pinned=false,hideTimer,queued=false,destroyed=false;
 const tip=doc.createElement('div');
 tip.id='threshold-field-tip';tip.className='field-help-popover';tip.setAttribute('role','tooltip');tip.hidden=true;
 doc.body.append(tip);
 function hide(){clearTimeout(hideTimer);if(active)fields.get(active)?.button.setAttribute('aria-expanded','false');tip.hidden=true;active=null;pinned=false;}
 function show(control,pin=false){
  const field=fields.get(control);if(!field||!control.isConnected)return;
  clearTimeout(hideTimer);if(active&&active!==control)fields.get(active)?.button.setAttribute('aria-expanded','false');
  active=control;pinned=pin;field.button.setAttribute('aria-expanded','true');
  const host=control.closest('dialog')||doc.body;if(tip.parentNode!==host)host.append(tip);
  const title=doc.createElement('strong'),body=doc.createElement('p');title.textContent=field.label;body.textContent=field.help;
  tip.replaceChildren(title,body);tip.hidden=false;
  const r=field.wrapper.getBoundingClientRect(),width=win.innerWidth||doc.documentElement.clientWidth||360,height=win.innerHeight||800;
  tip.style.maxWidth=Math.min(360,width-24)+'px';tip.style.left=Math.max(12,Math.min(r.left,width-tip.offsetWidth-12))+'px';
  const above=r.top-tip.offsetHeight-8,below=r.bottom+8;
  tip.style.top=Math.max(12,Math.min(below+tip.offsetHeight<=height-12?below:above,height-tip.offsetHeight-12))+'px';
 }
 function scheduleHide(){if(pinned)return;clearTimeout(hideTimer);hideTimer=setTimeout(()=>{
  const f=fields.get(active);if(!f||(!f.wrapper.contains(doc.activeElement)&&!f.wrapper.matches(':hover')&&!tip.matches(':hover')))hide();
 },180);}
 function enhance(control){
  if(fields.has(control)||['hidden','submit','button','reset'].includes(control.type))return;
  const label=control.closest('label')||[...control.labels||[]][0];
  const labelCopy=label?.cloneNode(true);labelCopy?.querySelectorAll('input,select,textarea').forEach(node=>node.remove());
  const labelText=(labelCopy?.textContent||control.getAttribute('aria-label')||control.name||control.id).trim().replace(/\s+/g,' ');
  const hint=explainField({name:control.name||control.id,label:labelText,type:control.type,formId:control.form?.id,dataset:control.dataset});
  const wrapper=doc.createElement(label?'div':'span');wrapper.className='field-with-help'+(control.type==='checkbox'?' field-help-check':'')+(!label?' field-help-compact':'');
  const target=label||control;target.before(wrapper);wrapper.append(target);
  if(label){
   const caption=doc.createElement('span');caption.className='field-help-caption';
   const content=[...label.childNodes].filter(node=>node!==control&&!node.contains?.(control));
   if(content.length){const first=content[0];first.before(caption);content.forEach(node=>caption.append(node));}
  }
  const id='threshold-field-description-'+(++sequence),description=doc.createElement('span');description.id=id;description.hidden=true;description.textContent=hint.text;
  const ids=new Set((control.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean));ids.add(id);control.setAttribute('aria-describedby',[...ids].join(' '));
  const button=doc.createElement('button');button.type='button';button.className='field-help-button';button.textContent='?';button.setAttribute('aria-label','About '+labelText);button.setAttribute('aria-describedby',id);button.setAttribute('aria-controls',tip.id);button.setAttribute('aria-expanded','false');
  wrapper.append(button,description);wrapper.dataset.fieldHelp=String(sequence);control.dataset.fieldHelpKind=hint.kind;
  fields.set(control,{wrapper,button,help:hint.text,label:labelText});
 }
 function refresh(){if(destroyed)return;doc.querySelectorAll('input,select,textarea').forEach(enhance);if(active&&!active.isConnected)hide();}
 function fieldAt(target){const wrapper=target.closest?.('.field-with-help');return wrapper?.querySelector('input,select,textarea');}
 const listeners=[];
 function on(target,event,handler,capture=false){target.addEventListener(event,handler,capture);listeners.push(()=>target.removeEventListener(event,handler,capture));}
 on(doc,'pointerover',e=>{if(e.pointerType==='touch')return;const control=fieldAt(e.target);if(control&&!pinned)show(control);else if(tip.contains(e.target))clearTimeout(hideTimer);});
 on(doc,'pointerout',e=>{if(fieldAt(e.target)||tip.contains(e.target))scheduleHide();});
 on(doc,'focusin',e=>{const control=fieldAt(e.target);if(control&&!pinned)show(control);});
 on(doc,'focusout',e=>{if(fieldAt(e.target))scheduleHide();});
 on(doc,'click',e=>{
  const button=e.target.closest?.('.field-help-button');if(button){e.preventDefault();const control=fieldAt(button);active===control&&pinned?hide():show(control,true);return;}
  if(!fieldAt(e.target)&&!tip.contains(e.target))hide();
 });
 on(doc,'keydown',e=>{if(e.key==='Escape'&&active){hide();e.preventDefault();e.stopPropagation();}},true);
 on(doc,'scroll',()=>hide(),true);on(win,'resize',hide);
 const observer=new win.MutationObserver(()=>{if(queued||destroyed)return;queued=true;queueMicrotask(()=>{queued=false;refresh();});});
 observer.observe(doc.body,{childList:true,subtree:true});refresh();
 return {refresh,destroy(){destroyed=true;observer.disconnect();listeners.forEach(off=>off());hide();tip.remove();}};
}
