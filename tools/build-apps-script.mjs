import fs from 'node:fs';
import path from 'node:path';
const web=path.resolve('dist/web'),out=path.resolve('dist/apps-script');
fs.mkdirSync(out,{recursive:true});
// Delete generated files only, in this exact build directory. Never touch sources or credentials.
for(const file of fs.readdirSync(out)){if(/\.(html|gs)$/.test(file)||file==='appsscript.json')fs.unlinkSync(path.join(out,file));}
let html=fs.readFileSync(path.join(web,'index.html'),'utf8');
function asset(url){const target=path.resolve(web,url.replace(/^\.\//,''));if(!target.startsWith(web+path.sep))throw new Error('Invalid build asset path');return fs.readFileSync(target,'utf8');}
const scripts=[...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g)];
if(scripts.length!==1)throw new Error('Expected one Vite JavaScript entry');
const js=asset(scripts[0][1]).replace(/<\/script/gi,'<\\/script');
fs.writeFileSync(path.join(out,'JavaScript.html'),'<script type="module">\n'+js+'\n</script>');
html=html.replace(scripts[0][0],"<?!= include_('JavaScript'); ?>");
let css='';html=html.replace(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g,(_,url)=>{css+=asset(url)+'\n';return '';});
if(!css)throw new Error('No Vite stylesheet found');
fs.writeFileSync(path.join(out,'Styles.html'),'<style>\n'+css.replace(/<\/style/gi,'<\\/style')+'\n</style>');
html=html.replace('</head>',"<?!= include_('Styles'); ?></head>");
if(/(?:src|href)="(?:\.\/)?assets\//.test(html)||/DEMO LOCAL|LOCAL-MOCK/.test(js))throw new Error('Unpacked asset or development mock leaked into production');
fs.writeFileSync(path.join(out,'Index.html'),html);
for(const file of fs.readdirSync('apps-script'))if(file.endsWith('.gs')||file==='appsscript.json')fs.copyFileSync(path.join('apps-script',file),path.join(out,file));
console.log('Apps Script build: '+out+' (React + CSS inline, backend separado)');
