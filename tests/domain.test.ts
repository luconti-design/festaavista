import {test} from 'vitest';
import assert from 'node:assert/strict';
import * as D from '../src/services/domain';
import type {Filters,RawQuote} from '../src/types';
// Synthetic fixtures exist only in tests. They are never shipped to the UI.
const row=(overrides:RawQuote={})=>({'Nome da casa':'Teste','Casa para o site':'Teste',Cidade:'Niterói',Bairro:'Centro','Quantidade de convidados':'80','Ano da festa':'2027',Valor:'R$ 8.000,00','Condição do valor':'Segunda a quinta','Período identificado':'Segunda a quinta','Pacote identificado':'Completo',...overrides});
const f:Filters={district:'',sort:'asc',venue:'',min:'',max:'',city:'Niteroi',guests:'80',year:'2027',period:'weekday'};
test('normalizes accents, whitespace and case',()=>assert.equal(D.norm('  NITERÓI  '),'niteroi'));
test('Brazilian currency is strict and numeric',()=>{assert.equal(D.price('R$ 10.128,00'),10128);for(const s of ['','sob consulta','1.23','-3','0','10 e 20','R$ 8.000,00 / R$ 9.000,00'])assert.equal(D.price(s),null);});
test('exact guest matching and requested year preferred over older proposals',()=>{const list=D.prepare([row(),row({'Quantidade de convidados':'100'}),row({'Ano da festa':'2026'})]);const h=D.search(list,f);assert.equal(h.length,1);assert.equal(h[0].quotes.length,1);assert.equal(h[0].isHistorical,false);assert.equal(D.search(list,{...f,guests:'90'}).length,0);});
test('Friday and broad periods are deterministic',()=>{assert.ok(D.eligible(row({'Período identificado':'Segunda a sexta'}),'friday'));assert.equal(D.eligible(row(),'friday'),false);assert.ok(D.eligible(row({'Período identificado':'Sexta a domingo e feriados'}),'weekend'));assert.equal(D.eligible(row({'Período identificado':'A combinar'}),'weekday'),false);});
test('Monday to Sunday has no automatic holidays',()=>{const h=D.search(D.prepare([row({'Período identificado':'Segunda a domingo'})]),{...f,period:'weekend'});assert.equal(h.length,1);assert.ok(D.notices(h[0]).some(s=>s.includes('Feriados não confirmados')));});
test('Folia explicit identity is unique and packages survive',()=>{const rs=['Mega','Luxo'].map((p,i)=>row({'Nome da casa':'Folia Kids - '+p,'Casa para o site':'Folia Kids','Pacote identificado':p,Valor:i?'R$ 12.000,00':'R$ 9.000,00'}));const h=D.search(D.prepare(rs),f);assert.equal(h.length,1);assert.equal(h[0].quotes.length,2);assert.equal(h[0].best.raw['Pacote identificado'],'Mega');assert.ok(D.notices(h[0]).some(s=>s.includes('Outros pacotes')));});
test('similar venue names never fuzzy merge',()=>assert.equal(D.search(D.prepare([row({'Casa para o site':'Festa & Cia'}),row({'Casa para o site':'Festa e Cia Niteroi'})]),f).length,2));
test('minimum keeps payment and condition from same source',()=>{const h=D.search(D.prepare([row({Valor:'R$ 9.000,00','Pagamento identificado':'Cartão em 12x'}),row({Valor:'R$ 8.000,00','Pagamento identificado':'À vista (Pix)'})]),f)[0];assert.equal(h.best.price,8000);assert.equal(h.best.raw['Pagamento identificado'],'À vista (Pix)');});
test('notes do not replace price with a discount',()=>{const h=D.search(D.prepare([row({Observações:'À vista R$ 7.000,00, desconto de 10%'})]),f)[0];assert.equal(h.best.price,8000);});
test('school packages and invalid prices excluded',()=>{assert.equal(D.search(D.prepare([row({'Pacote identificado':'Escolar'}),row({Valor:'sob consulta'})]),f).length,0);});
test('district, name, range and ordering',()=>{const list=D.prepare([row(),row({'Casa para o site':'Outra',Bairro:'Icaraí',Valor:'R$ 10.000,00'})]);assert.equal(D.search(list,{...f,district:'Icarai'})[0].best.name,'Outra');assert.equal(D.search(list,{...f,min:'9000',max:'11000',venue:'outra'}).length,1);assert.equal(D.search(list,{...f,sort:'desc'})[0].best.price,10000);});
test('quote month is distinct from party year',()=>{assert.match(D.quoteDate('10/26'),/outubro de 2026/);assert.equal(D.quoteDate('13/26'),'Data da cotação não informada');});
test('empty canonical name falls back to original',()=>assert.equal(D.prepare([row({'Casa para o site':'Não informado'})])[0].name,'Teste'));
test('12h warning retains original condition',()=>{const h=D.search(D.prepare([row({'Condição do valor':'Sábado e domingo (12h)','Período identificado':'Sábado e domingo'})]),{...f,period:'weekend'})[0];assert.match(h.best.raw['Condição do valor'],/12h/);assert.ok(D.notices(h).some(s=>s.includes('horário')));});

