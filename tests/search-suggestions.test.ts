import {expect,test} from 'vitest';
import {prepare,search} from '../src/services/domain';
import {searchSuggestions} from '../src/services/searchSuggestions';
import type {Filters,RawQuote} from '../src/types';
const f:Filters={city:'Niterói',guests:'70',year:'2027',period:'weekday',district:'',sort:'asc',venue:'',min:'',max:''};
const row=(name:string,year:string,period='Segunda a quinta'):RawQuote=>({'Nome da casa':name,'Casa para o site':name,Cidade:'Niterói',Bairro:'Centro','Quantidade de convidados':'70','Ano da festa':year,Valor:'9000','Período identificado':period});
test('historical houses already shown never produce redundant year suggestions',()=>{
 const records=prepare([row('A','2025'),row('B','2026')]);expect(searchSuggestions(records,f,search(records,f))).toEqual([]);
});
test('future references add houses only after an explicit year change',()=>{
 const filters={...f,year:'2026'},records=prepare([row('A','2026'),row('B','2027')]);
 expect(search(records,filters).map(h=>h.best.name)).toEqual(['A']);
 const suggestions=searchSuggestions(records,filters,search(records,filters));expect(suggestions).toHaveLength(1);expect(suggestions[0]).toMatchObject({year:'2027',period:'weekday',added:1,total:2});
});
test('empty results suggest actual alternatives while keeping guests and city',()=>{
 const records=prepare([row('A','2026','Sábado e domingo'),{...row('Wrong guests','2026'),'Quantidade de convidados':'80'},{...row('Wrong city','2026'),Cidade:'Outra cidade'}]);
 const suggestions=searchSuggestions(records,f,[]);expect(suggestions).toHaveLength(1);expect(suggestions[0]).toMatchObject({year:'2027',period:'weekend',added:1});
});
