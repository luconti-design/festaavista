// Local UI review only. Never deployed; contributions intentionally unavailable.
const fs=require('node:fs'),http=require('node:http');
const url=fs.readFileSync('Config.gs','utf8').match(/const CSV_URL_ = '([^']+)'/)[1];
function parse(csv){let rows=[],row=[],value='',quoted=false;for(let i=0;i<csv.length;i++){const c=csv[i];if(c==='"'){if(quoted&&csv[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(value);value='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&csv[i+1]==='\n')i++;row.push(value);if(row.some(Boolean))rows.push(row);row=[];value='';}else value+=c;}if(value||row.length){row.push(value);rows.push(row);}const head=rows.shift();return rows.map(r=>Object.fromEntries(head.map((h,i)=>[h.replace(/^\uFEFF/,''),r[i]||''])));}
(async()=>{
 const response=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!response.ok)throw new Error('CSV HTTP '+response.status);
 const data={rows:parse(await response.text()),fetchedAt:new Date().toISOString(),stale:false};
 let html=fs.readFileSync('Index.html','utf8').replace(/<\?!= include_\('([^']+)'\); \?>/g,(_,name)=>fs.readFileSync(name+'.html','utf8'));
 const shim=`<script>window.google={script:{run:{withSuccessHandler(success){return {withFailureHandler(failure){return new Proxy({}, {get(_,method){return ()=>{if(method!=='getQuotes'){failure(new Error('Prévia local: contribuições disponíveis após instalar no Apps Script.'));return;}fetch('/quotes').then(r=>r.json()).then(success).catch(failure);};}});}};}}}};</script>`;
 html=html.replace('<head>','<head>'+shim);
 const server=http.createServer((req,res)=>{if(req.url==='/quotes'){res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}else if(req.url==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);}else{res.writeHead(404);res.end();}});
 server.listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173/ · '+data.rows.length+' registros reais em memória · envios desativados'));
})().catch(e=>{console.error(e.message,e.cause?.code||'');process.exit(1);});
