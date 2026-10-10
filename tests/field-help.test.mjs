import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {JSDOM} from 'jsdom';
import {explainField,labelHelp} from '../src/field-help-content.js';import {installFieldHelp} from '../src/field-help.js';
test('field copy covers every literal input label and keeps explanations short and free of em dashes',async()=>{
 const missing=[],covered=new Set();
 for(const file of ['app.js','program.js','ownership.js','commercial.js','overview.js']){
  const source=await readFile(new URL('../src/'+file,import.meta.url),'utf8');
  for(const match of source.matchAll(/\b(?:input|area|select|check|number|personSelect|choices)\(\s*(["'])([^"']+)\1\s*,\s*(["'])([^"']+)\3/g)){
   const name=match[2],label=match[4];const hint=explainField({name,label});covered.add(label);if(hint.kind==='fallback')missing.push(file+': '+name+' / '+label);
  }
 }
 assert.deepEqual(missing,[]);assert(covered.size>150);
 for(const [label,copy] of Object.entries(labelHelp)){assert(!copy.includes('\u2014'),label);assert(copy.length<290,label);assert(!/\b(?:leverage|delve|foster|seamless|holistic)\b/i.test(copy),label);}
 assert.match(explainField({label:'Acceptance authority'}).text,/person your company allows/);
 assert.match(explainField({label:'Acceptance authority / delegation reference'}).text,/does not grant portal permissions/);
});
test('hover, keyboard, tap and dynamic fields retain form semantics and work inside a dialog',async()=>{
 const dom=new JSDOM('<body><form id="setup"><label>Acceptance authority<select name="approver"><option value="a">Named approver</option></select></label><label class="check"><input name="critical" type="checkbox">Customer considers this critical</label><label>Observed result / review rationale<textarea name="resultNote">Existing result</textarea></label></form><dialog open></dialog></body>',{pretendToBeVisual:true});
 const d=dom.window.document,help=installFieldHelp(d),control=d.querySelector('select'),form=d.querySelector('form');
 assert.equal(control.dataset.fieldHelpKind,'exact');assert.equal(d.querySelector('textarea').dataset.fieldHelpKind,'exact');
 const described=d.getElementById(control.getAttribute('aria-describedby'));assert.match(described.textContent,/person your company allows/);
 assert.deepEqual(Object.fromEntries(new dom.window.FormData(form)),{approver:'a',resultNote:'Existing result'});
 const button=control.closest('.field-with-help').querySelector('button'),tip=d.querySelector('#threshold-field-tip');
 control.dispatchEvent(new dom.window.Event('pointerover',{bubbles:true}));assert.equal(tip.hidden,false);assert.match(tip.textContent,/approve a milestone/);
 control.focus();assert.equal(tip.hidden,false);button.click();assert.equal(button.getAttribute('aria-expanded'),'true');
 button.click();assert.equal(tip.hidden,true);button.focus();assert.equal(tip.hidden,false);
 const escape=new dom.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true});button.dispatchEvent(escape);assert.equal(tip.hidden,true);assert.equal(escape.defaultPrevented,true);
 const checkbox=form.querySelector('input');checkbox.closest('.field-with-help').querySelector('button').click();assert.equal(checkbox.checked,false);
 const dialog=d.querySelector('dialog');dialog.innerHTML='<form><label>Actual measured value<input type="number" name="actual"></label></form>';
 await new Promise(r=>setTimeout(r,0));const dynamic=dialog.querySelector('input');assert(dynamic.getAttribute('aria-describedby'));const local=dynamic.closest('.field-with-help').querySelector('button');
 d.body.click();local.click();assert.equal(tip.parentElement,dialog);assert.equal(tip.hidden,false);assert.match(tip.textContent,/number actually observed/);
 const count=d.querySelectorAll('.field-help-button').length;help.refresh();assert.equal(d.querySelectorAll('.field-help-button').length,count);
 help.destroy();dom.window.close();
});
