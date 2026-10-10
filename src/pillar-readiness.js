import {activeCriteria,criterionCredit} from './program-model.js';
import {acceptanceRecommendation} from './acceptance-summary.js';

// Pillar guidance evaluates this pillar's evidence. Building-wide QA, inputs and
// milestone dependencies remain in the building recommendation.
const defined = (c,p) => !!(p?.owner && c.owner && c.reviewer && c.criterion?.trim() && c.milestoneIds?.length && Number.isFinite(Number(c.weight)) && Number(c.weight)>0 && !(c.activities||[]).some(a=>!a.owner));
const verified = (c,p) => defined(c,p) && !!criterionCredit(c) && (!c.requiresLink || !!c.links?.length) && !(c.activities||[]).some(a=>a.status!=='Complete');

export function pillarAssessment(program,code) {
  const pillar=program.pillars[code],applicable=program.selected.includes(code);
  const items=applicable?activeCriteria(program).filter(c=>c.pillar===code):[];
  const scoped={...program,selected:applicable?[code]:[],criteria:items.map(c=>verified(c,pillar)?c:{...c,status:'Not started'}),sampling:[],audits:[],inputs:[]};
  let recommendation=acceptanceRecommendation(scoped);
  if(!recommendation.result.blockers.length && items.some(c=>!defined(c,pillar))) recommendation={...recommendation,tone:'neutral',label:'Assessment Incomplete',reason:'Define the pillar criteria, owners, reviewers and activity assignments before an acceptance recommendation can be made.'};
  const minimum=items.filter(c=>c.mvpRequired===true),passed=minimum.filter(c=>verified(c,pillar)).length;
  const statement=typeof pillar?.mvpStatement==='string'?pillar.mvpStatement.trim():'';
  const gaps=[];
  if(!applicable)gaps.push('Pillar is outside the selected scope.');
  if(!statement)gaps.push('Write the minimum this pillar must deliver.');
  if(!minimum.length)gaps.push('Mark the criteria required for this pillar’s MVP.');
  if(!pillar?.owner)gaps.push('Assign a pillar owner.');
  if(minimum.some(c=>!defined(c,pillar)))gaps.push('Define the MVP criteria and their owners and reviewers.');
  const open=minimum.filter(c=>!verified(c,pillar));
  const mvp=gaps.length?{tone:'neutral',label:'MVP Not Defined',reason:gaps.join(' ')}:
    open.length?{tone:'red',label:'MVP Not Met',reason:open.length+' minimum requirement'+(open.length===1?' remains':'s remain')+' unverified.'}:
    {tone:'green',label:'MVP Met',reason:'All customer-selected minimum requirements are verified. Other acceptance gates still apply.'};
  return {code,score:recommendation.result.score,recommendation,items,mvp:{...mvp,statement,count:minimum.length,passed,open,defined:!gaps.length,met:!gaps.length&&!open.length},gates:recommendation.result.blockers};
}

export function pillarMVPRollup(program) {
  const pillars=program.selected.map(code=>pillarAssessment(program,code));
  return {pillars,total:pillars.length,met:pillars.filter(p=>p.mvp.met).length,blocked:pillars.filter(p=>p.mvp.defined&&!p.mvp.met).length,undefined:pillars.filter(p=>!p.mvp.defined).length,ready:pillars.length>0&&pillars.every(p=>p.mvp.met)};
}
