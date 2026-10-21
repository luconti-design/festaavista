import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const url=fs.readFileSync('apps-script/Config.gs','utf8').match(/const CSV_URL_ = '([^']+)'/)[1];
const response=await fetch(url,{signal:AbortSignal.timeout(45000)});
if(!response.ok)throw new Error('Não foi possível consultar o CSV público: '+response.status);
// Reuse the existing CSV parser rather than creating a second interpretation.
const source=ts.transpileModule(fs.readFileSync('src/services/localApi.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const context={exports:{}};vm.runInNewContext(source,context);
const rows=context.exports.parseCsv(await response.text());
fs.mkdirSync('.local',{recursive:true});
fs.writeFileSync('.local/share-preview-data.json',JSON.stringify({rows,fetchedAt:new Date().toISOString(),stale:false}));
console.log('Prévia: '+rows.length+' registros públicos consultados agora; nenhum dado privado.');
