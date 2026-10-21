import {useMemo} from 'react';
import {useCatalog} from '../hooks/useCatalog';
import {searchSuggestions} from '../services/searchSuggestions';
const labels={weekday:'segunda a quinta',friday:'sexta-feira',weekend:'sábado, domingo ou feriado'};
export function SearchCoverage(){
 const {records,filters,setFilters,data,houses}=useCatalog();
 const suggestions=useMemo(()=>searchSuggestions(records,filters,houses),[records,filters,houses]);
 if(!data||!suggestions.length)return null;
 return <aside className="search-suggestions" aria-label="Outras possibilidades para sua festa">
 <p>{houses.length?'Outras possibilidades para sua festa':'Não encontrou opções? Experimente outra busca.'}</p>
 {suggestions.map(s=>{const target=s.year===filters.year?`E se for de ${labels[s.period]}?`:s.period===filters.period?`Pensando em ${s.year}?`:`E se for em ${s.year}, de ${labels[s.period]}?`;
 return <div className="search-suggestion" key={s.year+s.period}><span><strong>{target}</strong> {s.added===1?'Há mais 1 casa com referências':'Há mais '+s.added+' casas com referências'} para essa busca.</span><button className="subtle" type="button" aria-label={`Consultar ${s.year}, ${labels[s.period]}: mais ${s.added} casas`} onClick={()=>{setFilters({...filters,year:s.year,period:s.period});setTimeout(()=>document.getElementById('explore')?.scrollIntoView?.({block:'start',behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}),0);}}>Ver opções ⟶</button></div>;})}
 <small>Mantemos a cidade, os convidados e os demais filtros. Sua busca só muda ao clicar em “Ver opções”.</small>
 </aside>;
}
