const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const files=['Config.gs','SheetsService.gs','DriveService.gs','ContributionsService.gs','UploadsService.gs','AdminService.gs'];
const properties=new Map([['SUBMISSION_SECRET','test-secret'],['CONTRIBUTIONS_SHEET_ID','private-sheet'],['UPLOADS_FOLDER_ID','private-folder']]);
let csvTable=[],fetchCount=0,fetchFails=false,backup=null;
const cache=new Map();
const ctx=vm.createContext({console,Date,Utilities:{parseCsv:()=>csvTable,base64Decode:s=>[...Buffer.from(s,'base64')],computeHmacSha256Signature:(s,k)=>crypto.createHmac('sha256',k).update(s).digest(),base64EncodeWebSafe:b=>Buffer.from(b).toString('base64url'),getUuid:()=>crypto.randomUUID()},PropertiesService:{getScriptProperties:()=>({getProperty:k=>properties.get(k)||null,setProperty:(k,v)=>properties.set(k,v)})},CacheService:{getScriptCache:()=>({get:k=>cache.get(k)??null,put:(k,v)=>cache.set(k,v)})},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},UrlFetchApp:{fetch:()=>{fetchCount++;if(fetchFails)throw new Error('network');return {getResponseCode:()=>200,getContentText:()=> 'csv'};}},DriveApp:{getFileById:()=>({setContent:s=>{backup=s;},getBlob:()=>({getDataAsString:()=>backup})})}});
for(const f of files)vm.runInContext(fs.readFileSync('apps-script/'+f,'utf8'),ctx,{filename:f});
function payload(){const t={token:crypto.randomUUID(),issued:Date.now()-3000,expires:Date.now()-3000+1800000};t.signature=ctx.signContribution_(t.token,t.issued,t.expires);return {type:'manual',ticket:t,name:'Casa teste',city:'Niterói',guests:'80',year:'2027',price:'8000.50',truth:true,consent:true,files:[]};}
test('all internal and admin functions private; RPC surface fixed',()=>{const source=fs.readdirSync('apps-script').filter(f=>f.endsWith('.gs')).map(f=>fs.readFileSync('apps-script/'+f,'utf8')).join('\n');const publicFns=[...source.matchAll(/^function (\w+)\(/gm)].map(m=>m[1]).filter(n=>!n.endsWith('_'));assert.deepEqual(publicFns.sort(),['beginContribution','doGet','getQuotes','submitContribution','uploadContributionChunk'].sort());});
test('backend accepts manual and validates mandatory fields',()=>{assert.equal(ctx.validateContribution_(payload()).data.price,'8000.50');for(const key of ['name','city','guests','year','price']){const p=payload();p[key]='';assert.throws(()=>ctx.validateContribution_(p));}for(const key of ['truth','consent']){const p=payload();p[key]=false;assert.throws(()=>ctx.validateContribution_(p));}});
test('tampering, honeypot and expired ticket rejected',()=>{for(const mutate of [p=>p.website='spam',p=>p.ticket.signature='bad',p=>p.ticket.expires=0,p=>p.files=[{}]]){const p=payload();mutate(p);assert.throws(()=>ctx.validateContribution_(p));}});
test('documents require attachment, type, signature and size',()=>{const p=payload();p.type='documents';assert.throws(()=>ctx.validateContribution_(p));const f={name:'proposta.pdf',type:'application/pdf',data:Buffer.from('%PDF-1.4\ntest').toString('base64')};const original=ctx.resolveUploadedFile_;ctx.resolveUploadedFile_=()=>({});p.files=[{uploadId:'a'.repeat(30)}];assert.equal(ctx.validateContribution_(p).files.length,1);ctx.resolveUploadedFile_=original;assert.throws(()=>ctx.validateAttachment_({...f,data:Buffer.from('not a PDF').toString('base64')}));assert.throws(()=>ctx.validateAttachment_({...f,name:'x.exe'}));assert.throws(()=>ctx.validateAttachment_({...f,data:'a'.repeat(13981024)}));p.files=[f,f,f,f];assert.throws(()=>ctx.validateContribution_(p));});
test('spreadsheet formula injection escaped',()=>{for(const s of ['=IMPORTXML("x")','+1','@x','-1','\t=1'])assert.ok(ctx.sheetText_(s).startsWith("'"));assert.equal(ctx.sheetText_('Nome'),'Nome');});
test('CSV invalid headers, width, empty and HTML rejected',()=>{csvTable=[['Wrong'],['x']];assert.throws(()=>ctx.parseOfficialCsv_('csv'));assert.throws(()=>ctx.parseOfficialCsv_('<html>'));csvTable=[['Nome da casa','Cidade','Quantidade de convidados','Ano da festa','Valor','Condição do valor']];assert.throws(()=>ctx.parseOfficialCsv_('csv'));csvTable.push(['x']);assert.throws(()=>ctx.parseOfficialCsv_('csv'));});
test('live retrieval caches chunks, re-fetches partial eviction and falls back without replacing backup',()=>{csvTable=[['Nome da casa','Cidade','Quantidade de convidados','Ano da festa','Valor','Condição do valor'],['Teste','Niterói','80','2027','R$ 8.000,00','Segunda a quinta']];properties.set('QUOTES_BACKUP_ID','backup');cache.clear();fetchFails=false;fetchCount=0;assert.equal(ctx.getQuotes_().rows.length,1);assert.equal(ctx.getQuotes_().rows.length,1);assert.equal(fetchCount,1);const manifest=JSON.parse(cache.get('quotes:manifest'));cache.delete('quotes:'+manifest.id+':0');ctx.getQuotes_();assert.equal(fetchCount,2);const validBackup=backup;cache.clear();fetchFails=true;assert.equal(ctx.getQuotes_().stale,true);assert.equal(backup,validBackup);backup=JSON.stringify({rows:[{}],fetchedAt:'2000-01-01'});assert.throws(()=>ctx.getQuotes_());});

test('real submission path is idempotent, private and rate limited under lock (Google service mocks)',()=>{
 const lines=[], created=[];let privateAccess=true,locked=false;
 const resource={getSharingAccess:()=>privateAccess?'PRIVATE':'ANYONE',getViewers:()=>[],getEditors:()=>[]};
 const headers=vm.runInContext('CONTRIBUTION_HEADERS_',ctx);
 const s={getMaxColumns:()=>headers.length,setFrozenRows:()=>{},getLastRow:()=>lines.length+1,getRange:(row)=>({getValues:()=>row===1?[headers]:lines.map(r=>[r[0]])}),appendRow:r=>lines.push(r)};
 ctx.SpreadsheetApp={openById:()=>({getSheets:()=>[s]}),flush:()=>{}};
 ctx.DriveApp={Access:{PRIVATE:'PRIVATE'},Permission:{NONE:'NONE'},getFileById:()=>resource,getFolderById:()=>({...resource,createFile:()=>{const f={...resource,getUrl:()=>'https://drive.google.com/private-test',setSharing:()=>{},setTrashed:()=>{f.trashed=true;}};created.push(f);return f;}})};
 ctx.LockService={getScriptLock:()=>({tryLock:()=>{locked=true;return true;},releaseLock:()=>{locked=false;}})};
 ctx.Utilities.formatDate=()=> '2026102018';ctx.Utilities.newBlob=(...v)=>v;
 properties.delete('SUBMISSION_RATE');properties.delete('CONTRIBUTIONS_PAUSED');
 const p=payload();const result=ctx.submitContribution_(p);assert.equal(result.ok,true);assert.equal(lines.length,1);assert.equal(lines[0][2],'Pendente');assert.deepEqual(Object.keys(result).sort(),['message','ok']);assert.equal(locked,false);
 ctx.submitContribution_(p);assert.equal(lines.length,1);
 const docs=payload();docs.type='documents';docs.files=[{uploadId:'a'.repeat(30)}];const resolve=ctx.resolveUploadedFile_;ctx.resolveUploadedFile_=()=>({...resource,getUrl:()=> 'https://drive.google.com/private-test'});ctx.submitContribution_(docs);ctx.resolveUploadedFile_=resolve;assert.equal(created.length,0);assert.match(lines[1][22],/private-test/);
 privateAccess=false;assert.throws(()=>ctx.submitContribution_(payload()));assert.equal(lines.length,2);assert.equal(locked,false);privateAccess=true;
 properties.set('HOURLY_SUBMISSION_LIMIT','2');assert.throws(()=>ctx.submitContribution_(payload()),/limite/);properties.delete('HOURLY_SUBMISSION_LIMIT');
 properties.set('CONTRIBUTIONS_PAUSED','true');assert.throws(()=>ctx.beginContribution_(),/pausados/);assert.throws(()=>ctx.submitContribution_(payload()),/pausados/);properties.delete('CONTRIBUTIONS_PAUSED');
});

test('multiple manual options are validated independently with no inferred proportional values',()=>{
 const p=payload();p.options=[{guests:'100',price:'12000'},{guests:'80',price:'9900.50'}];delete p.guests;delete p.price;
 const result=ctx.validateContribution_(p);assert.deepEqual(JSON.parse(JSON.stringify(result.options)),p.options);assert.equal(result.data.guests,'');assert.equal(result.data.price,'');
 for(const options of [[],Array.from({length:21},()=>({guests:'80',price:'1000'})),[{guests:'80',price:''}],[{guests:80,price:'1000'}],[{guests:'0',price:'1000'}],[{guests:'80',price:'-1'}],[{guests:'80',price:'1000.123'}]])assert.throws(()=>ctx.validateContribution_({...p,options}));
});

test('schema upgrade appends the options column and preserves existing headers and records',()=>{
 const headers=Array.from(vm.runInContext('CONTRIBUTION_HEADERS_',ctx)),original=headers.slice(0,-1),rows=[original.slice(),['existing-id','existing-data']];let width=26,insertions=0;
 const sheet={getMaxColumns:()=>width,insertColumnsAfter:(_,count)=>{width+=count;insertions++;},getLastRow:()=>rows.length,getRange:(r,c,_,cols)=>({getValues:()=>[Array.from({length:cols},(_,i)=>rows[r-1][c-1+i]||'')],setValue:value=>{rows[r-1][c-1]=value;}}),setFrozenRows:()=>{},appendRow:row=>rows.push(row)};
 ctx.ensureContributionSchema_(sheet);ctx.ensureContributionSchema_(sheet);assert.equal(insertions,1);assert.deepEqual(rows[0],headers);assert.deepEqual(rows[1],['existing-id','existing-data']);
 rows[0][0]='Unexpected';assert.throws(()=>ctx.ensureContributionSchema_(sheet));
});

test('several manual prices occupy one pending contribution with an idempotent retry',()=>{
 const lines=[],headers=vm.runInContext('CONTRIBUTION_HEADERS_',ctx);
 const sheet={getMaxColumns:()=>headers.length,setFrozenRows:()=>{},getLastRow:()=>lines.length+1,getRange:(row)=>({getValues:()=>row===1?[headers]:lines.map(r=>[r[0]])}),appendRow:row=>lines.push(row)};
 ctx.SpreadsheetApp={openById:()=>({getSheets:()=>[sheet]}),flush:()=>{}};properties.delete('SUBMISSION_RATE');
 const p=payload();p.options=[{guests:'100',price:'12000'},{guests:'80',price:'9900'}];ctx.submitContribution_(p);ctx.submitContribution_(p);
 assert.equal(lines.length,1);assert.equal(lines[0][2],'Pendente');assert.equal(lines[0][10],'');assert.equal(lines[0][12],'');assert.deepEqual(JSON.parse(lines[0][26]),p.options);
});
