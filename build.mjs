import {build} from 'esbuild';
import {mkdir,copyFile,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await mkdir('dist',{recursive:true});
await build({entryPoints:['src/app.js'],bundle:true,minify:true,format:'esm',outfile:'dist/app.js',target:['es2022'],legalComments:'linked'});
for(const f of ['style.css','config.json'])await copyFile(f,'dist/'+f);
let html=await readFile('index.html','utf8');
for(const file of ['app.js','style.css']){
 const version=createHash('sha256').update(await readFile('dist/'+file)).digest('hex').slice(0,12);
 html=html.replace(new RegExp('\\./'+file.replaceAll('.','\\.')+'(?:\\?v=[a-f0-9]+)?','g'),'./'+file+'?v='+version);
}
await writeFile('dist/index.html',html);
