const fs=require('node:fs'),vm=require('node:vm');
for(const name of fs.readdirSync('apps-script'))if(name.endsWith('.gs'))new vm.Script(fs.readFileSync('apps-script/'+name,'utf8'),{filename:name});
JSON.parse(fs.readFileSync('apps-script/appsscript.json','utf8'));
console.log('Sintaxe do backend Apps Script e manifesto: OK');
