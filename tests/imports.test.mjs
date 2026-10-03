import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mapRows,normalizedDate,parseFile,toCSV} from '../src/records.js';
test('structured imports validate the complete file before producing records',async()=>{
 const file=new File(['code,name\nAHU-01,Air handler\nAHU-02,Second unit'],'equipment.csv',{type:'text/csv'});
 const parsed=await parseFile(file);const result=mapRows('assets',parsed,{code:0,name:1},[]);
 assert.equal(result.length,2);assert.equal(result[0].code,'AHU-01');
 assert.throws(()=>mapRows('assets',{rows:[['A','One'],['A','Two']]},{code:0,name:1},[]),/Duplicate/);
 assert.throws(()=>mapRows('assets',{rows:[['','One']]},{code:0,name:1},[]),/required/);
 await assert.rejects(parseFile(new File(['A,A\n1,2'],'duplicate.csv')),/unique/);
});
test('date and milestone mapping reject ambiguous or invalid source values',()=>{
 assert.equal(normalizedDate(new Date('2026-10-03T00:00:00Z')),'2026-10-03');
 assert.throws(()=>normalizedDate('10/03/26'),/YYYY-MM-DD/);
 assert.throws(()=>normalizedDate('2026-02-30'),/YYYY-MM-DD/);
 assert.throws(()=>mapRows('schedule',{rows:[['A','Test','2026-10-05','2026-10-01']]},{external_id:0,name:1,start_date:2,finish_date:3},[]),/precedes/);
 assert.throws(()=>mapRows('schedule',{rows:[['A','Test','G9']]},{external_id:0,name:1,milestone_code:2},['G0']),/unknown milestone/);
});
test('CSV export neutralizes spreadsheet formula injection',()=>{
 const text=toCSV([{code:'A',title:'=HYPERLINK("https://example.test")'}]);assert(text.includes("'=HYPERLINK"));
});
