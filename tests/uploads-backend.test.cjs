const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
function setup(){
 const properties=new Map([['SUBMISSION_SECRET','secret'],['UPLOADS_FOLDER_ID','uploads'],['STAGING_FOLDER_ID','staging']]),nodes=new Map();let count=0;
 const iter=a=>{let i=0;return {hasNext:()=>i<a.length,next:()=>a[i++]};};
 const bytes=b=>Array.from(Buffer.isBuffer(b)?b:Buffer.from(String(b)));
 const blob=(data,type,name)=>({name,type,getBytes:()=>Array.from(data),getDataAsString:()=>Buffer.from(data).toString('utf8')});
 function folder(id){const children=[];const f={getId:()=>id,getSharingAccess:()=> 'PRIVATE',getViewers:()=>[],getEditors:()=>[],getFoldersByName:name=>iter(children.filter(n=>n.folder&&n.name===name)),createFolder:name=>{const sub=folder('folder-'+(++count));sub.name=name;sub.folder=true;children.push(sub);return sub;},getFilesByName:name=>iter(children.filter(n=>!n.folder&&!n.trashed&&n.getName()===name)),getFiles:()=>iter(children.filter(n=>!n.folder&&!n.trashed)),createFile:(input,content,type)=>{const b=typeof input==='string'?blob(bytes(content),type,input):input;const file={description:'',trashed:false,getId:()=> 'file-id-'.padEnd(25,'0')+(++count),getName:()=> b.name,getSharingAccess:()=> 'PRIVATE',getViewers:()=>[],getEditors:()=>[],setSharing:()=>{},setTrashed:v=>file.trashed=v,setDescription:v=>file.description=v,getDescription:()=>file.description,getSize:()=>b.getBytes().length,getParents:()=>iter([f]),isTrashed:()=>file.trashed,getBlob:()=>b};const stableId=file.getId();file.getId=()=>stableId;children.push(file);nodes.set(stableId,file);return file;}};nodes.set(id,f);return f;}
 folder('staging');folder('uploads');
 const ctx=vm.createContext({Date,console,PropertiesService:{getScriptProperties:()=>({getProperty:k=>properties.get(k)||null,setProperty:(k,v)=>properties.set(k,v)})},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},MimeType:{PLAIN_TEXT:'text/plain'},DriveApp:{Access:{PRIVATE:'PRIVATE'},Permission:{NONE:'NONE'},getFolderById:id=>nodes.get(id),getFileById:id=>nodes.get(id)},Utilities:{getUuid:()=>crypto.randomUUID(),formatDate:()=> 'hour',computeHmacSha256Signature:(s,k)=>crypto.createHmac('sha256',k).update(s).digest(),base64EncodeWebSafe:b=>Buffer.from(b).toString('base64url'),base64Encode:b=>Buffer.from(b).toString('base64'),base64Decode:s=>[...Buffer.from(s,'base64')],newBlob:(b,t,n)=>blob(b,t,n)}});
 for(const file of ['Config.gs','DriveService.gs','ContributionsService.gs','UploadsService.gs'])vm.runInContext(fs.readFileSync('apps-script/'+file,'utf8'),ctx);
 const ticket={token:crypto.randomUUID(),issued:Date.now()-3000,expires:Date.now()-3000+1800000};ticket.signature=ctx.signContribution_(ticket.token,ticket.issued,ticket.expires);
 return {ctx,ticket,nodes,properties};
}
test('chunk staging assembles real bytes privately, retries final receipt and binds to ticket',()=>{
 const {ctx,ticket,nodes}=setup(),data=Buffer.concat([Buffer.from('%PDF-1.7\n'),Buffer.alloc(256*1024)]),total=2;
 const payload=index=>({ticket,slot:0,name:'budget.pdf',type:'application/pdf',size:data.length,index,total,data:data.subarray(index*256*1024,(index+1)*256*1024).toString('base64')});
 assert.equal(ctx.uploadContributionChunk_(payload(0)).received,1);
 assert.equal(ctx.uploadContributionChunk_(payload(0)).received,1);
 const result=ctx.uploadContributionChunk_(payload(1));assert.ok(result.uploadId);
 assert.equal(ctx.uploadContributionChunk_(payload(1)).uploadId,result.uploadId);
 const file=ctx.resolveUploadedFile_({uploadId:result.uploadId},ticket);assert.deepEqual(Buffer.from(file.getBlob().getBytes()),data);assert.equal(file.getDescription(),'contribution:'+ticket.token);
 assert.throws(()=>ctx.resolveUploadedFile_({uploadId:result.uploadId},{...ticket,token:crypto.randomUUID()}));
 assert.ok(nodes.size>2);
});
test('chunks enforce size, order, signature, mismatch and rate limits',()=>{
 const {ctx,ticket,properties}=setup();const file=Buffer.from('%PDF-1.4 example');const payload={ticket,slot:0,name:'x.pdf',type:'application/pdf',size:file.length,index:0,total:1,data:file.toString('base64')};
 for(const change of [{slot:3},{size:10*1024*1024+1},{index:2},{data:'eA=='},{name:'x.exe'},{ticket:{...ticket,signature:'tampered'}}])assert.throws(()=>ctx.uploadContributionChunk_({...payload,...change}));
 assert.throws(()=>ctx.uploadContributionChunk_({...payload,data:Buffer.alloc(file.length).toString('base64')}),/conteúdo/);
 properties.set('HOURLY_UPLOAD_CHUNK_LIMIT','1');assert.throws(()=>ctx.uploadContributionChunk_(payload),/Limite/);
});
