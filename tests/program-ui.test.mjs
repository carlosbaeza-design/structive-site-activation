import {test} from 'node:test';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';import {readFile} from 'node:fs/promises';
test('trial wizard configures a gated criterion, reuses assignments and links directory',async()=>{
 const dom=new JSDOM(await readFile(new URL('../index.html',import.meta.url),'utf8'),{url:'https://threshold.test/#try',pretendToBeVisual:true});
 for(const key of ['window','document','location','history','sessionStorage','localStorage','FormData','HTMLElement','Element','HTMLDialogElement'])globalThis[key]=dom.window[key];
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};dom.window.HTMLElement.prototype.scrollIntoView=function(){};
 await import('../src/app.js');const $=s=>document.querySelector(s),tick=()=>new Promise(r=>setTimeout(r,30));await tick();
 async function click(selector){const el=$(selector);assert(el,'Missing '+selector);el.click();await tick();}
 async function submit(selector){const f=$(selector);assert(f);f.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await tick();}
 await click('[data-action=program-step][data-id="1"]');const p=$('[data-program-pillar=OPS]');p.checked=true;p.dispatchEvent(new dom.window.Event('change',{bubbles:true}));await tick();
 await click('[data-action=program-pillar-settings][data-id=OPS]');$('#program-pillar-settings [name=owner]').selectedIndex=2;await submit('#program-pillar-settings');
 await click('[data-action=program-step][data-id="2"]');await click('[data-action=program-defaults]');const d=$('#program-defaults');d.elements.owner.selectedIndex=3;d.elements.reviewer.selectedIndex=4;d.elements.provider.value='Third-party operator';d.elements.mile_MVP.checked=true;await submit('#program-defaults');
 await click('[data-action=program-new-criterion]');const c=$('#program-criterion');assert(c.elements.owner.value);assert.equal(c.elements.provider.value,'Third-party operator');assert.equal(c.elements.mile_MVP.checked,true);assert.equal(c.elements.gating.value,'');c.elements.title.value='Qualified shift coverage';c.elements.criterion.value='Five qualified people per shift';c.elements.kind.value='number';c.elements.expected.value='5';c.elements.gating.value='true';c.elements.requiresLink.checked=true;
 await click('[data-action=program-add-link]');$('#program-links [name=link-title]').value='Shift roster';$('#program-links [name=link-url]').value='https://example.test/roster';await submit('#program-criterion');assert.equal($('#dialog').open,false);
 let saved=JSON.parse(sessionStorage.getItem('threshold-trial'));assert.equal(saved.context.document.criteria.length,1);assert.equal(saved.context.document.criteria[0].gating,true);
 await click('[data-action=program-result]');$('#program-result [name=status]').value='Passed';$('#program-result [name=actual]').value='3';$('#program-result [name=resultNote]').value='Only three verified';await submit('#program-result');assert.equal($('#dialog').open,true);assert.match($('#form-error').textContent,/satisfying/);
 $('#program-result [name=actual]').value='5';await submit('#program-result');assert.equal($('#dialog').open,false);
 await click('[data-action=program-new-criterion]');await click('[data-action=program-same-previous]');assert.equal($('#program-criterion [name=provider]').value,'Third-party operator');await click('[data-action=close]');
 await click('[data-route=program-directory]');const link=$('.document-tree a');assert.equal(link.getAttribute('target'),'_blank');assert.match(link.href,/roster/);assert.match($('.document-tree').textContent,/Operations/);
 await click('[data-route=setup]');assert.match($('#content').textContent,/100%/);assert.match($('#content').textContent,/Threshold owner/);
 dom.window.close();
});
