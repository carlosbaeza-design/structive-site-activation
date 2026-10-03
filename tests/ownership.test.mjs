import test from 'node:test';
import assert from 'node:assert/strict';
import {scopeAccess, createOwnership} from '../src/ownership.js';

const base={site:{id:'s',workspace_id:'w'},role:'scoped',userId:'owner-login',manage:false,
 people:[{id:'owner',workspace_id:'w',user_id:'owner-login',display_name:'Scope Sponsor',active:true},{id:'executor',workspace_id:'w',user_id:'executor-login',display_name:'Executor',active:true},{id:'outsider',workspace_id:'w',user_id:'other-login',display_name:'Other scope',active:true}],
 catalog:[{code:'SEC',name:'Physical Security'},{code:'OPS',name:'Operations'}],
 data:{site_verticals:[{vertical_code:'SEC',owner_person_id:'owner'},{vertical_code:'OPS',owner_person_id:'outsider'}],vertical_team:[{vertical_code:'SEC',person_id:'executor'}],tasks:[],milestones:[],requirement_milestones:[]}};
const ui={esc:v=>String(v??''),heading:(a,b)=>a+b,button:(a,b)=>`<button data-action="${b}">${a}</button>`,table:(heads,rows)=>heads.join('|')+rows.join(''),badge:v=>String(v),select:(name,label,opts)=>`${name}:${opts}`,options:(rows)=>rows.map(r=>r.id).join(',')};
test('individual sign-in selects ownership, executor and suspended views',()=>{
 assert.equal(scopeAccess(base).owner,true);
 assert.equal(scopeAccess({...base,userId:'executor-login'}).owner,false);
 assert.equal(scopeAccess({...base,userId:'unknown'}).person,undefined);
 assert.equal(scopeAccess({...base,people:base.people.map(p=>({...p,active:false}))}).owner,false);
 assert.equal(scopeAccess({...base,site:{workspace_id:'another-workspace'}}).owner,false);
});
test('scope delegation includes self and team, excludes unrelated people',()=>{
 const owner=createOwnership({state:()=>base,ui});
 const task={vertical:'Physical Security'};
 assert.equal(owner.canAssign(task),true);
 assert.equal(owner.canAssign({vertical:'Operations'}),false);
 assert.equal(owner.assigneeSelect(task),'assigned_person_id:owner,executor');
 const executor=createOwnership({state:()=>({...base,userId:'executor-login'}),ui});
 assert.equal(executor.canAssign(task),false);
});
test('owner and executor dashboards explain execution without site acceptance claims',()=>{
 const owner=createOwnership({state:()=>base,ui}).dashboard();
 const executor=createOwnership({state:()=>({...base,userId:'executor-login'}),ui}).dashboard();
 assert.match(owner,/Scope owner workspace/);
 assert.match(owner,/SEC · Physical Security/);
 assert.match(executor,/Executor workspace/);
 assert.doesNotMatch(executor,/Need a task owner/);
 assert.match(executor,/authorized gate decisions determine site acceptance/);
});
