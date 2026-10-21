const fs=require('node:fs'),path=require('node:path');
const dir=path.resolve('dist','apps-script');fs.mkdirSync(dir,{recursive:true});
for(const name of fs.readdirSync('.'))if(/\.(gs|html)$/.test(name)||name==='appsscript.json')fs.copyFileSync(name,path.join(dir,name));
console.log('Arquivos para implantação: '+dir);
