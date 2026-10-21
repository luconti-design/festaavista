function doGet() {
  return HtmlService.createTemplateFromFile('Index').evaluate()
    .setTitle('festa à vista. — Compare valores. Descubra possibilidades.')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include_(name) { return HtmlService.createHtmlOutputFromFile(name).getContent(); }

// These are the only public RPCs. All administrative/internal functions end in _.
function getQuotes() { return getQuotes_(); }
function beginContribution() { return beginContribution_(); }
function uploadContributionChunk(payload) {
  try { return uploadContributionChunk_(payload); }
  catch (error) { throw new Error(error.safe ? error.message : 'Não foi possível enviar esta parte do arquivo. Tente novamente.'); }
}
function submitContribution(payload) {
  try { return submitContribution_(payload); }
  catch (error) {
    console.error('Contribution failed: ' + (error.safe ? error.message : 'internal error'));
    throw new Error(error.safe ? error.message : 'Não foi possível concluir o envio. Tente novamente mais tarde.');
  }
}
