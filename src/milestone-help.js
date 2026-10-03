import {gateDefinitions} from './help-content.js';
import {scopedRecords} from './dashboard.js';

export function milestoneSnapshot(code,site,data) {
 const definition=gateDefinitions[code];
 if(!definition)return null;
 const base={code,...definition,configured:false};
 const milestone=data.milestones?.find(m=>m.code===code);
 if(!site||!milestone)return base;
 const scoped=scopedRecords(data,milestone.id);
 const requirements=new Map((data.requirements||[]).map(q=>[q.id,q]));
 const tasks=scoped.tasks.filter(t=>requirements.get(t.requirement_id)?.applicability!=='Not Applicable');
 const taskIds=new Set(tasks.map(t=>t.id));
 const configured=!!(site.setup_confirmed||data.site_dashboard_config?.[0]?.settings?.setup_reviewed||milestone.planned_date||milestone.actual_date||milestone.source_activity||tasks.some(t=>t.owner?.trim()||t.due_date||(t.status&&t.status!=='Not Started'))||(data.evidence||[]).some(e=>e.milestone_id===milestone.id||taskIds.has(e.task_id)));
 if(!configured)return base;
 return {...base,configured:true,planned:milestone.planned_date||null,actual:milestone.actual_date||null,
  evaluation:data.evaluations?.find(g=>g.milestone_id===milestone.id)||null,
  count:tasks.length,complete:tasks.filter(t=>t.status==='Complete').length,
  assigned:tasks.filter(t=>t.owner?.trim()).length,blocked:tasks.filter(t=>t.status==='Blocked').length,
  qa:data.assuranceSummary?.find(s=>s.stage===code)||null};
}

export function snapshotMarkup(snapshot,esc) {
 if(!snapshot)return '';
 const s=snapshot,g=s.evaluation;
 const line=(label,value)=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`;
 return `<div class="tip-kicker">${s.configured?'Saved milestone snapshot':'Milestone definition'}</div><h3>${esc(s.code)} · ${esc(s.title)}</h3><p>${esc(s.definition)}</p>${s.configured?`<dl>${line('Gate status',g?.state||'Evaluation unavailable')}${line('Planned',s.planned||'Date not set')}${s.actual?line('Actual date',s.actual):''}${line('Tasks complete',`${s.complete} / ${s.count}`)}${line('Owners assigned',`${s.assigned} / ${s.count}`)}${line('Blocked tasks',s.blocked)}${g?line('Requirements satisfied',`${g.verified} / ${g.total}`)+line('Open critical requirements',g.critical_open??'Not reported'):''}${s.qa?(s.qa.applicable?line('QA population',`${s.qa.population} events · ${s.qa.confirmed?'confirmed':'needs confirmation'}`)+line('QA document reviews',`${s.qa.documents} / ${s.qa.document_required}`)+line('QA field observations',`${s.qa.observations} / ${s.qa.field_required}`)+line('QA open findings',s.qa.open_findings):line('Stage QA','Not applicable')):''}</dl>${g?.reasons?.length?`<div class="tip-reason"><b>Current constraints</b><ul>${g.reasons.slice(0,2).map(r=>`<li>${esc(r)}</li>`).join('')}</ul></div>`:''}<small>Saved records only. Task progress and dates do not confer acceptance.</small>`:'<small>Set up the site and milestone to see its saved status here. The site’s approved requirements govern acceptance.</small>'}`;
}
