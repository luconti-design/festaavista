function beginContribution_() {
  if(props_().getProperty('CONTRIBUTIONS_PAUSED')==='true') throw safeError_('Os envios estão temporariamente pausados.');
  requiredProperty_('CONTRIBUTIONS_SHEET_ID'); requiredProperty_('UPLOADS_FOLDER_ID');
  const token=Utilities.getUuid(), issued=Date.now(), expires=issued+30*60*1000;
  const signature=signContribution_(token,issued,expires);
  return {token:token,issued:issued,expires:expires,signature:signature};
}
function signContribution_(token,issued,expires) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(token+'|'+issued+'|'+expires,requiredProperty_('SUBMISSION_SECRET')));
}
function validateContribution_(p) {
  if(!p || !['documents','manual'].includes(p.type)) throw safeError_('Tipo de contribuição inválido.');
  if(p.website) throw safeError_('Envio não aceito.');
  const t=p.ticket || {}; validateTicket_(t);
  const fields=['name','city','district','address','social','phone','guests','year','price','quoteMonth','package','period','payment','duration','included','extras','notes','email'];
  const d={}; fields.forEach(function(k){if(p[k]!=null&&typeof p[k]!=='string') throw safeError_('Dados inválidos.'); d[k]=(p[k]||'').trim(); if(d[k].length>(['notes','included','extras'].includes(k)?5000:500)) throw safeError_('Um dos campos excede o tamanho permitido.');});
  if(!d.name || !d.city || p.truth!==true || p.consent!==true) throw safeError_('Preencha nome, cidade e as duas autorizações.');
  if(d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) throw safeError_('E-mail inválido.');
  let options=[];
  if(p.type==='manual') {
    if(!/^20\d{2}$/.test(d.year))throw safeError_('Informe um ano válido para a cotação.');
    // Accept old single-option clients, without changing the meaning of their prices.
    const provided=p.options===undefined?[{guests:d.guests,price:d.price}]:p.options;
    if(!Array.isArray(provided)||provided.length<1||provided.length>MAX_MANUAL_OPTIONS_)throw safeError_('Informe de 1 a 20 opções de convidados e valores.');
    options=provided.map(function(option,index){
      if(!option||typeof option.guests!=='string'||typeof option.price!=='string')throw safeError_('Opção '+(index+1)+': quantidade ou valor inválido.');
      const guests=option.guests.trim(),price=option.price.trim();
      if(!/^\d{1,5}$/.test(guests)||+guests<1||!/^\d+(?:\.\d{1,2})?$/.test(price)||+price<=0||+price>100000000)throw safeError_('Opção '+(index+1)+': informe quantidade e valor total válidos.');
      return {guests:guests,price:price};
    });
    // Multiple options live in the dedicated column; do not suggest that the first
    // price applies to every guest count in the submission.
    d.guests=options.length===1?options[0].guests:'';d.price=options.length===1?options[0].price:'';
  } else if(p.options!==undefined)throw safeError_('Opções manuais não são aceitas no envio de documentos.');
  if(d.quoteMonth && !/^20\d{2}-(0[1-9]|1[0-2])$/.test(d.quoteMonth)) throw safeError_('Mês de cotação inválido.');
  if(!Array.isArray(p.files)||p.files.length>3||(p.type==='documents'&&!p.files.length)||(p.type==='manual'&&p.files.length)) throw safeError_('Envie de um a três documentos no caminho de anexos.');
  if(new Set(p.files.map(function(f){return f.uploadId;})).size!==p.files.length)throw safeError_('Arquivos repetidos.');
  return {data:d,options:options,files:p.files.map(function(f){return resolveUploadedFile_(f,t);}),ticket:t,type:p.type};
}

function submitContribution_(payload) {
  if(props_().getProperty('CONTRIBUTIONS_PAUSED')==='true') throw safeError_('Os envios estão temporariamente pausados.');
  const v=validateContribution_(payload), lock=LockService.getScriptLock();
  if(!lock.tryLock(20000)) throw safeError_('Há outros envios em andamento. Tente novamente.');
  let files=[];
  try {
    const sheet=contributionSheet_(); assertPrivate_(DriveApp.getFileById(requiredProperty_('CONTRIBUTIONS_SHEET_ID')));
    const ids=sheet.getLastRow()>1 ? sheet.getRange(2,1,sheet.getLastRow()-1,1).getValues().flat() : [];
    if(ids.indexOf(v.ticket.token)>=0) return {ok:true,message:'Obrigado! Sua cotação será conferida antes de aparecer no site.'};
    // Global circuit breaker is deliberately not presented as per-IP protection.
    const hour=Utilities.formatDate(new Date(),'UTC','yyyyMMddHH');
    const state=JSON.parse(props_().getProperty('SUBMISSION_RATE')||'{}');
    const hourly=state.hour===hour?Number(state.count||0):0, limit=Number(props_().getProperty('HOURLY_SUBMISSION_LIMIT')||30);
    if(hourly>=limit) throw safeError_('O limite temporário de envios foi atingido. Tente novamente mais tarde.');
    props_().setProperty('SUBMISSION_RATE',JSON.stringify({hour:hour,count:hourly+1}));
    files=v.files;
    const d=v.data;
    ensureContributionSchema_(sheet);
    sheet.appendRow([v.ticket.token,new Date().toISOString(),'Pendente',v.type,d.name,d.city,d.district,d.address,d.social,d.phone,d.guests,d.year,d.price,d.quoteMonth,d.package,d.period,d.payment,d.duration,d.included,d.extras,d.notes,d.email,files.map(function(f){return f.getUrl();}).join('\n'),'Sim','Sim','',v.options.length?JSON.stringify(v.options):''].map(sheetText_));
    SpreadsheetApp.flush();
    return {ok:true,message:'Obrigado! Sua cotação será conferida antes de aparecer no site.'};
  } catch(e) {
    // Keep files if a write may have succeeded: a retry with the same ID is idempotent.
    let committed=false; try{const s=contributionSheet_(); committed=s.getLastRow()>1&&s.getRange(2,1,s.getLastRow()-1,1).getValues().flat().includes(v.ticket.token);}catch(_){committed=true;}
    // Completed uploads stay private so the same ticket can retry a failed sheet write.
    throw e;
  } finally {lock.releaseLock();}
}
