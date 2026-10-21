const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const rows=JSON.parse(fs.readFileSync(0,'utf8').replace(/^\uFEFF/,'')),c=vm.createContext({Intl,Date});
const ts=require('typescript'),source=ts.transpileModule(fs.readFileSync('src/services/domain.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
c.exports={};vm.runInContext(source,c);
const D=c.exports,records=D.prepare(rows),headers=Object.keys(rows[0]);
for(const name of ['Nome da casa','Cidade','Valor','Casa para o site','Pacote identificado','Período identificado','Pagamento identificado'])assert.ok(headers.includes(name));
let searches=0;
for(const city of new Set(rows.map(r=>r.Cidade)))for(const year of new Set(rows.map(r=>r['Ano da festa'])))for(const guests of new Set(rows.map(r=>r['Quantidade de convidados'])))for(const period of ['weekday','friday','weekend']){
 const houses=D.search(records,{city,year,guests,period});searches++;
 assert.equal(new Set(houses.map(h=>h.key)).size,houses.length);
 for(const h of houses){assert.equal(h.requestedYear,year);assert.equal(h.isHistorical,h.best.year!==year);assert.equal(h.best.price,Math.min(...h.quotes.map(q=>q.price)));assert.equal(new Set(h.quotes.map(q=>q.year)).size,1);for(const q of h.quotes){assert.equal(q.guests,Number(guests));assert.ok(Number(q.year)<=Number(year));assert.equal(D.norm(q.raw.Cidade),D.norm(city));}const exact=D.search(records,{city,year,guests,period},{strictYear:true}).find(q=>q.key===h.key);if(exact)assert.equal(h.best.year,year);}
}
const foliaCity=records.find(q=>q.name==='Folia Kids')?.raw.Cidade;
const folia=D.search(records,{city:foliaCity,year:'2027',guests:'80',period:'weekday'}).filter(h=>h.best.name==='Folia Kids');
const niteroi2027=Object.fromEntries(['weekday','weekend'].map(period=>[period,D.search(records,{city:'Niterói',year:'2027',guests:'80',period}).map(h=>({name:h.best.name,sourceYear:h.best.year,requestedYear:h.requestedYear,historical:h.isHistorical}))]));
console.log(JSON.stringify({columns:headers.length,rows:rows.length,searchesValidated:searches,invalidPrices:records.filter(q=>q.price===null).length,foliaWhenPresent:folia.map(h=>({name:h.best.name,packages:h.quotes.map(q=>q.raw['Pacote identificado'])})),niteroi2027,note:'Consulta real; preços originais preservados, sem reajuste.'},null,2));
