// Executive metrics are informative. Server-side gate eligibility is deliberately independent.
export const journey=[['L1','Factory review'],['L2','Installation review'],['L3','Start-up assurance'],['L4','Functional assurance'],['L5','Integrated assurance'],['G2','Operations MVP'],['G4','Building handoff'],['G5','Stabilization exit'],['G6','Steady state']];
export const steps=['Site basis','Delivery team','Sources & dates','QA coverage','Review & launch'];
export function defaultSettings(){return {commissioning_model:'In-house',operations_model:'Owner-operated',operations_establishment:'Establish new operations',construction_model:'GC / CM-led',owner_org:'',cx_org:'',operator_org:'',gc_org:'',setup_step:1,setup_reviewed:false,population_confirmed:{L3:false,L4:false,L5:false},assurance:{L3:{applicable:true,document_pct:100,field_pct:20},L4:{applicable:true,document_pct:100,field_pct:25},L5:{applicable:true,document_pct:100,field_pct:25}},document_level:3,field_level:4,max_open_findings:0,qualifiers:'Expand observation for critical, first-of-kind, or adverse-finding cases.',weights:{priorities:{Low:1,Medium:2,High:3,Critical:5},verticals:{},milestones:{}},assignment_defaults:{}};}
export function settingsFor(data){return structuredClone(data.site_dashboard_config?.[0]?.settings||defaultSettings());}
export function scopedRecords(data,milestoneId=''){
 const requirements=new Set((data.requirement_milestones||[]).filter(x=>!milestoneId||x.milestone_id===milestoneId).map(x=>x.requirement_id));
 const code=data.milestones?.find(m=>m.id===milestoneId)?.code;
 return {tasks:(data.tasks||[]).filter(t=>!milestoneId||requirements.has(t.requirement_id)),activities:(data.schedule_activities||[]).filter(a=>!milestoneId||a.milestone_id===milestoneId||(/^L[1-5]$/.test(code||'')&&a.level===code))};
}
export function workMetrics(data,settings,milestoneId=''){
 const required=new Map(data.requirements.map(q=>[q.id,q]));
 const rows=scopedRecords(data,milestoneId).tasks.filter(t=>required.get(t.requirement_id)?.applicability!=='Not Applicable');
 const milestoneCode=new Map(data.milestones.map(m=>[m.id,m.code]));let total=0,done=0;
 for(const t of rows){const codes=[...new Set(data.requirement_milestones.filter(x=>x.requirement_id===t.requirement_id).map(x=>milestoneCode.get(x.milestone_id)).filter(Boolean))];const weight=settings.weights;const mw=codes.length?codes.reduce((s,c)=>s+(weight.milestones[c]??1),0)/codes.length:1;const w=(weight.priorities[t.priority]??1)*(weight.verticals[t.vertical]??1)*mw;total+=w;if(t.status==='Complete'&&required.get(t.requirement_id)?.applicability==='Required')done+=w;}
 return {count:rows.length,complete:rows.filter(t=>t.status==='Complete').length,percent:total?Math.round(done/total*1000)/10:null,assigned:rows.filter(t=>t.owner?.trim()).length,critical:rows.filter(t=>required.get(t.requirement_id)?.critical&&t.status!=='Complete').length,blocked:rows.filter(t=>t.status==='Blocked').length};
}
export function coveragePreview(data,settings){return ['L3','L4','L5'].map(stage=>{const p=settings.assurance[stage],population=(data.assurance_scope||[]).filter(x=>x.stage===stage).length;return {stage,population,applicable:p.applicable,document_required:Math.ceil(population*p.document_pct/100),field_required:Math.ceil(population*p.field_pct/100),document_target:p.document_pct,field_target:p.field_pct};});}
