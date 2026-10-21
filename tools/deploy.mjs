import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
if(!fs.existsSync('.clasp.json'))throw new Error('Configure o ID: npm run gas:configure -- SCRIPT_ID. Depois: npm run gas:login.');
const config=JSON.parse(fs.readFileSync('.clasp.json','utf8'));
if(config.rootDir!=='dist/apps-script')throw new Error('rootDir deve ser dist/apps-script para não enviar fontes ou arquivos privados.');
const pkg=JSON.parse(fs.readFileSync('node_modules/@google/clasp/package.json','utf8'));
const bin=typeof pkg.bin==='string'?pkg.bin:pkg.bin.clasp;
const cli=path.resolve('node_modules/@google/clasp',bin);
function run(args){const r=spawnSync(process.execPath,[cli,...args],{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
run(['push']);
const existing=fs.existsSync('.local/deployment.json')?JSON.parse(fs.readFileSync('.local/deployment.json','utf8')).deploymentId:null;
if(existing)run(['deploy','--deploymentId',existing,'--description','festa à vista. React/Vite']);
else {run(['deploy','--description','festa à vista. React/Vite']);console.log('Primeira implantação criada. Execute install_ no editor e confira o acesso Eu / Qualquer pessoa. Salve o ID retornado com npm run gas:configure -- SCRIPT_ID DEPLOYMENT_ID antes da próxima publicação para preservar a URL.');}
