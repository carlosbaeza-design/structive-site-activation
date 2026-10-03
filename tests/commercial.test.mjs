import test from 'node:test';
import assert from 'node:assert/strict';
import {customerTotals,licenseLabel,customerRoles,createCommercial} from '../src/commercial.js';
test('vendor totals separate internal verification from paying customers',()=>{
 assert.deepEqual(customerTotals([{internal:true,active:true,used_users:10,used_sites:4},{internal:false,active:true,used_users:3,used_sites:1},{internal:false,active:false,used_users:2,used_sites:1}]),{customers:2,active:1,users:5,sites:2});
});
test('customer roles never expose platform ownership',()=>{
 assert.equal(customerRoles.some(([role])=>['vendor','platform_admin'].includes(role)),false);
 assert.equal(customerRoles.filter(([role])=>role==='admin').length,1);
 assert.equal(licenseLabel({suspended:true,status:'active',active:false}),'Suspended');
 assert.equal(licenseLabel({status:'active',active:false}),'Access period ended');
});
test('suspended account keeps billing explanation and hides setup mutations',()=>{
 const account={workspace_id:'w',name:'Customer',role:'admin',plan:'Plan',billing_source:'stripe',status:'canceled',active:false,max_users:5,max_sites:1,used_users:2,used_sites:1};
 const ui={esc:v=>String(v??''),heading:(a,b)=>a+b,button:(name,action)=>`<button data-action="${action}">${name}</button>`};
 const html=createCommercial({state:()=>({workspaceId:'w',commerce:{accounts:[account]}}),ui}).accountView();
 assert.match(html,/saved records are retained/);assert.match(html,/commercial-portal/);assert.doesNotMatch(html,/data-action="new-site"/);
});
