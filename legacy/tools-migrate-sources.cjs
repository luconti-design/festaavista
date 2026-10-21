const fs=require('node:fs');
fs.mkdirSync('apps-script',{recursive:true});fs.mkdirSync('legacy',{recursive:true});fs.mkdirSync('src/styles',{recursive:true});
for(const file of fs.readdirSync('.').filter(f=>f.endsWith('.gs')||f==='appsscript.json')) {
 fs.copyFileSync(file,'apps-script/'+file);if(fs.readFileSync(file).equals(fs.readFileSync('apps-script/'+file)))fs.unlinkSync(file);
}
for(const file of ['Index.html','Styles.html','Domain.html','Client.html'])if(fs.existsSync(file)) {
 fs.copyFileSync(file,'legacy/'+file);
 if(file==='Styles.html')fs.writeFileSync('src/styles/global.css',fs.readFileSync(file,'utf8').replace(/^<style>\s*/, '').replace(/<\/style>\s*$/,''));
 if(fs.readFileSync(file).equals(fs.readFileSync('legacy/'+file)))fs.unlinkSync(file);
}
for(const file of ['README.md','docs/DECISOES.md','docs/VALIDACAO.md'])if(fs.existsSync(file))fs.copyFileSync(file,'legacy/'+file.replaceAll('/','-'));
console.log('Backend separado; fontes anteriores e documentação preservadas em legacy/.');
