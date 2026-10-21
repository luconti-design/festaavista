function parseOfficialCsv_(csv) {
  if (!csv || /^\s*</.test(csv)) throw new Error('Invalid CSV response');
  const table = Utilities.parseCsv(csv.replace(/^\uFEFF/, ''));
  const headers = table.shift().map(function(h) { return h.trim(); });
  ['Nome da casa','Cidade','Quantidade de convidados','Ano da festa','Valor','Condição do valor'].forEach(function(h) {
    if (headers.indexOf(h) < 0) throw new Error('Missing required CSV header');
  });
  const rows = table.filter(function(r) { return r.some(function(v) { return v.trim(); }); }).map(function(r) {
    if (r.length !== headers.length) throw new Error('Invalid CSV row width');
    const row = {}; headers.forEach(function(h, i) { row[h] = r[i]; }); return row;
  });
  if (!rows.length || !rows.some(function(r) { return r['Nome da casa'] && r['Cidade'] && /^R?\$?\s*\d/.test(r['Valor']); })) throw new Error('No usable records');
  return {rows:rows, fetchedAt:new Date().toISOString(), stale:false};
}

function getQuotes_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('quotes:manifest');
  if (cached) {
    try {
      const m = JSON.parse(cached), parts = [];
      for (let i=0;i<m.count;i++) { const p=cache.get('quotes:'+m.id+':'+i); if(p===null) throw new Error('Cache evicted'); parts.push(p); }
      return JSON.parse(parts.join(''));
    } catch (_) { /* Re-fetch if any chunk was evicted. */ }
  }
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) return fallbackQuotes_('Atualização em andamento.');
  try {
    const response = UrlFetchApp.fetch(CSV_URL_, {muteHttpExceptions:true, followRedirects:true});
    if (response.getResponseCode() !== 200) throw new Error('Upstream status');
    const data = parseOfficialCsv_(response.getContentText('UTF-8'));
    const serialized=JSON.stringify(data), id=Utilities.getUuid(), chunks=serialized.match(/[\s\S]{1,18000}/g);
    chunks.forEach(function(chunk,i){cache.put('quotes:'+id+':'+i,chunk,CACHE_SECONDS_);});
    cache.put('quotes:manifest',JSON.stringify({id:id,count:chunks.length}),CACHE_SECONDS_);
    try {
      const backupId=props_().getProperty('QUOTES_BACKUP_ID');
      if(backupId) DriveApp.getFileById(backupId).setContent(serialized);
    } catch (_) { console.warn('Could not update private quote backup'); }
    return data;
  } catch (_) { return fallbackQuotes_('Não foi possível atualizar a base agora.'); }
  finally { lock.releaseLock(); }
}

function fallbackQuotes_(message) {
  try {
    const id=props_().getProperty('QUOTES_BACKUP_ID');
    if(id) {
      const data=JSON.parse(DriveApp.getFileById(id).getBlob().getDataAsString());
      if(data.rows && data.rows.length && Date.now()-Date.parse(data.fetchedAt)<24*60*60*1000) {
        data.stale=true; data.warning=message+' Exibindo a última base válida, de '+data.fetchedAt+'.'; return data;
      }
    }
  } catch (_) { /* No reliable backup. */ }
  throw new Error('Não foi possível carregar dados confiáveis. Tente novamente em alguns minutos.');
}

function contributionSheet_() { return SpreadsheetApp.openById(requiredProperty_('CONTRIBUTIONS_SHEET_ID')).getSheets()[0]; }
function sheetText_(value) { const s=String(value == null ? '' : value); return /^[=+@\-\t\r]/.test(s) ? "'"+s : s; }
