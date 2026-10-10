import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeProgram} from '../src/program-model.js';
import {acceptanceRecommendation} from '../src/acceptance-summary.js';

function fixture(){
 const d=makeProgram({owner:'owner'});d.selected=['OPS'];d.pillars.OPS.owner='owner';
 d.criteria=[{id:'coverage',pillar:'OPS',title:'Shift coverage',criterion:'Five people per shift',owner:'owner',reviewer:'reviewer',milestoneIds:['MVP'],weight:1,gating:true,status:'Passed',kind:'number',expected:5,actual:5,comparison:'atLeast',activities:[]}];
 return d;
}
test('recommendation stays red even when readiness rounds to 100 percent',()=>{
 const d=fixture();d.criteria.push({...d.criteria[0],id:'gate',weight:0.0001,actual:3});
 const result=acceptanceRecommendation(d);assert.equal(result.result.score,100);assert.equal(result.label,'Do Not Accept');assert.equal(result.tone,'red');
});
test('unconfigured scope, missing owners and unknown milestones cannot produce acceptance',()=>{
 assert.equal(acceptanceRecommendation(makeProgram()).tone,'neutral');
 const d=fixture();assert.equal(acceptanceRecommendation(d,'HANDOFF').tone,'neutral');
 assert.equal(acceptanceRecommendation(d,'unknown').tone,'neutral');
 d.criteria[0].reviewer='';assert.equal(acceptanceRecommendation(d).tone,'neutral');
});
test('nongating gaps require risk review and do not count as full acceptance',()=>{
 const d=fixture();d.criteria.push({...d.criteria[0],id:'nongating',gating:false,status:'Not started'});
 const result=acceptanceRecommendation(d);assert.equal(result.label,'Accept With Risk');assert.match(result.reason,/risk review and approval/);assert.equal(d.decisions.length,0);
});
test('recommendation follows milestone scope without changing acceptance decisions',()=>{
 const d=fixture();d.criteria.push({...d.criteria[0],id:'handoff',milestoneIds:['HANDOFF'],actual:3});
 assert.equal(acceptanceRecommendation(d,'MVP').label,'Full Acceptance');
 assert.equal(acceptanceRecommendation(d,'HANDOFF').label,'Do Not Accept');
 assert.equal(d.milestones.find(m=>m.id==='MVP').acceptedAt,'');
});
test('QA definition and nongating failed inspections remain visible in recommendations',()=>{
 const d=fixture(),s=d.sampling.find(s=>s.stage==='L3');Object.assign(s,{percent:20,population:10,explicitPopulation:true,owner:'auditor',reviewer:'reviewer',gating:false});
 assert.equal(acceptanceRecommendation(d,'L3').tone,'amber');
 d.audits=[{stage:'L3',status:'Passed'},{stage:'L3',status:'Passed'}];assert.equal(acceptanceRecommendation(d,'L3').tone,'green');
 d.audits.push({stage:'L3',status:'Failed'});assert.equal(acceptanceRecommendation(d,'L3').tone,'amber');
 s.gating=true;assert.equal(acceptanceRecommendation(d,'L3').tone,'red');
});
