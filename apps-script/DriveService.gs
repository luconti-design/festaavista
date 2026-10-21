function validateAttachment_(file) {
  if (!file || typeof file.data !== 'string' || file.data.length > Math.ceil(MAX_FILE_BYTES_/3)*4+4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(file.data)) throw safeError_('Arquivo inválido ou maior que 10 MB.');
  const types={'application/pdf':/\.pdf$/i,'image/jpeg':/\.jpe?g$/i,'image/png':/\.png$/i};
  if(!types[file.type] || !types[file.type].test(file.name || '')) throw safeError_('Envie somente PDF, JPG ou PNG.');
  return validateFileBytes_(Utilities.base64Decode(file.data),file.type);
}

function validateFileBytes_(bytes,type) {
  if(!['application/pdf','image/png','image/jpeg'].includes(type))throw safeError_('Formato não permitido.');
  if(!bytes.length || bytes.length>MAX_FILE_BYTES_) throw safeError_('Cada arquivo deve ter até 10 MB.');
  const b=bytes.slice(0,8).map(function(v){return (v+256)%256;});
  const valid=type==='application/pdf' ? b.slice(0,5).join(',')==='37,80,68,70,45' : type==='image/png' ? b.join(',')==='137,80,78,71,13,10,26,10' : b[0]===255&&b[1]===216&&b[2]===255;
  if(!valid) throw safeError_('O conteúdo do arquivo não corresponde ao formato informado.');
  return {bytes:bytes,type:type,extension:type==='application/pdf'?'pdf':type==='image/png'?'png':'jpg'};
}

function saveAttachments_(validated,id) {
  const folder=DriveApp.getFolderById(requiredProperty_('UPLOADS_FOLDER_ID'));
  assertPrivate_(folder);
  const saved=[];
  try {
    validated.forEach(function(f,i) {
      const file=folder.createFile(Utilities.newBlob(f.bytes,f.type,id+'-'+(i+1)+'.'+f.extension));
      saved.push(file); file.setSharing(DriveApp.Access.PRIVATE,DriveApp.Permission.NONE); assertPrivate_(file);
    });
    return saved;
  } catch(e) { saved.forEach(function(f){try{f.setTrashed(true);}catch(_){}}); throw e; }
}

function assertPrivate_(resource) {
  if(resource.getSharingAccess()!==DriveApp.Access.PRIVATE || resource.getViewers().length || resource.getEditors().length) throw safeError_('O recebimento está temporariamente indisponível.');
}
