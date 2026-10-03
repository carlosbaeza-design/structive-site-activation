import {customerRoles} from "./commercial.js";
export function scopeAccess({site,data,people,userId,role}) {
 const person=people.find(p=>p.workspace_id===site?.workspace_id&&p.user_id===userId&&p.active);
 const owned=(data.site_verticals||[]).filter(v=>v.owner_person_id===person?.id&&person);
 return {person,owned,scoped:role==='scoped',owner:owned.length>0};
}
export function executionSummary(tasks,today=new Date().toISOString().slice(0,10)) {
 const open=tasks.filter(t=>t.status!=='Complete');
 return {total:tasks.length,complete:tasks.length-open.length,unassigned:open.filter(t=>!t.assigned_person_id).length,
  blocked:open.filter(t=>t.status==='Blocked').length,overdue:open.filter(t=>t.due_date&&t.due_date<today).length,
  submitted:open.filter(t=>t.status==='Submitted').length};
}

export function createOwnership({state,ui,rpc,notice}) {
 const {esc,heading,button,table,badge,input,area,select,check,opt,options,modal,form,save,read}=ui;
 const access=()=>scopeAccess(state());
 const codeFor=name=>state().catalog.find(v=>v.name===name)?.code||'';
 const scopeFor=t=>(state().data.site_verticals||[]).find(v=>v.vertical_code===codeFor(t.vertical));
 const personName=id=>state().people.find(p=>p.id===id)?.display_name||'Unassigned';
 const label=p=>`${p.display_name}${p.active?'':' · Suspended'}${p.user_id?'':' · Awaiting first sign-in'}`;
 const canAssign=t=>state().manage||access().owned.some(v=>v.vertical_code===codeFor(t.vertical));
 const candidates=t=>{
  const {data,people,site}=state(),scope=scopeFor(t);
  const ids=new Set([scope?.owner_person_id,...(data.vertical_team||[]).filter(x=>x.vertical_code===codeFor(t.vertical)).map(x=>x.person_id)]);
  return people.filter(p=>p.workspace_id===site?.workspace_id&&p.active&&ids.has(p.id));
 };
 function assignmentFields(t) {
  const scope=scopeFor(t);
  return `<div class="ownership-context"><span class="scope-code">${esc(codeFor(t.vertical))}</span><span>Scope owner / sponsor <strong>${esc(personName(scope?.owner_person_id))}</strong></span></div>`;
 }
 function assigneeSelect(t) {
  const choices=candidates(t);
  const current=state().people.find(p=>p.id===t.assigned_person_id);
  if(current&&!choices.some(p=>p.id===current.id))choices.push(current);
  return select('assigned_person_id','Task owner',options(choices,t.assigned_person_id,label,'Unassigned'))+
   (!t.assigned_person_id&&t.owner?`<p class="help">Existing owner label: ${esc(t.owner)}. Select a person to link this work to their login.</p>`:'');
 }
 function scopeCard(v) {
  const {data}=state(),tasks=data.tasks.filter(t=>t.vertical===v.name),s=executionSummary(tasks);
  const scope=data.site_verticals.find(x=>x.vertical_code===v.code);
  return `<article class="scope-card"><div class="row between"><span class="scope-code">${esc(v.code)}</span>${state().manage?button('Assign scope','scope-edit',v.code,'link'):''}</div><h2>${esc(v.name)}</h2><p class="scope-owner">Scope owner / sponsor<strong>${esc(personName(scope?.owner_person_id))}</strong></p><div class="scope-counts"><span><b>${s.total}</b> tasks</span><span><b>${s.unassigned}</b> need an assignee</span><span><b>${s.blocked}</b> blocked</span></div></article>`;
 }
 function teamView() {
  const {site,workspaceId,data,people,catalog,manage}=state(),a=access();
  const visible=catalog.filter(v=>(data.site_verticals||[]).some(s=>s.vertical_code===v.code));
  const roster=people.filter(p=>p.workspace_id===(site?.workspace_id||workspaceId));
  return heading(manage?'Scopes & People':a.owner?'My scope & team':'My scope','Each vertical has one accountable scope owner. Task owners carry out the individual work.')+
   `<div class="row between"><p class="muted">${site?visible.length+' coded verticals':'Create a site to assign its coded verticals'} · Scope ownership and task execution are assigned separately.</p>${manage?button('Authorize a person','person-new','',''):''}</div>`+
   `<div class="scope-grid">${visible.map(scopeCard).join('')}</div><section class="card"><div class="row between"><h2>${manage?'Authorized people':'People in your scope'}</h2><span class="muted">Individual email sign-in</span></div>`+
   table(['Person','Login email','Customer role','Access state',''],roster.map(p=>`<tr><td>${esc(p.display_name)}</td><td>${esc(p.email)}</td><td>${esc(customerRoles.find(x=>x[0]===p.access_role)?.[1]||p.access_role||"Team member")}</td><td>${badge(!p.active?'Suspended':p.user_id?'Login linked':'Awaiting first sign-in')}</td><td>${manage?button('Edit','person-edit',p.id,'link'):''}</td></tr>`))+
   `<p class="help">An authorized person uses their own email to sign in. Access follows their scope and task assignments. Scope owners can assign tasks to themselves or their team.</p></section>`;
 }
 function dashboard() {
  const {data,catalog,people}=state(),a=access(),s=executionSummary(data.tasks);
  const ownedCodes=a.owned.map(v=>v.vertical_code),first=catalog.find(v=>v.code===ownedCodes[0]);
  const title=a.owner?(ownedCodes.length===1?`${first?.code} · ${first?.name}`:'Your scopes, in focus.'):'Your work, in focus.';
  const summary=a.owner?'Plan and coordinate the work you own. Your personal assignments are included.':'Your assigned work, deadlines, blockers and evidence.';
  const priority=data.tasks.filter(t=>t.status!=='Complete').sort((x,y)=>Number(y.status==='Blocked')-Number(x.status==='Blocked')||(x.due_date||'9999').localeCompare(y.due_date||'9999')).slice(0,10);
  const milestones=data.milestones.map(m=>{
   const reqs=new Set(data.requirement_milestones.filter(x=>x.milestone_id===m.id).map(x=>x.requirement_id));
   const tasks=data.tasks.filter(t=>reqs.has(t.requirement_id));
   return {...m,tasks,stats:executionSummary(tasks)};
  }).filter(m=>m.tasks.length);
  return `<div class="page-heading"><div><div class="eyebrow">${a.owner?'Scope owner workspace':'Executor workspace'}</div><h1>${esc(title)}</h1><p class="sub">${esc(summary)}</p></div>${button('Open task register','my-register','','')}</div>`+
   `<div class="grid four ownership-metrics"><article class="card"><small>Visible tasks</small><strong>${s.total}</strong><span>${s.complete} complete · ${s.submitted} submitted</span></article><article class="card"><small>${a.owner?'Need a task owner':'Assigned to you'}</small><strong>${a.owner?s.unassigned:s.total}</strong><span>${a.owner?'Unassigned open work':'Your individual responsibility'}</span></article><article class="card"><small>Blocked</small><strong>${s.blocked}</strong><span>Open issues to resolve</span></article><article class="card"><small>Overdue</small><strong>${s.overdue}</strong><span>Open work past its due date</span></article></div>`+
   `<section class="card"><div class="row between"><h2>Work by milestone</h2><span class="muted">Your scope’s task progress</span></div><div class="scope-milestones">${milestones.map(m=>`<div><strong>${esc(m.code)}</strong><span>${m.stats.complete} / ${m.stats.total} complete</span><small>${esc(m.planned_date||'Date not set')}</small></div>`).join('')||'<p>No milestones are mapped to your assigned work yet.</p>'}</div><p class="help">These counts describe execution. Verified evidence and authorized gate decisions determine site acceptance.</p></section>`+
   `<section class="card"><div class="row between"><h2>${a.owner?'Scope work queue':'Your next actions'}</h2>${button('View all tasks','my-register','','link')}</div>`+
   table(['Task','Task owner','Due','Status',''],priority.map(t=>`<tr><td><span class="mono">${esc(t.code)}</span><small class="wrap">${esc(t.title)}</small></td><td>${esc(t.assigned_person_id?personName(t.assigned_person_id):'Unassigned')}</td><td>${esc(t.due_date||'Not set')}</td><td>${badge(t.status)}</td><td>${button('Open','task',t.id,'link')}</td></tr>`),'No open tasks assigned to this view.')+'</section>';
 }
 function personModal(id) {
  if(!state().manage)throw Error('Workspace administrator required.');
  const {people,site,workspaceId}=state(),p=people.find(x=>x.id===id)||{};
  modal(p.id?'Update authorized person':'Authorize a person',form('person-edit',`<p class="muted">Authorize a unique email, then assign the person to a vertical. Scope ownership grants the owner view; individual task assignments drive the executor view.</p><div class="grid two">${input('display_name','Name',p.display_name||'','text','required maxlength="150"')}${input('email','Login email',p.email||'','email',`required autocomplete="off" ${p.id?'readonly':''}`)}</div>${state().role==='admin'?select('access_role','Customer role',customerRoles.map(([value,label])=>opt(value,label,p.access_role||'scoped')).join('')):''}${p.id?check('active','Access is active',p.active):''}<p class="help">This saves authorization. The person requests their own sign-in link from the Threshold login page.</p>`,p.id?'Save person':'Authorize person'));
  document.querySelector('#person-edit').onsubmit=e=>{e.preventDefault();const v=read(e.target);save(e.target,()=>rpc('save_customer_person',{workspace_id:site?.workspace_id||workspaceId,person_id:p.id||null,display_name:v.display_name,email:v.email,active:p.id?!!v.active:true,access_role:v.access_role||p.access_role||'scoped'}),'Person saved. Assign their scope and share the Threshold sign-in page.');};
 }
 function scopeModal(code) {
  if(!state().manage)throw Error('Site administrator required.');
  const {site,data,catalog,people}=state(),v=catalog.find(x=>x.code===code),s=data.site_verticals.find(x=>x.vertical_code===code);
  const roster=people.filter(p=>p.workspace_id===site.workspace_id&&p.active);
  const team=data.vertical_team.filter(x=>x.vertical_code===code).map(x=>x.person_id);
  modal(`${code} · ${v.name}`,form('scope-edit',`${select('owner_person_id','Scope owner / sponsor',options(roster,s.owner_person_id,label,'Assign a scope owner'))}<p class="help">The scope owner sees every task in ${esc(code)} and can assign work to themselves or the team below. Final verification and site acceptance retain their existing authorities.</p><h3>People who can receive tasks</h3><div class="grid two">${roster.map(p=>check('team:'+p.id,label(p),team.includes(p.id))).join('')||'<p>Authorize a person first.</p>'}</div><p class="help">Reassign a person’s tasks before removing them from this team.</p>`));
  document.querySelector('#scope-edit').onsubmit=e=>{e.preventDefault();const v=read(e.target);save(e.target,()=>rpc('save_vertical_scope',{site_id:site.id,vertical_code:code,owner_person_id:v.owner_person_id||null,team_ids:roster.filter(p=>v['team:'+p.id]).map(p=>p.id),expected_revision:s.revision}));};
 }
 const categoryNames=['Security','Availability','Confidentiality','Processing Integrity','Privacy'];
 function socView() {
  const {data,manage}=state(),p=data.site_soc_profiles?.[0],mapped=data.tasks.filter(t=>t.soc_refs?.length);
  return heading('SOC 2 assurance','Set the report target and connect the agreed criteria to accountable execution work.')+
   `<section class="card"><div class="row between"><h2>${p&&p.report_type!=='None'?'SOC 2 · '+esc(p.report_type):'SOC 2 target not selected'}</h2>${manage?button('Configure target','soc-edit','',''):''}</div>`+
   `<p>${esc(p?.scope_description||'A program administrator defines the services, systems and criteria in scope with the examining CPA firm.')}</p><div class="row">${(p?.categories||[]).map(badge).join('')}</div>`+
   (p?.report_type==='Type 2'?`<p>Observation period: ${esc(p.period_start)} to ${esc(p.period_end)}</p>`:'')+
   (p?.target_date?`<p>Target date: ${esc(p.target_date)}</p>`:'')+
   `<p class="help">Type 1 addresses the design of controls at a specified date. Type 2 also addresses operating effectiveness over a specified period. This workspace tracks preparation and evidence; the examining CPA firm determines the report outcome.</p></section>`+
   `<section class="card"><h2>Criteria mapped to your visible work</h2><p class="muted">Add the agreed criterion references in each task, such as CC6.4. Assign a task owner and retain its evidence through the normal workflow.</p>`+
   table(['Task','Vertical','Criteria references','Task owner','Status',''],mapped.map(t=>`<tr><td class="wrap">${esc(t.code)}<small>${esc(t.title)}</small></td><td>${esc(codeFor(t.vertical))}</td><td>${esc(t.soc_refs.join(', '))}</td><td>${esc(t.assigned_person_id?personName(t.assigned_person_id):'Unassigned')}</td><td>${badge(t.status)}</td><td>${button('Open','task',t.id,'link')}</td></tr>`),'No tasks have criterion references yet.')+
   `<p class="help">Criteria can span SEC, ITOT, GOV, OPS, MNT, BCM and other verticals. Task mappings require review against your agreed scope; a completed task count is not a SOC attestation.</p><a href="https://www.aicpa-cima.com/resources/landing/system-and-organization-controls-soc-suite-of-services" target="_blank" rel="noopener noreferrer">AICPA SOC resources and Trust Services Criteria ↗</a></section>`;
 }
 function socModal() {
  if(!state().manage)throw Error('Site administrator required.');
  const {site,data}=state(),p=data.site_soc_profiles?.[0]||{report_type:'None',categories:['Security'],revision:0};
  modal('SOC 2 report target',form('soc-edit',`<div class="grid two">${select('report_type','Report target',['None','Type 1','Type 2'].map(x=>opt(x,x==='None'?'No SOC 2 target':'SOC 2 '+x,p.report_type)).join(''))}${input('target_date','Target date',p.target_date||'','date')}</div>${area('scope_description','Services, systems and organizational boundary',p.scope_description||'','maxlength="4000"')}<h3>Trust Services Criteria categories</h3><p class="help">Security is included for SOC 2. Select additional categories within the agreed examination scope.</p><div class="grid two">${categoryNames.map(c=>check('category:'+c,c,p.categories.includes(c))).join('')}</div><div class="grid two">${input('period_start','Type 2 period start',p.period_start||'','date')}${input('period_end','Type 2 period end',p.period_end||'','date')}</div>`));
  document.querySelector('#soc-edit').onsubmit=e=>{e.preventDefault();const v=read(e.target);save(e.target,()=>rpc('save_soc_profile',{site_id:site.id,expected_revision:p.revision,values_json:{report_type:v.report_type,categories:categoryNames.filter(c=>v['category:'+c]),target_date:v.target_date,period_start:v.period_start,period_end:v.period_end,scope_description:v.scope_description}}));};
 }
 return {access,canAssign,candidates,assignmentFields,assigneeSelect,teamView,dashboard,socView,
  handle:(name,id)=>{if(name==='person-new')return personModal();if(name==='person-edit')return personModal(id);if(name==='scope-edit')return scopeModal(id);if(name==='soc-edit')return socModal();}};
}
