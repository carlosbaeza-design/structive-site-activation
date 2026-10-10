import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeProgram} from '../src/program-model.js';
import {pillarAssessment,pillarMVPRollup} from '../src/pillar-readiness.js';
function fixture(){
 const d=makeProgram({owner:'owner'});d.selected=['OPS','SEC'];
 for(const code of d.selected)Object.assign(d.pillars[code],{owner:'owner',mvpStatement:'Minimum '+code+' coverage verified.'});
 d.criteria=d.selected.map(code=>({id:code,pillar:code,title:'Coverage',criterion:'Five people on each shift',owner:'owner',reviewer:'reviewer',milestoneIds:['MVP'],weight:1,gating:true,mvpRequired:true,status:'Passed',kind:'number',expected:5,actual:5,comparison:'atLeast',activities:[],links:[]}));
 return d;
}
test('pillar recommendation excludes other pillars and building-wide QA gates',()=>{
 const d=fixture();d.criteria[1].actual=3;Object.assign(d.sampling[2],{percent:20,population:10,gating:true});
 assert.equal(pillarAssessment(d,'OPS').score,100);assert.equal(pillarAssessment(d,'OPS').recommendation.label,'Full Acceptance');
 assert.equal(pillarAssessment(d,'SEC').recommendation.label,'Do Not Accept');
 assert.equal(pillarMVPRollup(d).met,1);assert.equal(pillarMVPRollup(d).blocked,1);
});
test('MVP can be met before full readiness without clearing other acceptance gates',()=>{
 const d=fixture();d.criteria.push({...d.criteria[0],id:'remaining',mvpRequired:false,gating:false,status:'Not started'});
 let a=pillarAssessment(d,'OPS');assert.equal(a.score,50);assert.equal(a.recommendation.label,'Accept With Risk');assert.equal(a.mvp.label,'MVP Met');
 d.criteria.at(-1).gating=true;a=pillarAssessment(d,'OPS');assert.equal(a.recommendation.label,'Do Not Accept');assert.equal(a.mvp.label,'MVP Met');assert.match(a.mvp.reason,/Other acceptance gates still apply/);
});
test('high rounded score cannot hide an unmet MVP minimum',()=>{
 const d=fixture();d.criteria.push({...d.criteria[0],id:'tiny',weight:.00001,actual:3});
 const a=pillarAssessment(d,'OPS');assert.equal(a.score,100);assert.equal(a.recommendation.tone,'red');assert.equal(a.mvp.tone,'red');assert.equal(a.mvp.passed,1);assert.equal(a.mvp.count,2);
});
test('undefined, unselected and legacy MVPs never receive a green badge',()=>{
 const d=fixture();delete d.pillars.OPS.mvpStatement;assert.equal(pillarAssessment(d,'OPS').mvp.label,'MVP Not Defined');
 d.pillars.OPS.mvpStatement=' ';d.criteria[0].critical=true;delete d.criteria[0].mvpRequired;assert.equal(pillarAssessment(d,'OPS').mvp.count,0);
 d.selected=['SEC'];assert.equal(pillarAssessment(d,'OPS').score,null);assert.equal(pillarAssessment(d,'OPS').mvp.met,false);
 d.selected=[];assert.equal(pillarMVPRollup(d).ready,false);
});
test('MVP requires defined ownership, required references and completed contributions',()=>{
 const d=fixture(),c=d.criteria[0];c.requiresLink=true;assert.equal(pillarAssessment(d,'OPS').mvp.met,false);
 c.links=[{url:'https://example.test/roster'}];assert.equal(pillarAssessment(d,'OPS').mvp.met,true);
 c.activities=[{owner:'auditor',status:'In progress'}];assert.equal(pillarAssessment(d,'OPS').mvp.met,false);
 c.activities[0].status='Complete';assert.equal(pillarAssessment(d,'OPS').mvp.met,true);
 c.reviewer='';assert.equal(pillarAssessment(d,'OPS').mvp.label,'MVP Not Defined');
});
