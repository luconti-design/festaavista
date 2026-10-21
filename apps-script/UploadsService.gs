const CHUNK_BYTES_ = 256 * 1024;
function validateTicket_(t) {
  if(!t||!/^[a-f0-9-]{36}$/i.test(t.token||'')||!Number.isFinite(t.issued)||!Number.isFinite(t.expires)||t.expires-t.issued!==1800000||t.expires<Date.now()||Date.now()-t.issued<2000||t.signature!==signContribution_(t.token,t.issued,t.expires))throw safeError_('Sessão de envio inválida ou expirada. Reabra o formulário.');
}
function uploadContributionChunk_(p) {
  if(props_().getProperty('CONTRIBUTIONS_PAUSED')==='true')throw safeError_('Os envios estão temporariamente pausados.');
  if(!p)throw safeError_('Parte de arquivo inválida.');validateTicket_(p.ticket);
  if(!Number.isInteger(p.slot)||p.slot<0||p.slot>2||!Number.isInteger(p.size)||p.size<1||p.size>MAX_FILE_BYTES_||!Number.isInteger(p.index)||!Number.isInteger(p.total)||p.total!==Math.ceil(p.size/CHUNK_BYTES_)||p.index<0||p.index>=p.total)throw safeError_('Tamanho ou sequência de arquivo inválida.');
  const types={'application/pdf':/\.pdf$/i,'image/jpeg':/\.jpe?g$/i,'image/png':/\.png$/i};
  if(typeof p.name!=='string'||p.name.length>500||!types[p.type]||!types[p.type].test(p.name)||typeof p.data!=='string'||p.data.length>Math.ceil(CHUNK_BYTES_/3)*4+4||!/^[A-Za-z0-9+/]*={0,2}$/.test(p.data))throw safeError_('Formato de arquivo inválido.');
  const bytes=Utilities.base64Decode(p.data),expected=p.index===p.total-1?p.size-p.index*CHUNK_BYTES_:CHUNK_BYTES_;
  if(bytes.length!==expected)throw safeError_('A parte recebida está incompleta.');
  const lock=LockService.getScriptLock();if(!lock.tryLock(20000))throw safeError_('Há outro envio em andamento. Tente novamente.');
  try{
    // Persistent global circuit breaker includes staging, not only final sheet writes.
    const hour=Utilities.formatDate(new Date(),'UTC','yyyyMMddHH'),rate=JSON.parse(props_().getProperty('UPLOAD_RATE')||'{}'),limit=Number(props_().getProperty('HOURLY_UPLOAD_CHUNK_LIMIT')||400);
    const count=rate.hour===hour?Number(rate.count||0):0;
    if(count>=limit)throw safeError_('Limite temporário de arquivos atingido. Tente novamente mais tarde.');
    props_().setProperty('UPLOAD_RATE',JSON.stringify({hour:hour,count:count+1}));
    const root=DriveApp.getFolderById(requiredProperty_('STAGING_FOLDER_ID'));assertPrivate_(root);
    const folders=root.getFoldersByName(p.ticket.token+'-'+p.slot),folder=folders.hasNext()?folders.next():root.createFolder(p.ticket.token+'-'+p.slot);assertPrivate_(folder);
    const meta=JSON.stringify({name:p.name,type:p.type,size:p.size,total:p.total}),existingMeta=folder.getFilesByName('metadata.json');
    if(existingMeta.hasNext()){if(existingMeta.next().getBlob().getDataAsString()!==meta)throw safeError_('O arquivo foi alterado durante o envio. Reabra o formulário.');}
    else folder.createFile('metadata.json',meta,MimeType.PLAIN_TEXT);
    const complete=folder.getFilesByName('complete.id');
    if(complete.hasNext())return {received:p.index+1,uploadId:complete.next().getBlob().getDataAsString()};
    const existing=folder.getFilesByName('part-'+p.index);
    if(existing.hasNext()){if(Utilities.base64Encode(existing.next().getBlob().getBytes())!==Utilities.base64Encode(bytes))throw safeError_('Parte divergente. Reabra o formulário.');}
    else folder.createFile(Utilities.newBlob(bytes,'application/octet-stream','part-'+p.index));
    if(p.index!==p.total-1)return {received:p.index+1};
    const all=[];
    for(let i=0;i<p.total;i++){const part=folder.getFilesByName('part-'+i);if(!part.hasNext())throw safeError_('Há partes pendentes. Tente enviar novamente.');const b=part.next().getBlob().getBytes();for(let j=0;j<b.length;j++)all.push(b[j]);}
    if(all.length!==p.size)throw safeError_('Arquivo incompleto.');
    const validated=validateFileBytes_(all,p.type);
    const file=saveAttachments_([validated],p.ticket.token+'-'+p.slot)[0];file.setDescription('contribution:'+p.ticket.token);
    folder.createFile('complete.id',file.getId(),MimeType.PLAIN_TEXT);
    // Remove part files after successful assembly; retain metadata/receipt for retry idempotency.
    const parts=folder.getFiles();while(parts.hasNext()){const part=parts.next();if(/^part-/.test(part.getName()))part.setTrashed(true);}
    return {received:p.index+1,uploadId:file.getId()};
  }finally{lock.releaseLock();}
}

function resolveUploadedFile_(attachment,ticket) {
  if(!attachment||typeof attachment.uploadId!=='string'||!/^[\w-]{20,}$/.test(attachment.uploadId))throw safeError_('O arquivo ainda não foi enviado completamente.');
  const file=DriveApp.getFileById(attachment.uploadId);assertPrivate_(file);
  if(file.isTrashed()||file.getDescription()!=='contribution:'+ticket.token||file.getSize()>MAX_FILE_BYTES_||file.getSize()<1)throw safeError_('Arquivo inválido para esta contribuição.');
  const parents=file.getParents();let owns=false;while(parents.hasNext())if(parents.next().getId()===requiredProperty_('UPLOADS_FOLDER_ID'))owns=true;
  if(!owns)throw safeError_('Arquivo não pertence a esta contribuição.');
  return file;
}
