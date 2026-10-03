import Papa from 'papaparse';
import readXlsxFile from 'read-excel-file/browser';

export const fields={
 assets:['code','name','system','equipment_type','location','criticality','manufacturer','model'],
 schedule:['external_id','name','start_date','finish_date','level','asset_code','status','predecessor_codes','milestone_code']
};
export const labels={code:'Equipment tag',name:'Name',system:'System',equipment_type:'Equipment type',location:'Location',criticality:'Criticality',manufacturer:'Manufacturer',model:'Model',external_id:'Activity ID',start_date:'Start date',finish_date:'Finish date',level:'Cx level',asset_code:'Equipment tag',status:'Status',predecessor_codes:'Predecessor IDs',milestone_code:'Milestone code'};
export async function parseFile(file){
 if(file.size>10*1024*1024)throw Error('For structured import, use a CSV or XLSX file under 10 MB. Larger source documents can be stored as evidence.');
 let rows;
 if(/\.xlsx$/i.test(file.name)) rows=await readXlsxFile(file);
 else if(/\.csv$/i.test(file.name)){
  const parsed=Papa.parse(await file.text(),{skipEmptyLines:'greedy'});
  if(parsed.errors.length)throw Error('CSV could not be read: '+parsed.errors[0].message);
  rows=parsed.data;
 }else throw Error('Choose a CSV or XLSX export. Upload native schedule files and scripts in Evidence & Sources.');
 rows=rows.filter(r=>r.some(v=>v!==null&&v!==''));
 if(rows.length<2||rows.length>2001)throw Error('Use a header row and between 1 and 2,000 data rows. XLSX imports use the first sheet.');
 const headers=rows[0].map((v,i)=>String(v??'').trim()||'Column '+(i+1));
 if(new Set(headers).size!==headers.length)throw Error('Column names must be unique.');
 return {headers,rows:rows.slice(1)};
}
export function normalizedDate(value){
 if(value==null||value==='')return '';
 const s=value instanceof Date?value.toISOString().slice(0,10):String(value).trim();
 if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||Number.isNaN(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s)throw Error('Dates must use YYYY-MM-DD or Excel date cells. Found: '+s);
 return s;
}
export function mapRows(kind,parsed,mapping,milestoneCodes){
 const seen=new Set();
 return parsed.rows.map((row,i)=>{
  const record={};
  for(const key of fields[kind]){
   const raw=mapping[key]===''||mapping[key]==null?'':row[Number(mapping[key])];
   record[key]=key.endsWith('_date')?normalizedDate(raw):String(raw??'').trim();
  }
  const id=record[kind==='assets'?'code':'external_id'];
  if(!id||!record.name)throw Error('Row '+(i+2)+': ID and name are required.');
  if(seen.has(id))throw Error('Duplicate ID in file: '+id);seen.add(id);
  if(record.start_date&&record.finish_date&&record.finish_date<record.start_date)throw Error('Row '+(i+2)+': finish precedes start.');
  if(record.milestone_code&&!milestoneCodes.includes(record.milestone_code))throw Error('Row '+(i+2)+': unknown milestone '+record.milestone_code);
  return record;
 });
}
export function toCSV(records){return Papa.unparse(records,{escapeFormulae:true});}
