// Run ONLY from the Apps Script editor. Trailing underscores block browser RPC.
function install_() {
  const lock=LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const p=props_();
    if(!p.getProperty('UPLOADS_FOLDER_ID')) {
      const folder=DriveApp.createFolder('Festa à Vista - Documentos privados');
      folder.setSharing(DriveApp.Access.PRIVATE,DriveApp.Permission.NONE); p.setProperty('UPLOADS_FOLDER_ID',folder.getId());
    }
    if(!p.getProperty('CONTRIBUTIONS_SHEET_ID')) {
      const ss=SpreadsheetApp.create('Respostas - Contribuições'); p.setProperty('CONTRIBUTIONS_SHEET_ID',ss.getId());
    }
    const sheet=contributionSheet_();
    ensureContributionSchema_(sheet);
    sheet.getRange(2,3,Math.max(sheet.getMaxRows()-1,1),1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Pendente','Em análise','Aprovada','Rejeitada'],true).setAllowInvalid(false).build());
    if(!p.getProperty('SUBMISSION_SECRET')) p.setProperty('SUBMISSION_SECRET',Utilities.getUuid()+Utilities.getUuid());
    if(!p.getProperty('STAGING_FOLDER_ID')) {
      const staging=DriveApp.createFolder('Festa à Vista - Uploads temporários privados');
      staging.setSharing(DriveApp.Access.PRIVATE,DriveApp.Permission.NONE);p.setProperty('STAGING_FOLDER_ID',staging.getId());
    }
    if(!p.getProperty('QUOTES_BACKUP_ID')) {
      const backup=DriveApp.getFolderById(p.getProperty('UPLOADS_FOLDER_ID')).createFile('ultima-base-valida.json','{}',MimeType.PLAIN_TEXT);
      p.setProperty('QUOTES_BACKUP_ID',backup.getId());
    }
    assertPrivate_(DriveApp.getFolderById(p.getProperty('UPLOADS_FOLDER_ID')));
    assertPrivate_(DriveApp.getFolderById(p.getProperty('STAGING_FOLDER_ID')));
    assertPrivate_(DriveApp.getFileById(p.getProperty('CONTRIBUTIONS_SHEET_ID')));
    if(!ScriptApp.getProjectTriggers().some(function(t){return t.getHandlerFunction()==='cleanupStagedUploads_';}))ScriptApp.newTrigger('cleanupStagedUploads_').timeBased().everyDays(1).create();
    console.log('Instalação verificada. Abra Respostas - Contribuições no seu Drive para moderar os envios.');
  } finally {lock.releaseLock();}
}

// Safe append-only schema upgrade: existing rows and the original 26 columns stay in place.
function ensureContributionSchema_(sheet) {
  const count=CONTRIBUTION_HEADERS_.length,maxColumns=sheet.getMaxColumns();
  if(maxColumns<count)sheet.insertColumnsAfter(maxColumns,count-maxColumns);
  if(!sheet.getLastRow())sheet.appendRow(CONTRIBUTION_HEADERS_);
  else {
    const actual=sheet.getRange(1,1,1,count).getValues()[0];
    if(actual.slice(0,count-1).join('|')!==CONTRIBUTION_HEADERS_.slice(0,count-1).join('|'))throw new Error('Cabeçalhos administrativos inesperados. Revisar antes de continuar.');
    if(!actual[count-1])sheet.getRange(1,count).setValue(CONTRIBUTION_HEADERS_[count-1]);
    else if(actual[count-1]!==CONTRIBUTION_HEADERS_[count-1])throw new Error('Coluna de opções inesperada. Revisar antes de continuar.');
  }
  sheet.setFrozenRows(1);
}

function verifyInstallation_() {
  assertPrivate_(DriveApp.getFolderById(requiredProperty_('UPLOADS_FOLDER_ID')));
  assertPrivate_(DriveApp.getFileById(requiredProperty_('CONTRIBUTIONS_SHEET_ID')));
  const result=getQuotes_(); console.log(JSON.stringify({records:result.rows.length,fetchedAt:result.fetchedAt,stale:result.stale}));
}

// Editor-only maintenance. Can also be attached to an owner-authorized time trigger.
function cleanupStagedUploads_() {
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try {
    const root=DriveApp.getFolderById(requiredProperty_('STAGING_FOLDER_ID'));assertPrivate_(root);
    const folders=root.getFolders(),cutoff=Date.now()-24*60*60*1000;
    while(folders.hasNext()){const folder=folders.next();if(folder.getDateCreated().getTime()<cutoff)folder.setTrashed(true);}
    // Remove unsubmitted completed uploads after 24h. Never remove approved/pending attachments.
    const sheet=contributionSheet_(),references=new Set();
    if(sheet.getLastRow()>1)sheet.getRange(2,23,sheet.getLastRow()-1,1).getValues().forEach(function(row){String(row[0]).split('\n').forEach(function(url){const match=url.match(/[-\w]{25,}/g);if(match)match.forEach(function(id){references.add(id);});});});
    const files=DriveApp.getFolderById(requiredProperty_('UPLOADS_FOLDER_ID')).getFiles();
    while(files.hasNext()){const f=files.next();if(/^contribution:/.test(f.getDescription())&&f.getDateCreated().getTime()<cutoff&&!references.has(f.getId()))f.setTrashed(true);}
  } finally{lock.releaseLock();}
}