test('payment-only price differences do not imply different days or hours',()=>{const h=D.search(D.prepare([row({'Condição do valor':'Segunda a quinta | À vista (Pix)','Pagamento identificado':'À vista (Pix)'}),row({'Condição do valor':'Segunda a quinta | Cartão em 12x','Pagamento identificado':'Cartão em 12x',Valor:'R$ 9.000,00'})]),f)[0];assert.equal(D.notices(h).some(s=>s.includes('horário')),false);assert.ok(D.notices(h).some(s=>s.includes('pagamento')));});

test('older references retain actual year, exact source price and payment',()=>{
 const h=D.search(D.prepare([row({'Ano da festa':'2025',Valor:'R$ 3.000,00'}),row({'Ano da festa':'2026',Valor:'R$ 9.876,54','Pagamento identificado':'À vista (Pix)'})]),f)[0];
 assert.equal(h.isHistorical,true);assert.equal(h.requestedYear,'2027');assert.equal(h.best.year,'2026');assert.equal(h.best.price,9876.54);assert.equal(h.best.raw['Pagamento identificado'],'À vista (Pix)');assert.equal(h.quotes.length,1);
});
test('current proposals beat cheaper earlier ones without losing current packages',()=>{
 const h=D.search(D.prepare([row({'Ano da festa':'2026',Valor:'R$ 1.000,00'}),row({Valor:'R$ 8.000,00','Pacote identificado':'Mega'}),row({Valor:'R$ 10.000,00','Pacote identificado':'Luxo'})]),f)[0];
 assert.equal(h.isHistorical,false);assert.equal(h.best.price,8000);assert.deepEqual(h.quotes.map(q=>q.raw['Pacote identificado']),['Mega','Luxo']);
});
test('fallback never uses future, undated, wrong quantity or incompatible period',()=>{
 const h=D.search(D.prepare([row({'Ano da festa':'2028'}),row({'Ano da festa':'Não informado'}),row({'Ano da festa':'2026','Quantidade de convidados':'100'}),row({'Ano da festa':'2026','Período identificado':'Sábado e domingo'})]),f);
 assert.equal(h.length,0);
});
test('source-year coverage can count only exact records while normal search includes earlier houses',()=>{
 const data=D.prepare([row(),row({'Casa para o site':'Outra','Ano da festa':'2026'})]);
 assert.equal(D.search(data,f).length,2);assert.equal(D.search(data,f,{strictYear:true}).length,1);
});
test('price filter cannot select a cheaper obsolete year over the latest eligible reference',()=>{
 const data=D.prepare([row({'Ano da festa':'2025',Valor:'R$ 3.000,00'}),row({'Ano da festa':'2026',Valor:'R$ 9.000,00'})]);
 assert.equal(D.search(data,{...f,max:'5000'}).length,0);
});
