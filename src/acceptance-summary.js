import {activeCriteria,criterionCredit,readiness,samplingStats} from './program-model.js';

// Display guidance only. The customer's authorized acceptance workflow remains authoritative.
export function acceptanceRecommendation(program,milestoneId='') {
  const result=readiness(program,milestoneId);
  const items=activeCriteria(program).filter(c=>!milestoneId||c.milestoneIds.includes(milestoneId));
  const sampling=program.sampling.filter(s=>Number(s.percent)>0&&(!milestoneId||s.stage===milestoneId));
  const remaining=items.filter(c=>!criterionCredit(c)).length+sampling.filter(s=>!samplingStats(program,s).complete).length;
  if(result.blockers.length) return {tone:'red',label:'Do Not Accept',reason:result.blockers.length+' gating item'+(result.blockers.length===1?' is':'s are')+' unresolved. Readiness score does not override gates.',result,remaining};
  const missingDefinition=items.some(c=>!c.owner||!c.reviewer||!c.criterion?.trim()||!c.milestoneIds?.length||!program.pillars[c.pillar]?.owner||!Number.isFinite(Number(c.weight))||Number(c.weight)<=0);
  const missingQA=sampling.some(s=>!s.owner||!s.reviewer||!s.explicitPopulation||Number(s.population)<=0);
  const unknownMilestone=milestoneId&&!program.milestones.some(m=>m.id===milestoneId);
  if(!result.hasBasis||result.missingPillars||missingDefinition||missingQA||unknownMilestone) return {tone:'neutral',label:'Assessment Incomplete',reason:'Define the applicable criteria, inspection scope and accountable people before an acceptance recommendation can be made.',result,remaining};
  if(remaining) return {tone:'amber',label:'Accept With Risk',reason:'Configured gates are clear, but non-gating gaps remain. Customer risk review and approval are required before acceptance.',result,remaining};
  return {tone:'green',label:'Full Acceptance',reason:'All applicable criteria and inspection requirements are satisfied. The customer records the acceptance decision.',result,remaining};
}
