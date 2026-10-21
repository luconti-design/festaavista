const CSV_URL_ = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSySx90K2gB-VRRxUKlgp1hRt2IJGVPkd4Jl9vKoihAaj0UrfE8Y13mAE7V2q6PzUgHNQDtTcN6uwm3/pub?gid=1617292525&single=true&output=csv';
const CACHE_SECONDS_ = 300;
const MAX_FILE_BYTES_ = 10 * 1024 * 1024;
const CONTRIBUTION_HEADERS_ = ['ID','Recebido em','Status','Tipo','Nome da casa','Cidade','Bairro','Endereço','Instagram / site','Telefone','Convidados','Ano','Valor','Mês da cotação','Pacote','Condição do dia','Pagamento','Duração','Serviços incluídos','Serviços à parte','Observações','E-mail privado','Arquivos privados','Veracidade','Autorização','Nota administrativa','Opções de convidados e valores'];
const MAX_MANUAL_OPTIONS_ = 20;
function safeError_(message) { const e = new Error(message); e.safe = true; return e; }
function props_() { return PropertiesService.getScriptProperties(); }
function requiredProperty_(key) {
  const value = props_().getProperty(key);
  if (!value) throw safeError_('O recebimento de contribuições ainda não está configurado.');
  return value;
}
