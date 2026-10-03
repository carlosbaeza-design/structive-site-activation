import {test} from 'node:test';
import assert from 'node:assert/strict';
import {milestoneSnapshot,snapshotMarkup} from '../src/milestone-help.js';
import {guideTopics,resolveGuide} from '../src/help-content.js';
import {journey} from '../src/dashboard.js';
const saved={milestones:[{id:'m',code:'L3',planned_date:null}],tasks:[{id:'t',requirement_id:'q',status:'Not Started'},{id:'na',requirement_id:'excluded',status:'Complete'}],requirements:[{id:'q',applicability:'Required'},{id:'excluded',applicability:'Not Applicable'}],requirement_milestones:[{milestone_id:'m',requirement_id:'q'},{milestone_id:'m',requirement_id:'excluded'}]};
test('all timeline stages have definitions before setup, including an instantiated but untouched site',()=>{
 for(const [code] of journey)assert.equal(milestoneSnapshot(code,null,{}).configured,false);
 assert.equal(milestoneSnapshot('L3',{id:'site'},saved).configured,false);
 assert.equal(milestoneSnapshot('unknown',null,{}),null);
});
test('saved snapshots exclude inapplicable work and retain authoritative degraded acceptance',()=>{
 const data=structuredClone(saved);data.milestones[0].planned_date='2026-10-08';data.tasks[0]={...data.tasks[0],status:'Complete',owner:'Site owner'};
 data.evaluations=[{milestone_id:'m',state:'Degraded',verified:0,total:1,critical_open:1,reasons:['Current evidence expired']}];
 data.assuranceSummary=[{stage:'L3',applicable:true,confirmed:false,population:4,documents:0,document_required:4,observations:0,field_required:1,open_findings:1}];
 const s=milestoneSnapshot('L3',{id:'site'},data);
 assert.equal(s.configured,true);assert.equal(s.count,1);assert.equal(s.complete,1);assert.equal(s.assigned,1);assert.equal(s.planned,'2026-10-08');assert.equal(s.evaluation.state,'Degraded');assert.equal(s.qa.confirmed,false);
 delete data.evaluations;
 assert.equal(milestoneSnapshot('L3',{id:'site'},data).evaluation,null);
});
test('snapshot renders saved server text safely and labels evaluation gaps',()=>{
 const esc=v=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 const data=structuredClone(saved);data.milestones[0].planned_date='2026-10-08';
 let html=snapshotMarkup(milestoneSnapshot('L3',{id:'site'},data),esc);assert.match(html,/Evaluation unavailable/);
 data.evaluations=[{milestone_id:'m',state:'Not Eligible',verified:0,total:1,reasons:['<script>bad()</script>']}];
 html=snapshotMarkup(milestoneSnapshot('L3',{id:'site'},data),esc);assert.ok(!html.includes('<script>'));assert.match(html,/&lt;script&gt;/);
});
test('each active screen, setup step and milestone resolves to usable guidance',()=>{
 for(const key of ['setup','equipment','schedule','milestones','tasks','capabilities','evidence','assurance','reviews','readiness','history',...Array.from({length:5},(_,i)=>'setup-'+(i+1))])assert.ok(guideTopics[key]?.steps.length>=3);
 for(const [code] of journey)assert.match(resolveGuide('gate:'+code).title,new RegExp('^'+code));
});
